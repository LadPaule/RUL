import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def cmapss_score(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Asymmetric scoring function for CMAPSS dataset."""
    d = y_pred - y_true
    scores = np.where(d < 0, np.exp(-d/13) - 1, np.exp(d/10) - 1)
    return float(np.sum(scores))

def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    return {
        'rmse': float(np.sqrt(mean_squared_error(y_true, y_pred))),
        'mae': float(mean_absolute_error(y_true, y_pred)),
        'r2': float(r2_score(y_true, y_pred)),
        'cmapss_score': cmapss_score(y_true, y_pred)
    }



