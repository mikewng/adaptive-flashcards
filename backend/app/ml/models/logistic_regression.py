"""
Logistic Regression model for predicting likelihood to remember.

This model predicts the probability that a user will correctly recall
a flashcard on their next review attempt.
"""
from typing import Optional, Tuple
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report
)
import joblib

from app.ml.config import (
    LOGISTIC_C,
    LOGISTIC_MAX_ITER,
    LOGISTIC_CLASS_WEIGHT,
    TRAIN_TEST_SPLIT,
    RANDOM_STATE,
    LOGISTIC_MODEL_PATH,
    SCALER_PATH
)


class LikelihoodPredictor:
    """
    Predicts the likelihood that a user will remember a flashcard.

    Uses Logistic Regression with feature scaling.
    """

    def __init__(self):
        self.model: Optional[LogisticRegression] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: Optional[list] = None
        self.is_trained: bool = False

    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        feature_names: list
    ) -> dict:
        """
        Train the logistic regression model.

        Args:
            X: Feature matrix (n_samples, n_features)
            y: Target vector (n_samples,) - 1 if correct, 0 if incorrect
            feature_names: List of feature names

        Returns:
            Dictionary with training metrics
        """
        print("Training Logistic Regression model...")
        self.feature_names = feature_names

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=TRAIN_TEST_SPLIT,
            random_state=RANDOM_STATE,
            stratify=y if len(np.unique(y)) > 1 else None
        )

        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")

        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model
        self.model = LogisticRegression(
            C=LOGISTIC_C,
            max_iter=LOGISTIC_MAX_ITER,
            class_weight=LOGISTIC_CLASS_WEIGHT,
            random_state=RANDOM_STATE,
            solver='lbfgs'
        )

        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True

        # Evaluate
        metrics = self._evaluate(X_train_scaled, y_train, X_test_scaled, y_test)

        print("\n" + "="*50)
        print("TRAINING COMPLETE")
        print("="*50)
        print(f"Test Accuracy: {metrics['test_accuracy']:.3f}")
        print(f"Test AUC-ROC: {metrics['test_auc']:.3f}")
        print(f"Test Precision: {metrics['test_precision']:.3f}")
        print(f"Test Recall: {metrics['test_recall']:.3f}")
        print(f"Test F1: {metrics['test_f1']:.3f}")
        print("="*50 + "\n")

        return metrics

    def _evaluate(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> dict:
        """Evaluate model performance."""
        # Predictions
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)

        # Probabilities
        y_train_proba = self.model.predict_proba(X_train)[:, 1]
        y_test_proba = self.model.predict_proba(X_test)[:, 1]

        # Metrics
        metrics = {
            'train_accuracy': accuracy_score(y_train, y_train_pred),
            'test_accuracy': accuracy_score(y_test, y_test_pred),
            'train_precision': precision_score(y_train, y_train_pred, zero_division=0),
            'test_precision': precision_score(y_test, y_test_pred, zero_division=0),
            'train_recall': recall_score(y_train, y_train_pred, zero_division=0),
            'test_recall': recall_score(y_test, y_test_pred, zero_division=0),
            'train_f1': f1_score(y_train, y_train_pred, zero_division=0),
            'test_f1': f1_score(y_test, y_test_pred, zero_division=0),
            'train_auc': roc_auc_score(y_train, y_train_proba) if len(np.unique(y_train)) > 1 else 0.5,
            'test_auc': roc_auc_score(y_test, y_test_proba) if len(np.unique(y_test)) > 1 else 0.5,
        }

        # Feature importance (coefficient magnitudes)
        if self.feature_names:
            feature_importance = dict(zip(
                self.feature_names,
                np.abs(self.model.coef_[0])
            ))
            metrics['feature_importance'] = sorted(
                feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]  # Top 10 features

        # Classification report
        print("\nClassification Report (Test Set):")
        print(classification_report(y_test, y_test_pred, target_names=['Incorrect', 'Correct']))

        return metrics

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Predict probability of remembering (correctness).

        Args:
            X: Feature matrix (n_samples, n_features)

        Returns:
            Array of probabilities (n_samples,)
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")

        X_scaled = self.scaler.transform(X)
        # Return probability of class 1 (correct)
        return self.model.predict_proba(X_scaled)[:, 1]

    def predict_single(self, features: dict) -> float:
        """
        Predict likelihood for a single card.

        Args:
            features: Dictionary of features

        Returns:
            Probability of remembering (0.0 to 1.0)
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")

        # Convert features to array in correct order
        feature_array = np.array([
            features.get(name, 0.0) for name in self.feature_names
        ]).reshape(1, -1)

        return self.predict_proba(feature_array)[0]

    def save(self, model_path: Optional[str] = None, scaler_path: Optional[str] = None):
        """Save model and scaler to disk."""
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")

        model_path = model_path or LOGISTIC_MODEL_PATH
        scaler_path = scaler_path or SCALER_PATH

        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        joblib.dump(self.feature_names, str(model_path).replace('.pkl', '_features.pkl'))

        print(f"Model saved to: {model_path}")
        print(f"Scaler saved to: {scaler_path}")

    def load(self, model_path: Optional[str] = None, scaler_path: Optional[str] = None):
        """Load model and scaler from disk."""
        model_path = model_path or LOGISTIC_MODEL_PATH
        scaler_path = scaler_path or SCALER_PATH

        try:
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.feature_names = joblib.load(str(model_path).replace('.pkl', '_features.pkl'))
            self.is_trained = True
            print(f"Model loaded from: {model_path}")
            return True
        except FileNotFoundError:
            print(f"Model files not found at {model_path}")
            return False
