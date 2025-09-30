from datetime import date, timedelta
from app.models.models import Card

def apply_sm2_formula(card: Card, q: int) -> None:
    if q < 2:
        card.lapses += 1
        card.interval_days = 1
        card.ease = max(1.3, card.ease - 0.2)
    else:
        card.reps += 1
        card.ease = max(1.3, card.ease + 0.1 - (4 - q)*0.08)
        card.interval_days = 1 if card.interval_days == 0 else round(card.interval_days * card.ease)
    card.due_date = date.today() + timedelta(days=card.interval_days)

