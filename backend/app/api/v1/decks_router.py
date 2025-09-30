from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from sqlalchemy import select
from app.models.models import Deck
from app.schemas.deck import DeckCreate, DeckRead
from app.core.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=DeckRead)
def create_deck(payload: DeckCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    deck = Deck(name=payload.name, description=payload.description, user_id=user.id)

    db.add(deck); db.commit(); db.refresh(deck)
    return deck

@router.get("/", response_model=list[DeckRead])
def list_my_decks(db: Session = Depends(get_db),
                  user = Depends(get_current_user)):
    stmt = select(Deck).where(Deck.user_id == user.id).order_by(Deck.created_at.desc())
    return db.scalars(stmt).all()

@router.get("/{deck_id}", response_model=DeckRead)
def get_deck(deck_id: int, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck: raise HTTPException(404, "Deck not found")
    
    return deck
