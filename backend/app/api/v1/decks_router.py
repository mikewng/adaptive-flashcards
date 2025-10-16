from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from sqlalchemy import select, func, case
from app.models.models import Deck, Card, User
from app.schemas.deck import DeckCreate, DeckRead, DeckUpdate, PublicDeckRead
from app.core.dependencies import get_current_user
from datetime import datetime, timezone
from typing import Optional

router = APIRouter()

# Permission helper functions
def get_deck_or_404(deck_id: int, db: Session) -> Deck:
    """Get deck by ID or raise 404"""
    deck = db.get(Deck, deck_id)
    if not deck:
        raise HTTPException(404, "Deck not found")
    return deck

def check_deck_ownership(deck: Deck, user_id: int):
    """Check if user owns the deck, raise 403 if not"""
    if deck.user_id != user_id:
        raise HTTPException(403, "You do not have permission to modify this deck")

def check_deck_access(deck: Deck, user_id: Optional[int] = None):
    """Check if user can access deck (public or owned by user)"""
    if not deck.is_private:
        return  # Public deck, accessible to everyone
    if user_id and deck.user_id == user_id:
        return  # User owns the deck
    raise HTTPException(403, "This deck is private")

@router.post("/", response_model=DeckRead)
def create_deck(payload: DeckCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    deck = Deck(
        name=payload.name,
        description=payload.description,
        is_private=payload.is_private,
        user_id=user.id
    )

    db.add(deck); db.commit(); db.refresh(deck)

    # Add counts for new deck (will be 0)
    deck.card_count = 0
    deck.due_count = 0
    return deck

@router.get("/", response_model=list[DeckRead])
def list_my_decks(db: Session = Depends(get_db),
                  user = Depends(get_current_user)):
    """
    Get all decks for the current user with card counts.
    Uses a single efficient query with LEFT JOIN.
    """
    # Get current time for due card calculation
    now = datetime.now(timezone.utc)

    # Query decks with card counts in a single query
    # Cards are considered "due" if their due_date is in the past/present
    card_count = func.count(Card.id).label("card_count")
    due_count = func.coalesce(
    func.sum(
        case(
            (Card.due_date <= func.now(), 1),
            else_=0,
        )
    ),
    0,
    ).label("due_count")

    stmt = (
        select(Deck, card_count, due_count)
        .outerjoin(Card, Card.deck_id == Deck.id)
        .where(Deck.user_id == user.id)
        .group_by(Deck.id)
        .order_by(Deck.created_at.desc())
    )

    results = db.execute(stmt).all()

    # Build response with counts
    deck_list = []
    for row in results:
        deck = row[0]
        deck_dict = {
            'id': deck.id,
            'name': deck.name,
            'description': deck.description,
            'is_private': deck.is_private,
            'created_at': deck.created_at,
            'card_count': int(row[1]) if row[1] else 0,
            'due_count': int(row[2]) if row[2] is not None else 0
        }
        deck_list.append(DeckRead(**deck_dict))

    return deck_list

@router.get("/public", response_model=list[PublicDeckRead])
def browse_public_decks(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Browse all public decks. No authentication required.
    Supports pagination and optional search by name/description.
    """
    # Get current time for due card calculation
    now = datetime.now(timezone.utc)

    # Build query for public decks with card counts
    card_count = func.count(Card.id).label("card_count")

    stmt = (
        select(Deck, User.email, card_count)
        .join(User, Deck.user_id == User.id)
        .outerjoin(Card, Card.deck_id == Deck.id)
        .where(Deck.is_private == False)
        .group_by(Deck.id, User.email)
        .order_by(Deck.created_at.desc())
    )

    # Add search filter if provided
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            (Deck.name.ilike(search_pattern)) |
            (Deck.description.ilike(search_pattern))
        )

    # Apply pagination
    stmt = stmt.offset(skip).limit(limit)

    results = db.execute(stmt).all()

    # Build response
    deck_list = []
    for row in results:
        deck = row[0]
        owner_email = row[1]
        card_count_val = int(row[2]) if row[2] else 0

        deck_dict = {
            'id': deck.id,
            'name': deck.name,
            'description': deck.description,
            'created_at': deck.created_at,
            'card_count': card_count_val,
            'owner_username': owner_email.split('@')[0]  # Use email prefix as username
        }
        deck_list.append(PublicDeckRead(**deck_dict))

    return deck_list

@router.get("/{deck_id}", response_model=DeckRead)
def get_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get a specific deck. Must be public or owned by user."""
    deck = get_deck_or_404(deck_id, db)
    check_deck_access(deck, user.id if user else None)
    return deck

@router.patch("/{deck_id}", response_model=DeckRead)
def update_deck(
    deck_id: int,
    payload: DeckUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Update deck metadata including privacy settings. Must be owner."""
    deck = get_deck_or_404(deck_id, db)
    check_deck_ownership(deck, user.id)

    # Update fields if provided
    if payload.name is not None:
        deck.name = payload.name
    if payload.description is not None:
        deck.description = payload.description
    if payload.is_private is not None:
        deck.is_private = payload.is_private

    db.commit()
    db.refresh(deck)
    return deck

@router.post("/{deck_id}/copy", response_model=DeckRead)
def copy_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Copy/clone a deck to your library. Deck must be public or owned by you.
    Copies all cards but resets their SRS progress.
    """
    # Get source deck
    source_deck = get_deck_or_404(deck_id, db)
    check_deck_access(source_deck, user.id)

    # Create new deck for the user
    new_deck = Deck(
        name=f"{source_deck.name} (Copy)",
        description=source_deck.description,
        is_private=True,  # Copies are always private by default
        user_id=user.id
    )
    db.add(new_deck)
    db.commit()
    db.refresh(new_deck)

    # Copy all cards from source deck
    source_cards = db.execute(
        select(Card).where(Card.deck_id == source_deck.id)
    ).scalars().all()

    now = datetime.now(timezone.utc)
    for source_card in source_cards:
        new_card = Card(
            deck_id=new_deck.id,
            question=source_card.question,
            answer=source_card.answer,
            # Reset SRS data for new learning
            ease=2.5,
            interval_days=0,
            reps=0,
            lapses=0,
            due_date=now,  # Due immediately for review
            suspended=False,
            # Reset performance tracking
            accuracy_rate=0.0,
            avg_response_time=0,
            typo_count=0,
            last_reviewed=None,
            proficiency_score=0.0,
            times_seen=0
        )
        db.add(new_card)

    db.commit()
    db.refresh(new_deck)

    # Add card count to response
    new_deck.card_count = len(source_cards)
    new_deck.due_count = len(source_cards)  # All cards are due
    return new_deck

@router.delete("/{deck_id}")
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Delete a deck. Must be owner."""
    deck = get_deck_or_404(deck_id, db)
    check_deck_ownership(deck, user.id)

    db.delete(deck)
    db.commit()
    return {"message": "Deck deleted successfully"}
