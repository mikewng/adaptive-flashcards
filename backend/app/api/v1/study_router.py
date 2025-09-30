from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import date
from app.core.database import get_db
from app.models.models import Card, Review
from app.schemas.review import ReviewCreate
from app.services.scheduler import apply_sm2_formula

router = APIRouter()

@router.get("/next")
def next_cards(deck_id: int, n: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    stmt = (select(Card)
            .where(Card.deck_id == deck_id, Card.suspended == False, Card.due_date <= date.today())
            .order_by(Card.due_date.asc())
            .limit(n))
    cards = db.scalars(stmt).all()
    return [{"id": c.id, "question": c.question, "answer": None} for c in cards]  # hide answer

@router.post("/review")
def review(payload: ReviewCreate, db: Session = Depends(get_db)):
    card = db.get(Card, payload.card_id)
    if not card: raise HTTPException(404, "Card not found")

    r = Review(card_id=card.id, user_id=1, response=payload.response, took_ms=payload.took_ms)
    db.add(r)
    
    apply_sm2_formula(card, payload.response)
    db.add(card)
    db.commit()
    return {"ok": True, "card_id": card.id, "next_due": card.due_date}
