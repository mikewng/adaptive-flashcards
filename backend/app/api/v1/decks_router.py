from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Deck
from app.schemas.deck import DeckCreate, DeckRead

router = APIRouter()

@router.post("/", response_model=DeckRead)
def create_deck(payload: DeckCreate, db: Session = Depends(get_db)):
    deck = Deck(name=payload.name, description=payload.description, user_id=1)

    db.add(deck); db.commit(); db.refresh(deck)
    return deck

@router.get("/{deck_id}", response_model=DeckRead)
def get_deck(deck_id: int, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck: raise HTTPException(404, "Deck not found")
    
    return deck
