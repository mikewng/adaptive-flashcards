# Flashcard ML Module

Machine Learning features for intelligent flashcard learning.

## Phase 1: Likelihood to Remember (Logistic Regression)

This module predicts the probability that a user will correctly recall a flashcard on their next review.

### Features

- **24 engineered features** including:
  - Card performance (accuracy, response time, times seen)
  - Spaced repetition data (ease, interval, reps, lapses)
  - Temporal patterns (days since review, overdue status)
  - Behavioral metrics (typing speed, hesitation, backspace rate)
  - Recent trends (improving vs declining accuracy)

- **Smart card ranking**: Cards are ordered by likelihood (lowest first), so you review cards you're most likely to forget first

- **Real-time predictions**: Each card shows "Likelihood to Remember" percentage

## Installation

1. Install ML dependencies:
```bash
cd backend
pip install -r requirements.txt
```

This installs:
- scikit-learn (logistic regression)
- numpy (numerical operations)
- pandas (data manipulation)
- joblib (model serialization)

## Usage

### Step 1: Generate Training Data

The model needs historical study data to train. You must:

1. Create decks and flashcards
2. Study cards using writing/flashcard/MC modes
3. Complete at least **2 reviews per card**
4. Aim for **100+ total reviews** across all cards

As you study, the system automatically collects:
- User answers and correctness
- Response times
- Typing behavior (speed, hesitations, backspaces)
- Session context (time of day, position in session)

### Step 2: Train the Model

Once you have sufficient data:

```bash
cd backend
python -m app.ml.training.train_models
```

This will:
- Load training data from the database
- Extract 24 features per review
- Train a Logistic Regression model
- Evaluate on test set (80/20 split)
- Save model to `app/ml/trained_models/`

**Expected Output:**
```
TRAINING LIKELIHOOD TO REMEMBER MODEL
========================================
Loading training data from database...
Processing 45 cards...
Loaded 237 training samples
Positive samples (correct): 189 (79.7%)
Negative samples (incorrect): 48 (20.3%)

Training set: 189 samples
Test set: 48 samples

Classification Report (Test Set):
              precision    recall  f1-score   support
   Incorrect       0.67      0.75      0.71        12
     Correct       0.92      0.89      0.91        36

    accuracy                           0.85        48

TRAINING COMPLETE
========================================
Test Accuracy: 0.854
Test AUC-ROC: 0.893
Test Precision: 0.917
Test Recall: 0.889
Test F1: 0.903
```

### Step 3: Use ML Predictions

The model automatically loads when the FastAPI server starts.

**Backend API:**

Get due cards with ML ranking:
```bash
GET /api/study/deck/{deck_id}/due?use_ml=true
```

Response includes likelihood predictions:
```json
[
  {
    "id": 123,
    "question": "What is the capital of France?",
    "answer": null,
    "likelihood_to_remember": 0.87,
    "likelihood_label": "High"
  },
  {
    "id": 124,
    "question": "What is photosynthesis?",
    "answer": null,
    "likelihood_to_remember": 0.34,
    "likelihood_label": "Low"
  }
]
```

Cards are automatically ranked with **lowest likelihood first** (cards you're likely to forget).

**Disable ML ranking:**
```bash
GET /api/study/deck/{deck_id}/due?use_ml=false
```

This uses traditional due_date ordering.

## Model Performance

Target metrics for good performance:
- **AUC-ROC**: > 0.75 (ability to distinguish correct from incorrect)
- **Precision**: > 0.70 (when predicting "will remember", how often correct)
- **Recall**: > 0.70 (of all cards remembered, how many did we predict)
- **Accuracy**: > 0.70 (overall correctness)

### Feature Importance

Top features that predict likelihood to remember:
1. `accuracy_rate` - Overall historical accuracy
2. `recent_accuracy` - Accuracy in last 5 reviews
3. `ease_factor` - SM-2 difficulty rating
4. `lapses` - Number of times forgotten
5. `days_since_last_review` - Recency of practice

## Configuration

Edit `app/ml/config.py` to adjust:

```python
# Minimum samples needed to train
MIN_TRAINING_SAMPLES = 100

# Train/test split ratio
TRAIN_TEST_SPLIT = 0.2

# Prediction thresholds
HIGH_LIKELIHOOD_THRESHOLD = 0.75  # 75%+ = "High"
LOW_LIKELIHOOD_THRESHOLD = 0.35   # <35% = "Low"

# Logistic Regression parameters
LOGISTIC_C = 1.0  # Regularization strength
LOGISTIC_CLASS_WEIGHT = "balanced"  # Handle imbalanced data
```

## Fallback Behavior

If the ML model is not trained or fails to load:
- System uses **fallback heuristic** based on accuracy_rate and lapses
- Cards still get ranked, but without ML sophistication
- No errors - graceful degradation

## Retraining

Retrain periodically as you collect more data:

```bash
# Retrain with latest data
python -m app.ml.training.train_models

# Restart server to reload model
# (or call ml_service.reload_models() in code)
```

Best practice: Retrain weekly or after every 500 new reviews.

## Troubleshooting

### "Not enough training data"
- You need at least 100 training samples
- Each card needs at least 2 reviews
- Study more cards to generate data
- For testing: lower `MIN_TRAINING_SAMPLES` in config.py

### "Model files not found"
- Run training script first: `python -m app.ml.training.train_models`
- Check `app/ml/trained_models/` directory exists
- Verify model files were created

### "ML predictions not showing"
- Check server logs for model loading status
- Verify `use_ml=true` in API request
- Ensure model trained successfully
- Check for errors in console output

### Poor model performance (low accuracy/AUC)
- Need more training data (aim for 500+ samples)
- Data might be imbalanced (too many correct or incorrect)
- Try adjusting hyperparameters in config.py
- Check feature engineering - some features might be all zeros

## File Structure

```
app/ml/
├── __init__.py
├── README.md (this file)
├── config.py                    # Configuration settings
├── models/
│   ├── __init__.py
│   └── logistic_regression.py   # Likelihood predictor model
├── training/
│   ├── __init__.py
│   ├── data_loader.py           # Load training data from DB
│   └── train_models.py          # Training script
├── inference/
│   ├── __init__.py
│   └── predictor.py             # Production prediction service
├── utils/
│   ├── __init__.py
│   └── feature_engineer.py      # Feature extraction
└── trained_models/              # Saved model files
    ├── logistic_likelihood_v1.pkl
    ├── feature_scaler_v1.pkl
    └── logistic_likelihood_v1_features.pkl
```

## Next Steps

After Phase 1 is working:

- **Phase 2**: Bayesian Knowledge Tracing (track mastery state)
- **Phase 3**: Feed Forward Neural Network (pattern recognition)
- **Additional features**: Session planning, difficulty prediction, optimal review times

## Technical Details

### Feature Engineering

24 features per card:
- **Basic stats** (4): accuracy_rate, avg_response_time_ms, times_seen, typo_count
- **SM-2 data** (4): ease_factor, interval_days, repetitions, lapses
- **Temporal** (3): days_since_last_review, days_until_due, is_overdue
- **Derived** (3): success_per_attempt, lapse_rate, avg_response_time_sec
- **Recent trends** (6): recent_accuracy, accuracy_improving, avg_recent_time_ms, hesitation_rate, avg_typing_speed_cpm, avg_backspace_rate
- **Complexity** (3): question_length, answer_length, answer_word_count

### Model Architecture

- **Algorithm**: Logistic Regression (sklearn)
- **Regularization**: L2 (C=1.0)
- **Solver**: LBFGS
- **Class weighting**: Balanced (handles imbalanced data)
- **Scaling**: StandardScaler (zero mean, unit variance)

### Data Pipeline

1. **Data collection**: CardMetrics table (created on every review)
2. **Feature extraction**: 24 features from Card + CardMetrics
3. **Training**: Historical reviews → (features, label) pairs
4. **Prediction**: Current card state → likelihood probability
5. **Ranking**: Sort cards by likelihood (lowest first)

## Support

For issues or questions:
1. Check this README
2. Review code comments in source files
3. Examine training logs for clues
4. Verify database has CardMetrics data
