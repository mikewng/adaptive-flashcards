"""
Data loading utilities for ML model training.

Loads training data from CardMetrics and Card tables.
"""
from typing import List, Tuple, Optional
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from datetime import datetime, timezone, timedelta

from app.models.models import Card, CardMetrics, Review
from app.ml.utils.feature_engineer import extract_card_features, get_feature_names


def load_training_data(
    db: Session,
    user_id: Optional[int] = None,
    min_reviews_per_card: int = 2
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Load training data for logistic regression model.

    The target variable is: Will the user answer correctly on next review?

    Strategy:
    1. Get all cards with at least min_reviews_per_card reviews
    2. For each review (except the last), create a training sample:
       - Features: Card state BEFORE the review
       - Target: Whether they got it correct (similarity_score >= 0.8)
    3. Return X (features) and y (targets)

    Args:
        db: Database session
        user_id: Optional user ID to filter data
        min_reviews_per_card: Minimum reviews needed per card

    Returns:
        Tuple of (X, y, feature_names)
        - X: Feature matrix (n_samples, n_features)
        - y: Target vector (n_samples,) - 1 if correct, 0 if incorrect
        - feature_names: List of feature names
    """
    print("Loading training data from database...")

    # Get all reviews ordered by card and time
    stmt = select(CardMetrics).order_by(
        CardMetrics.card_id.asc(),
        CardMetrics.created_at.asc()
    )

    if user_id:
        # Filter by user if specified
        stmt = stmt.join(Review).where(Review.user_id == user_id)

    all_metrics = db.scalars(stmt).all()

    # Group metrics by card
    card_metrics_map = {}
    for metric in all_metrics:
        if metric.card_id not in card_metrics_map:
            card_metrics_map[metric.card_id] = []
        card_metrics_map[metric.card_id].append(metric)

    # Build training samples
    X_list = []
    y_list = []
    feature_names = get_feature_names()

    print(f"Processing {len(card_metrics_map)} cards...")

    for card_id, metrics in card_metrics_map.items():
        if len(metrics) < min_reviews_per_card:
            continue

        # Get the card
        card = db.get(Card, card_id)
        if not card:
            continue

        # For each review (except the first), create a training sample
        # We use the card state BEFORE the review to predict the outcome
        for i in range(1, len(metrics)):
            current_metric = metrics[i]

            # Simulate card state before this review
            # (This is approximate - ideally we'd track historical states)
            card_snapshot = _create_card_snapshot(card, metrics[:i])

            # Extract features from the snapshot
            features = extract_card_features(card_snapshot, db)

            # Target: Was this review correct?
            # Define "correct" as similarity >= 0.8 or was_correct = True
            target = 1 if current_metric.was_correct else 0

            # Convert features to array
            feature_array = [features.get(name, 0.0) for name in feature_names]

            X_list.append(feature_array)
            y_list.append(target)

    if not X_list:
        print("WARNING: No training data available!")
        return np.array([]), np.array([]), feature_names

    X = np.array(X_list)
    y = np.array(y_list)

    print(f"Loaded {len(X)} training samples")
    print(f"Positive samples (correct): {np.sum(y)} ({np.mean(y)*100:.1f}%)")
    print(f"Negative samples (incorrect): {len(y) - np.sum(y)} ({(1-np.mean(y))*100:.1f}%)")

    return X, y, feature_names


def _create_card_snapshot(card: Card, past_metrics: List[CardMetrics]) -> Card:
    """
    Create a snapshot of the card state based on past metrics.

    This approximates what the card looked like before a specific review.
    """
    # Create a copy of the card
    snapshot = Card(
        id=card.id,
        deck_id=card.deck_id,
        question=card.question,
        answer=card.answer,
    )

    # Calculate statistics from past metrics
    if past_metrics:
        correct_count = sum(1 for m in past_metrics if m.was_correct)
        total_count = len(past_metrics)

        snapshot.accuracy_rate = (correct_count / total_count) * 100
        snapshot.times_seen = total_count

        # Average response time
        valid_times = [m.time_taken_ms for m in past_metrics if m.time_taken_ms]
        snapshot.avg_response_time = int(np.mean(valid_times)) if valid_times else 0

        # Typo count (approximate)
        snapshot.typo_count = sum(
            1 for m in past_metrics
            if m.similarity_score and 0.8 <= m.similarity_score < 0.95
        )

        # Last reviewed
        snapshot.last_reviewed = past_metrics[-1].created_at
    else:
        snapshot.accuracy_rate = 0.0
        snapshot.times_seen = 0
        snapshot.avg_response_time = 0
        snapshot.typo_count = 0
        snapshot.last_reviewed = None

    # Use card's current SM-2 values (we don't track historical SM-2 states)
    # This is a limitation but acceptable for MVP
    snapshot.ease = card.ease
    snapshot.interval_days = card.interval_days
    snapshot.reps = card.reps
    snapshot.lapses = card.lapses
    snapshot.due_date = card.due_date

    return snapshot


def get_training_summary(X: np.ndarray, y: np.ndarray) -> dict:
    """Get summary statistics about the training data."""
    return {
        'n_samples': len(X),
        'n_features': X.shape[1] if len(X) > 0 else 0,
        'n_positive': int(np.sum(y)),
        'n_negative': int(len(y) - np.sum(y)),
        'positive_rate': float(np.mean(y)) if len(y) > 0 else 0.0,
        'feature_means': np.mean(X, axis=0).tolist() if len(X) > 0 else [],
        'feature_stds': np.std(X, axis=0).tolist() if len(X) > 0 else [],
    }
