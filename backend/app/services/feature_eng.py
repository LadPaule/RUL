import pandas as pd
import numpy as np
from app.config import settings

def add_rolling_features(df: pd.DataFrame, feature_cols: list, window_sizes: list = None) -> pd.DataFrame:
    """
    Add rolling statistics (mean, std, min, max) for each feature column.
    Computed per engine to avoid window crossing engine boundaries.
    """
    if window_sizes is None:
        window_sizes = settings.WINDOW_SIZES

    df_rolled = df.copy()
    for unit in df['unit_number'].unique():
        unit_mask = df['unit_number'] == unit
        unit_df = df[unit_mask].sort_values('time_cycles')

        for window in window_sizes:
            rolled = unit_df[feature_cols].rolling(window=window, min_periods=1)
            # Compute statistics
            mean_df = rolled.mean()
            std_df = rolled.std()
            min_df = rolled.min()
            max_df = rolled.max()

            # Rename columns
            mean_df.columns = [f"{col}_w{window}_mean" for col in feature_cols]
            std_df.columns = [f"{col}_w{window}_std" for col in feature_cols]
            min_df.columns = [f"{col}_w{window}_min" for col in feature_cols]
            max_df.columns = [f"{col}_w{window}_max" for col in feature_cols]

            # Assign back to main DataFrame
            for stat_df in [mean_df, std_df, min_df, max_df]:
                df_rolled.loc[unit_mask, stat_df.columns] = stat_df.values

    return df_rolled

def create_sequences(df: pd.DataFrame, feature_cols: list, seq_length: int = None):
    """
    Create sequences for LSTM (optional).
    Returns X (3D array) and y (RUL at last step).
    """
    if seq_length is None:
        seq_length = settings.SEQUENCE_LENGTH

    X, y = [], []
    for unit in df['unit_number'].unique():
        unit_data = df[df['unit_number'] == unit].sort_values('time_cycles')
        if len(unit_data) < seq_length:
            continue
        for i in range(len(unit_data) - seq_length + 1):
            X.append(unit_data[feature_cols].iloc[i:i+seq_length].values)
            y.append(unit_data['RUL'].iloc[i+seq_length-1])
    return np.array(X), np.array(y)





