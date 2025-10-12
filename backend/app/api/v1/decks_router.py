from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from sqlalchemy import select, func, case
from app.models.models import Deck, Card
from app.schemas.deck import DeckCreate, DeckRead
from app.core.dependencies import get_current_user
from datetime import datetime, timezone

router = APIRouter()

@router.post("/", response_model=DeckRead)
def create_deck(payload: DeckCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    deck = Deck(name=payload.name, description=payload.description, user_id=user.id)

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
            'created_at': deck.created_at,
            'card_count': int(row[1]) if row[1] else 0,
            'due_count': int(row[2]) if row[2] is not None else 0
        }
        deck_list.append(DeckRead(**deck_dict))

    return deck_list

@router.get("/{deck_id}", response_model=DeckRead)
def get_deck(deck_id: int, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck: raise HTTPException(404, "Deck not found")
    return deck

@router.delete("/{deck_id}")
def delete_deck(deck_id: int, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck: raise HTTPException(404, "Deck not found")

    db.delete(deck)
    db.commit()
    return {"message": "Deck deleted successfully"}
