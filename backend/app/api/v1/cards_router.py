from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Card, Deck
from app.schemas.card import CardCreate, CardRead, CardUpdate
from typing import List

router = APIRouter()

@router.post("/", response_model=CardRead)
def create_card(payload: CardCreate, db: Session = Depends(get_db)):
    if not db.get(Deck, payload.deck_id): raise HTTPException(404, "Deck not found")

    card = Card(deck_id=payload.deck_id, question=payload.question, answer=payload.answer)
    db.add(card); db.commit(); db.refresh(card)
    return card

@router.get("/deck/{deck_id}", response_model=List[CardRead])
def get_cards_by_deck(deck_id: int, db: Session = Depends(get_db)):
    if not db.get(Deck, deck_id): raise HTTPException(404, "Deck not found")
    cards = db.query(Card).filter(Card.deck_id == deck_id).all()
    return cards

@router.get("/{card_id}", response_model=CardRead)
def get_card(card_id: int, db: Session = Depends(get_db)):
    card = db.get(Card, card_id)
    if not card: raise HTTPException(404, "Card not found")
    return card

@router.put("/{card_id}", response_model=CardRead)
def update_card(card_id: int, payload: CardUpdate, db: Session = Depends(get_db)):
    card = db.get(Card, card_id)
    if not card: raise HTTPException(404, "Card not found")

    if payload.question is not None:
        card.question = payload.question
    if payload.answer is not None:
        card.answer = payload.answer

    db.commit()
    db.refresh(card)
    return card

@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    card = db.get(Card, card_id)
    if not card: raise HTTPException(404, "Card not found")

    db.delete(card)
    db.commit()
    return {"message": "Card deleted successfully"}
