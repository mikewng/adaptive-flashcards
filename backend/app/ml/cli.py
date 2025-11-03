"""
CLI tool for ML model management.

Usage:
    python -m app.ml.cli status    # Check ML status
    python -m app.ml.cli train     # Train models
    python -m app.ml.cli test      # Test predictions
"""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

from app.core.database import SessionLocal
from app.ml.inference.predictor import ml_service
from app.ml.training.train_models import train_likelihood_model
from app.ml.config import MODELS_DIR, MIN_TRAINING_SAMPLES


def check_status():
    """Check ML model status."""
    print("\n" + "="*60)
    print("ML MODEL STATUS")
    print("="*60)

    # Check model files
    print("\nModel Files:")
    model_files = list(MODELS_DIR.glob("*.pkl"))
    if model_files:
        for f in model_files:
            size = f.stat().st_size / 1024  # KB
            print(f"  [OK] {f.name} ({size:.1f} KB)")
    else:
        print("  [X] No model files found")

    # Check if model is loaded
    print("\nModel Loading:")
    if ml_service.is_model_loaded():
        print("  [OK] Model loaded and ready for predictions")
    else:
        print("  [X] Model not loaded (run training first)")

    # Check database
    print("\nDatabase:")
    db = SessionLocal()
    try:
        from sqlalchemy import text
        result = db.execute(text("SELECT COUNT(*) FROM card_metrics")).scalar()
        print(f"  [OK] CardMetrics table: {result} reviews recorded")

        if result < MIN_TRAINING_SAMPLES:
            print(f"  [!] Need {MIN_TRAINING_SAMPLES - result} more reviews to train")
        else:
            print(f"  [OK] Sufficient data for training")

    except Exception as e:
        print(f"  [X] Database error: {e}")
    finally:
        db.close()

    print("\n" + "="*60 + "\n")


def train():
    """Train ML models."""
    db = SessionLocal()
    try:
        result = train_likelihood_model(db)
        if result['success']:
            print("\n[OK] Training completed successfully!")
            return 0
        else:
            print(f"\n[X] Training failed: {result.get('error')}")
            return 1
    finally:
        db.close()


def test_predictions():
    """Test predictions on sample cards."""
    print("\n" + "="*60)
    print("TESTING ML PREDICTIONS")
    print("="*60)

    if not ml_service.is_model_loaded():
        print("\n[X] Model not loaded. Run training first.")
        return 1

    db = SessionLocal()
    try:
        from app.models.models import Card
        from sqlalchemy import select

        # Get some sample cards
        stmt = select(Card).limit(5)
        cards = list(db.scalars(stmt).all())

        if not cards:
            print("\n[X] No cards in database")
            return 1

        print(f"\nTesting predictions on {len(cards)} sample cards:\n")

        for card in cards:
            likelihood = ml_service.predict_likelihood(card, db)
            label = ml_service.get_likelihood_label(likelihood)
            color = ml_service.get_likelihood_color(likelihood)

            print(f"Card {card.id}: {card.question[:50]}...")
            print(f"  Likelihood: {likelihood*100:.1f}% ({label})")
            print(f"  Accuracy: {card.accuracy_rate:.1f}%")
            print(f"  Times seen: {card.times_seen}")
            print(f"  Color: {color}")
            print()

        print("[OK] Predictions working correctly!")
        return 0

    except Exception as e:
        print(f"\n[X] Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()


def main():
    """Main CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m app.ml.cli status    # Check ML status")
        print("  python -m app.ml.cli train     # Train models")
        print("  python -m app.ml.cli test      # Test predictions")
        return 1

    command = sys.argv[1].lower()

    if command == "status":
        check_status()
        return 0
    elif command == "train":
        return train()
    elif command == "test":
        return test_predictions()
    else:
        print(f"Unknown command: {command}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
