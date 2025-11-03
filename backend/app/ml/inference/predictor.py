"""
Prediction service for production inference.

This module provides a singleton predictor that loads once and serves predictions.
"""
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session

from app.models.models import Card
from app.ml.models.logistic_regression import LikelihoodPredictor
from app.ml.utils.feature_engineer import extract_card_features
from app.ml.config import (
    HIGH_LIKELIHOOD_THRESHOLD,
    LOW_LIKELIHOOD_THRESHOLD
)


class MLPredictionService:
    """
    Singleton service for ML predictions in production.

    Loads models once on initialization and caches them for fast inference.
    """

    _instance: Optional['MLPredictionService'] = None
    _predictor: Optional[LikelihoodPredictor] = None
    _is_loaded: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize and load models if not already loaded."""
        if not self._is_loaded:
            self._load_models()

    def _load_models(self):
        """Load ML models from disk."""
        try:
            self._predictor = LikelihoodPredictor()
            success = self._predictor.load()

            if success:
                self._is_loaded = True
                print("ML models loaded successfully!")
            else:
                print("WARNING: ML models not found. Predictions will use fallback.")
                self._is_loaded = False
        except Exception as e:
            print(f"ERROR loading ML models: {e}")
            self._is_loaded = False

    def predict_likelihood(
        self,
        card: Card,
        db: Session,
        user_id: Optional[int] = None
    ) -> float:
        """
        Predict likelihood that user will remember this card.

        Args:
            card: The Card object
            db: Database session
            user_id: Optional user ID for user-specific features

        Returns:
            Probability between 0.0 and 1.0
            - 1.0 = 100% likely to remember
            - 0.0 = 0% likely to remember (will forget)
        """
        # If model not loaded, use fallback heuristic
        if not self._is_loaded or self._predictor is None:
            return self._fallback_likelihood(card)

        try:
            # Extract features
            features = extract_card_features(card, db, user_id)

            # Predict
            likelihood = self._predictor.predict_single(features)

            return float(likelihood)

        except Exception as e:
            print(f"ERROR during prediction: {e}")
            return self._fallback_likelihood(card)

    def _fallback_likelihood(self, card: Card) -> float:
        """
        Fallback heuristic when ML model is unavailable.

        Uses simple rule-based approach based on accuracy rate and lapses.
        """
        accuracy = card.accuracy_rate or 0.0
        lapses = card.lapses or 0

        # Base likelihood from accuracy
        base_likelihood = accuracy / 100.0

        # Penalty for lapses
        lapse_penalty = min(lapses * 0.05, 0.3)  # Max 30% penalty

        likelihood = max(0.0, min(1.0, base_likelihood - lapse_penalty))

        return likelihood

    def get_likelihood_label(self, likelihood: float) -> str:
        """
        Convert likelihood probability to human-readable label.

        Args:
            likelihood: Probability (0.0 to 1.0)

        Returns:
            Label string: "High", "Medium", or "Low"
        """
        if likelihood >= HIGH_LIKELIHOOD_THRESHOLD:
            return "High"
        elif likelihood <= LOW_LIKELIHOOD_THRESHOLD:
            return "Low"
        else:
            return "Medium"

    def get_likelihood_color(self, likelihood: float) -> str:
        """
        Get color indicator for likelihood.

        Args:
            likelihood: Probability (0.0 to 1.0)

        Returns:
            Color string: "green", "yellow", or "red"
        """
        if likelihood >= HIGH_LIKELIHOOD_THRESHOLD:
            return "green"
        elif likelihood <= LOW_LIKELIHOOD_THRESHOLD:
            return "red"
        else:
            return "yellow"

    def rank_cards_by_priority(
        self,
        cards: List[Card],
        db: Session,
        user_id: Optional[int] = None
    ) -> List[Tuple[Card, float]]:
        """
        Rank cards by review priority (lowest likelihood first).

        Cards with lower likelihood should be reviewed first as they are
        more likely to be forgotten.

        Args:
            cards: List of Card objects
            db: Database session
            user_id: Optional user ID

        Returns:
            List of tuples (card, likelihood) sorted by likelihood ascending
        """
        # Calculate likelihood for each card
        cards_with_likelihood = [
            (card, self.predict_likelihood(card, db, user_id))
            for card in cards
        ]

        # Sort by likelihood (ascending) - lowest first
        cards_with_likelihood.sort(key=lambda x: x[1])

        return cards_with_likelihood

    def is_model_loaded(self) -> bool:
        """Check if ML model is loaded and ready."""
        return self._is_loaded

    def reload_models(self):
        """Reload models from disk (useful after retraining)."""
        self._is_loaded = False
        self._load_models()


# Global singleton instance
ml_service = MLPredictionService()


def predict_card_likelihood(card: Card, db: Session, user_id: Optional[int] = None) -> float:
    """
    Convenience function to predict likelihood for a single card.

    Args:
        card: The Card object
        db: Database session
        user_id: Optional user ID

    Returns:
        Probability between 0.0 and 1.0
    """
    return ml_service.predict_likelihood(card, db, user_id)
