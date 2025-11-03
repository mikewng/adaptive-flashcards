"""
Feature engineering for ML models.

Extracts and transforms features from Card and CardMetrics data
for training and inference.
"""
from typing import Dict, List, Optional
import numpy as np
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models.models import Card, CardMetrics, Review


def extract_card_features(
    card: Card,
    db: Session,
    user_id: Optional[int] = None
) -> Dict[str, float]:
    """
    Extract features from a card for likelihood prediction.

    Features include:
    - Card performance metrics (accuracy, response time, etc.)
    - Spaced repetition data (ease, interval, reps, lapses)
    - Temporal features (days since last review, time patterns)
    - Behavioral patterns (typing speed, hesitation, etc.)

    Args:
        card: The Card object
        db: Database session
        user_id: Optional user ID to filter metrics

    Returns:
        Dictionary of feature names to values
    """
    features = {}

    # ========== BASIC CARD STATISTICS ==========
    features['accuracy_rate'] = card.accuracy_rate or 0.0
    features['avg_response_time_ms'] = card.avg_response_time or 0
    features['times_seen'] = card.times_seen or 0
    features['typo_count'] = card.typo_count or 0

    # ========== SM-2 SPACED REPETITION DATA ==========
    features['ease_factor'] = card.ease or 2.5
    features['interval_days'] = card.interval_days or 0
    features['repetitions'] = card.reps or 0
    features['lapses'] = card.lapses or 0

    # ========== TEMPORAL FEATURES ==========
    if card.last_reviewed:
        days_since_review = (datetime.now(timezone.utc) - card.last_reviewed).days
        features['days_since_last_review'] = days_since_review
    else:
        features['days_since_last_review'] = 999  # New card

    if card.due_date:
        days_until_due = (card.due_date - datetime.now(timezone.utc)).days
        features['days_until_due'] = days_until_due
        features['is_overdue'] = 1.0 if days_until_due < 0 else 0.0
    else:
        features['days_until_due'] = 0
        features['is_overdue'] = 0.0

    # ========== DERIVED FEATURES ==========
    # Success rate per repetition (efficiency metric)
    if features['times_seen'] > 0:
        features['success_per_attempt'] = features['repetitions'] / features['times_seen']
    else:
        features['success_per_attempt'] = 0.0

    # Lapse rate
    if features['times_seen'] > 0:
        features['lapse_rate'] = features['lapses'] / features['times_seen']
    else:
        features['lapse_rate'] = 0.0

    # Response time normalized (seconds)
    features['avg_response_time_sec'] = features['avg_response_time_ms'] / 1000.0

    # ========== RECENT PERFORMANCE TRENDS (from CardMetrics) ==========
    recent_metrics = _get_recent_metrics(db, card.id, limit=5)

    if recent_metrics:
        # Calculate trend features
        features.update(_calculate_trend_features(recent_metrics))
    else:
        # No history - use defaults
        features['recent_accuracy'] = features['accuracy_rate']
        features['accuracy_improving'] = 0.0
        features['avg_recent_time_ms'] = features['avg_response_time_ms']
        features['hesitation_rate'] = 0.0
        features['avg_typing_speed_cpm'] = 0.0
        features['avg_backspace_rate'] = 0.0

    # ========== QUESTION/ANSWER COMPLEXITY ==========
    features['question_length'] = len(card.question)
    features['answer_length'] = len(card.answer)
    features['answer_word_count'] = len(card.answer.split())

    return features


def _get_recent_metrics(db: Session, card_id: int, limit: int = 5) -> List[CardMetrics]:
    """Get the most recent CardMetrics for a card."""
    stmt = (
        select(CardMetrics)
        .where(CardMetrics.card_id == card_id)
        .order_by(CardMetrics.created_at.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


def _calculate_trend_features(metrics: List[CardMetrics]) -> Dict[str, float]:
    """Calculate trend features from recent metrics."""
    features = {}

    # Recent accuracy
    correct_count = sum(1 for m in metrics if m.was_correct)
    features['recent_accuracy'] = (correct_count / len(metrics)) * 100 if metrics else 0.0

    # Accuracy trend (improving vs declining)
    if len(metrics) >= 4:
        recent_half = metrics[:len(metrics)//2]
        older_half = metrics[len(metrics)//2:]
        recent_acc = sum(1 for m in recent_half if m.was_correct) / len(recent_half)
        older_acc = sum(1 for m in older_half if m.was_correct) / len(older_half)
        features['accuracy_improving'] = 1.0 if recent_acc > older_acc else 0.0
    else:
        features['accuracy_improving'] = 0.0

    # Average recent response time
    valid_times = [m.time_taken_ms for m in metrics if m.time_taken_ms]
    features['avg_recent_time_ms'] = np.mean(valid_times) if valid_times else 0.0

    # Behavioral features
    hesitation_count = sum(1 for m in metrics if m.hesitation_detected)
    features['hesitation_rate'] = hesitation_count / len(metrics) if metrics else 0.0

    # Typing speed (average CPM)
    typing_speeds = [m.typing_speed_cpm for m in metrics if m.typing_speed_cpm]
    features['avg_typing_speed_cpm'] = np.mean(typing_speeds) if typing_speeds else 0.0

    # Backspace usage rate
    backspace_counts = [m.backspace_count for m in metrics if m.backspace_count is not None]
    typed_chars = [m.typed_chars for m in metrics if m.typed_chars and m.typed_chars > 0]
    if backspace_counts and typed_chars:
        backspace_rate = np.mean([b / t for b, t in zip(backspace_counts, typed_chars)])
        features['avg_backspace_rate'] = backspace_rate
    else:
        features['avg_backspace_rate'] = 0.0

    return features


def features_to_array(features: Dict[str, float], feature_names: List[str]) -> np.ndarray:
    """
    Convert feature dictionary to numpy array in consistent order.

    Args:
        features: Dictionary of features
        feature_names: Ordered list of feature names

    Returns:
        Numpy array of feature values
    """
    return np.array([features.get(name, 0.0) for name in feature_names])


def get_feature_names() -> List[str]:
    """
    Get the canonical ordered list of feature names.
    This must match the order used during training.
    """
    return [
        # Basic statistics
        'accuracy_rate',
        'avg_response_time_ms',
        'times_seen',
        'typo_count',

        # SM-2 data
        'ease_factor',
        'interval_days',
        'repetitions',
        'lapses',

        # Temporal
        'days_since_last_review',
        'days_until_due',
        'is_overdue',

        # Derived
        'success_per_attempt',
        'lapse_rate',
        'avg_response_time_sec',

        # Recent trends
        'recent_accuracy',
        'accuracy_improving',
        'avg_recent_time_ms',
        'hesitation_rate',
        'avg_typing_speed_cpm',
        'avg_backspace_rate',

        # Complexity
        'question_length',
        'answer_length',
        'answer_word_count',
    ]
