"""
Training script for ML models.

Run this script to train the logistic regression model on available data.
"""
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.ml.training.data_loader import load_training_data, get_training_summary
from app.ml.models.logistic_regression import LikelihoodPredictor
from app.ml.config import MIN_TRAINING_SAMPLES


def train_likelihood_model(db: Session, user_id: int = None) -> dict:
    """
    Train the likelihood to remember model.

    Args:
        db: Database session
        user_id: Optional user ID to train user-specific model

    Returns:
        Dictionary with training results
    """
    print("="*60)
    print("TRAINING LIKELIHOOD TO REMEMBER MODEL")
    print("="*60)

    # Load training data
    X, y, feature_names = load_training_data(db, user_id=user_id)

    # Check if we have enough data
    if len(X) < MIN_TRAINING_SAMPLES:
        print(f"\nERROR: Not enough training data!")
        print(f"Need at least {MIN_TRAINING_SAMPLES} samples, but only have {len(X)}")
        print("\nPlease:")
        print("1. Study more cards to generate training data")
        print("2. Lower MIN_TRAINING_SAMPLES in config.py for testing")
        return {
            'success': False,
            'error': 'Insufficient training data',
            'n_samples': len(X)
        }

    # Print data summary
    summary = get_training_summary(X, y)
    print(f"\nTraining Data Summary:")
    print(f"  Total samples: {summary['n_samples']}")
    print(f"  Positive (correct): {summary['n_positive']} ({summary['positive_rate']*100:.1f}%)")
    print(f"  Negative (incorrect): {summary['n_negative']} ({(1-summary['positive_rate'])*100:.1f}%)")
    print(f"  Number of features: {summary['n_features']}")

    # Train model
    predictor = LikelihoodPredictor()
    metrics = predictor.train(X, y, feature_names)

    # Save model
    predictor.save()

    print("\nTop 10 Most Important Features:")
    for i, (feature, importance) in enumerate(metrics.get('feature_importance', [])[:10], 1):
        print(f"  {i}. {feature}: {importance:.4f}")

    return {
        'success': True,
        'metrics': metrics,
        'summary': summary
    }


def main():
    """Main training function."""
    print("\n" + "="*60)
    print("FLASHCARD ML MODEL TRAINING")
    print("="*60 + "\n")

    # Create database session
    db = SessionLocal()

    try:
        # Train likelihood model
        result = train_likelihood_model(db)

        if result['success']:
            print("\n" + "="*60)
            print("TRAINING SUCCESSFUL!")
            print("="*60)
            print("\nModel files saved:")
            print(f"  - Model: {Path('app/ml/trained_models/logistic_likelihood_v1.pkl').absolute()}")
            print(f"  - Scaler: {Path('app/ml/trained_models/feature_scaler_v1.pkl').absolute()}")
            print(f"\nYou can now use the model for predictions!")
        else:
            print("\n" + "="*60)
            print("TRAINING FAILED")
            print("="*60)
            print(f"Error: {result.get('error')}")
            print("\nTo generate training data:")
            print("  1. Create decks and cards")
            print("  2. Study cards using the writing or flashcard modes")
            print("  3. Complete at least 2 reviews per card")
            print(f"  4. Aim for at least {MIN_TRAINING_SAMPLES} total reviews across all cards")

    finally:
        db.close()


if __name__ == "__main__":
    main()
