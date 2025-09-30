from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Card, Deck
from app.schemas.card import CardCreate, CardRead

router = APIRouter(prefix="/cards")

@router.post("/", response_model=CardRead)
def create_card(payload: CardCreate, db: Session = Depends(get_db)):
    if not db.get(Deck, payload.deck_id): raise HTTPException(404, "Deck not found")
    
    card = Card(deck_id=payload.deck_id, question=payload.question, answer=payload.answer)
    db.add(card); db.commit(); db.refresh(card)
    return card

@router.get("/{card_id}", response_model=CardRead)
def get_card(card_id: int, db: Session = Depends(get_db)):
    card = db.get(Card, card_id)
    if not card: raise HTTPException(404, "Card not found")
    return card
