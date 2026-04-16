import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline
import joblib
import json
from typing import Dict, Any, Tuple
from app.config import settings

def get_model(model_type: str, **kwargs):
    if model_type == 'linear':
        return LinearRegression()
    elif model_type == 'random_forest':
        return RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1, **kwargs)
    elif model_type == 'polynomial':
        return Pipeline([
            ('poly', PolynomialFeatures(degree=2, include_bias=False)),
            ('linear', LinearRegression())
        ])
    else:
        raise ValueError(f"Unknown model type: {model_type}")

def prepare_train_test_features(train_df: pd.DataFrame, test_df: pd.DataFrame,
                               feature_cols: list) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    For traditional ML, we use the final cycle of each engine for evaluation.
    Training uses all cycles with rolling features.
    """
    # Training: use all cycles
    train_feature_cols = [col for col in train_df.columns if col not in ['unit_number', 'time_cycles', 'RUL']]
    X_train = train_df[train_feature_cols].values
    y_train = train_df['RUL'].values

    # Test: only last cycle per engine
    test_last = test_df.sort_values('time_cycles').groupby('unit_number').last().reset_index()
    X_test = test_last[train_feature_cols].values

    # True RUL for test engines (provided separately)
    y_test = np.array([test_df['RUL_true'].iloc[0]] * len(X_test))  # placeholder - will be replaced

    return X_train, X_test, y_train, y_test

def train_and_evaluate(model_type: str, X_train, y_train, X_test, y_test) -> Dict[str, Any]:
    from app.services.evaluation import evaluate_model

    model = get_model(model_type)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    metrics = evaluate_model(y_test, y_pred)

    # Feature importance for Random Forest
    feature_importance = None
    if model_type == 'random_forest':
        importances = model.feature_importances_
        # We'll attach feature names later

    return {
        'model': model,
        'metrics': metrics,
        'predictions': y_pred,
        'feature_importance': feature_importance
    }

def save_model(model, model_type: str, metrics: Dict, feature_importance: Dict = None) -> str:
    import os
    from datetime import datetime

    os.makedirs(settings.MODEL_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{model_type}_{timestamp}.pkl"
    filepath = os.path.join(settings.MODEL_DIR, filename)
    joblib.dump(model, filepath)

    # Save metadata alongside
    meta = {
        'model_type': model_type,
        'metrics': metrics,
        'feature_importance': feature_importance,
        'timestamp': timestamp
    }
    with open(filepath.replace('.pkl', '.json'), 'w') as f:
        json.dump(meta, f, indent=2)

    return filepath