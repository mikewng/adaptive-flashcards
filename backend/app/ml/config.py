"""
ML Configuration settings
"""
from pathlib import Path

# Paths
ML_ROOT = Path(__file__).parent
MODELS_DIR = ML_ROOT / "trained_models"
MODELS_DIR.mkdir(exist_ok=True)

# Model file paths
LOGISTIC_MODEL_PATH = MODELS_DIR / "logistic_likelihood_v1.pkl"
SCALER_PATH = MODELS_DIR / "feature_scaler_v1.pkl"

# Training configuration
MIN_TRAINING_SAMPLES = 100  # Minimum reviews needed to train
TRAIN_TEST_SPLIT = 0.2
RANDOM_STATE = 42

# Feature engineering
LOOKBACK_REVIEWS = 5  # Number of recent reviews to consider for trends

# Logistic Regression hyperparameters
LOGISTIC_C = 1.0  # Regularization strength
LOGISTIC_MAX_ITER = 1000
LOGISTIC_CLASS_WEIGHT = "balanced"  # Handle class imbalance

# Prediction thresholds
HIGH_LIKELIHOOD_THRESHOLD = 0.75  # 75%+ = High confidence
LOW_LIKELIHOOD_THRESHOLD = 0.35   # <35% = Likely to forget
