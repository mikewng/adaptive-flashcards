# ML Phase 1 Implementation Summary

## What Was Implemented

### Phase 1: Logistic Regression for "Likelihood to Remember"

A complete ML pipeline that predicts the probability a user will correctly recall a flashcard.

## Architecture

### 1. Feature Engineering (`utils/feature_engineer.py`)

**24 engineered features** extracted from each card:

- **Basic Performance** (4 features):
  - `accuracy_rate`: Overall correctness percentage
  - `avg_response_time_ms`: Average time to answer
  - `times_seen`: Total review count
  - `typo_count`: Number of typos made

- **Spaced Repetition Data** (4 features):
  - `ease_factor`: SM-2 difficulty rating
  - `interval_days`: Days between reviews
  - `repetitions`: Successful review count
  - `lapses`: Number of times forgotten

- **Temporal Features** (3 features):
  - `days_since_last_review`: Recency of practice
  - `days_until_due`: How overdue is the card
  - `is_overdue`: Binary overdue flag

- **Derived Metrics** (3 features):
  - `success_per_attempt`: Efficiency ratio
  - `lapse_rate`: Forgetting frequency
  - `avg_response_time_sec`: Normalized time

- **Recent Trends** (6 features):
  - `recent_accuracy`: Last 5 reviews accuracy
  - `accuracy_improving`: Trend direction (binary)
  - `avg_recent_time_ms`: Recent response speed
  - `hesitation_rate`: Frequency of pauses
  - `avg_typing_speed_cpm`: Characters per minute
  - `avg_backspace_rate`: Edit frequency

- **Complexity** (3 features):
  - `question_length`: Question character count
  - `answer_length`: Answer character count
  - `answer_word_count`: Answer word count

### 2. Data Loading (`training/data_loader.py`)

**Intelligent training data extraction**:

- Loads historical reviews from `CardMetrics` table
- Creates training samples from review sequences
- For each review (except first), uses card state BEFORE review as features
- Target: Was the review correct? (binary classification)
- Handles cards with varying review counts
- Minimum 2 reviews per card required

**Data quality**:
- Automatic filtering of insufficient data
- Stratified train/test split (80/20)
- Balanced class weighting for imbalanced datasets

### 3. Model Training (`models/logistic_regression.py`)

**LikelihoodPredictor class**:

- **Algorithm**: Scikit-learn Logistic Regression
- **Preprocessing**: StandardScaler (normalize features)
- **Regularization**: L2 (C=1.0)
- **Solver**: LBFGS (efficient for small datasets)
- **Class weighting**: Balanced (handles imbalanced correct/incorrect ratio)

**Evaluation metrics**:
- Accuracy, Precision, Recall, F1-Score
- AUC-ROC (area under curve)
- Feature importance analysis
- Classification report

**Model persistence**:
- Saves model, scaler, and feature names
- Joblib serialization
- Version-tracked file names

### 4. Inference Service (`inference/predictor.py`)

**MLPredictionService singleton**:

- Loads model once on startup (cached)
- Fast predictions during API requests
- Graceful fallback if model unavailable
- Converts probabilities to labels (High/Medium/Low)
- Ranks cards by priority (lowest likelihood first)

**API Integration**:
- Integrated into `GET /api/study/deck/{deck_id}/due`
- Optional ML ranking via `?use_ml=true/false`
- Returns likelihood with each card
- No breaking changes - backward compatible

### 5. Training Pipeline (`training/train_models.py`)

**Automated training script**:
- Loads data from database
- Validates sufficient samples (100+ required)
- Trains and evaluates model
- Saves artifacts to disk
- Detailed logging and error handling

### 6. Repository Enhancement (`repositories/card_repository.py`)

**ML-powered card retrieval**:
- `get_due_cards()` now supports ML ranking
- Optional `use_ml_ranking` parameter
- Automatic fallback to due_date ordering
- User-specific predictions (if user_id provided)

### 7. Schema Updates (`schemas/study_session.py`)

**StudyCardResponse extended**:
```python
class StudyCardResponse(BaseModel):
    id: int
    question: str
    answer: Optional[str] = None
    likelihood_to_remember: Optional[float]  # NEW
    likelihood_label: Optional[str]          # NEW
```

### 8. CLI Tool (`ml/cli.py`)

**Management commands**:
- `python -m app.ml.cli status` - Check ML system status
- `python -m app.ml.cli train` - Train models
- `python -m app.ml.cli test` - Test predictions

### 9. Configuration (`ml/config.py`)

**Centralized settings**:
- Model paths and versioning
- Training hyperparameters
- Prediction thresholds
- Data requirements

## File Structure Created

```
backend/app/ml/
├── __init__.py
├── README.md                    # Detailed documentation
├── IMPLEMENTATION_SUMMARY.md    # This file
├── config.py                    # Configuration settings
├── cli.py                       # Management CLI tool
├── models/
│   ├── __init__.py
│   └── logistic_regression.py   # Likelihood predictor
├── training/
│   ├── __init__.py
│   ├── data_loader.py           # Training data extraction
│   └── train_models.py          # Training script
├── inference/
│   ├── __init__.py
│   └── predictor.py             # Production predictions
├── utils/
│   ├── __init__.py
│   └── feature_engineer.py      # Feature extraction
└── trained_models/              # Generated after training
    ├── logistic_likelihood_v1.pkl
    ├── feature_scaler_v1.pkl
    └── logistic_likelihood_v1_features.pkl
```

## Dependencies Added

```txt
scikit-learn==1.5.0  # ML algorithms
numpy==1.26.0        # Numerical operations
pandas==2.2.0        # Data manipulation
joblib==1.4.0        # Model serialization
```

## API Changes

### Existing Endpoint Modified

**GET `/api/study/deck/{deck_id}/due`**

**New parameters**:
- `use_ml` (bool, default=True): Enable ML ranking

**New response fields**:
```json
{
  "id": 123,
  "question": "...",
  "answer": null,
  "likelihood_to_remember": 0.67,  // NEW
  "likelihood_label": "Medium"     // NEW
}
```

**Behavior**:
- `use_ml=true`: Cards ranked by likelihood (lowest first)
- `use_ml=false`: Traditional due_date ordering

## Key Features

### 1. Smart Card Prioritization
Cards most likely to be forgotten appear first in study sessions.

### 2. Real-time Predictions
Each card shows likelihood percentage and label (High/Medium/Low).

### 3. Graceful Degradation
If model not trained:
- Falls back to simple heuristic (accuracy - lapses)
- No errors or broken functionality

### 4. User-Specific Predictions
Model can be personalized per user (foundation for Phase 2).

### 5. Transparent ML
- Feature importance shows what drives predictions
- Clear evaluation metrics
- Interpretable logistic regression

## Performance Targets

### Model Quality
- **AUC-ROC**: > 0.75 (good discrimination)
- **Accuracy**: > 0.70 (overall correctness)
- **Precision**: > 0.70 (positive prediction accuracy)
- **Recall**: > 0.70 (sensitivity)

### Production Performance
- **Prediction latency**: < 10ms per card
- **Model loading**: Once on startup
- **Memory footprint**: ~2-5 MB (model + scaler)

## Usage Workflow

### For Users

1. **Study cards normally** → Data automatically collected
2. **Wait for 100+ reviews** → Sufficient training data
3. **Admin trains model** → One-time setup
4. **Study with ML** → Cards auto-ranked by difficulty

### For Developers

1. Install dependencies: `pip install -r requirements.txt`
2. Generate data: Study 10-15 cards, 2+ reviews each
3. Train: `python -m app.ml.cli train`
4. Verify: `python -m app.ml.cli test`
5. Deploy: Restart server (model loads automatically)

## Testing Checklist

- [x] Feature engineering produces 24 features
- [x] Data loader extracts training samples from CardMetrics
- [x] Model trains with 80/20 split
- [x] Predictions return 0.0-1.0 probability
- [x] API returns likelihood data
- [x] Cards ranked correctly (lowest first)
- [x] Fallback works when model unavailable
- [x] CLI tools function properly
- [x] Model persists and reloads

## Future Enhancements (Phase 2+)

### Immediate Next Steps
- [ ] Frontend UI component for likelihood display
- [ ] Color-coded card badges (green/yellow/red)
- [ ] Analytics dashboard showing prediction accuracy

### Phase 2: Bayesian Knowledge Tracing
- [ ] Track knowledge state per card
- [ ] Calculate mastery probability
- [ ] Display mastery progress charts

### Phase 3: Neural Networks
- [ ] FFNN for pattern recognition
- [ ] Adjust SM-2 intervals dynamically
- [ ] Multi-task learning (predict quality + time)

### Advanced Features
- [ ] Session planning recommendations
- [ ] Lapse prediction and early intervention
- [ ] Personalized similarity thresholds
- [ ] Optimal review time suggestions

## Maintenance

### Retraining Schedule
- **Initial**: After 100 reviews
- **Regular**: Weekly or every 500 new reviews
- **Trigger**: When model accuracy drops

### Monitoring
- Track prediction accuracy vs actual results
- Log feature importance changes
- Monitor API latency
- Check fallback usage frequency

### Version Control
Model files versioned in filename:
- `logistic_likelihood_v1.pkl` → current
- `logistic_likelihood_v2.pkl` → after improvements

## Success Criteria

✅ **Phase 1 Complete When**:
1. Model trains successfully with 100+ samples
2. Test AUC-ROC > 0.75
3. API returns likelihood predictions
4. Cards ranked by ML priority
5. Documentation complete
6. CLI tools working

## Known Limitations

1. **Data requirement**: Needs 100+ reviews to train
2. **Approximate features**: Historical SM-2 states not tracked perfectly
3. **Global model**: Not yet personalized per user
4. **Static predictions**: Model doesn't update in real-time
5. **Simple algorithm**: Logistic regression is baseline (Phase 3 will improve)

## Conclusion

**Phase 1 is production-ready** with:
- Complete ML pipeline (training → inference → API)
- 24 engineered features
- Robust error handling and fallbacks
- Comprehensive documentation
- CLI tools for management

**Ready for**: Real-world usage and data collection
**Next**: Add frontend UI, then proceed to Phase 2 (BKT)
