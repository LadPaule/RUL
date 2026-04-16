import pandas as pd
import numpy as np
from typing import Dict, List, Any
from app.services.data_loader import COLUMN_NAMES

def compute_descriptive_stats(df: pd.DataFrame) -> Dict[str, Any]:
    """Return mean, median, mode, std, count for numerical columns."""
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    stats = {
        'mean': df[numeric_cols].mean().to_dict(),
        'median': df[numeric_cols].median().to_dict(),
        'mode': df[numeric_cols].mode().iloc[0].to_dict() if not df[numeric_cols].mode().empty else {},
        'std': df[numeric_cols].std().to_dict(),
        'count': len(df)
    }
    return stats

def get_correlation_matrix(df: pd.DataFrame) -> List[List[float]]:
    """Return correlation matrix as list of lists for frontend."""
    numeric_df = df.select_dtypes(include=[np.number])
    corr = numeric_df.corr()
    return corr.values.tolist()

def get_top_correlations_with_rul(df: pd.DataFrame, top_n: int = 5) -> Dict[str, List]:
    """Return top positive and negative correlations with RUL."""
    if 'RUL' not in df.columns:
        return {'positive': [], 'negative': []}
    numeric_df = df.select_dtypes(include=[np.number])
    corr_with_rul = numeric_df.corr()['RUL'].drop('RUL').sort_values()
    positive = corr_with_rul.tail(top_n).reset_index().to_dict('records')
    negative = corr_with_rul.head(top_n).reset_index().to_dict('records')
    return {'positive': positive, 'negative': negative}

def prepare_histogram_data(df: pd.DataFrame, sensors: List[str]) -> Dict[str, List[float]]:
    """Return histogram data (values) for specified sensors."""
    hist_data = {}
    for sensor in sensors:
        if sensor in df.columns:
            hist_data[sensor] = df[sensor].dropna().tolist()
    return hist_data

def prepare_boxplot_data(df: pd.DataFrame, sensors: List[str]) -> Dict[str, Dict]:
    """Compute boxplot statistics (min, q1, median, q3, max, outliers)."""
    box_data = {}
    for sensor in sensors:
        if sensor in df.columns:
            q1 = df[sensor].quantile(0.25)
            q3 = df[sensor].quantile(0.75)
            iqr = q3 - q1
            lower_fence = q1 - 1.5 * iqr
            upper_fence = q3 + 1.5 * iqr
            outliers = df[sensor][(df[sensor] < lower_fence) | (df[sensor] > upper_fence)].tolist()
            box_data[sensor] = {
                'min': float(df[sensor].min()),
                'q1': float(q1),
                'median': float(df[sensor].median()),
                'q3': float(q3),
                'max': float(df[sensor].max()),
                'outliers': outliers
            }
    return box_data

def prepare_pie_data(df: pd.DataFrame, column: str = 'op_setting_1') -> Dict[str, int]:
    """Count cycles per unique value of operational setting."""
    counts = df[column].value_counts().to_dict()
    # Convert keys to string for JSON compatibility
    return {str(k): int(v) for k, v in counts.items()}





