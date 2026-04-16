import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib
from app.config import settings


def drop_constant_sensors(df):
    """
    Drop sensors with near-zero variance.
    """
    return df.drop(
            columns = [col for col in settings.CONSTANT_SENSORS if col in df.columns], 
            errors = 'ignore'
        )

def get_feature_columns(df):
    """
    Return list of feature columns. 
    """
    exclude = ['unit_number', 'time_cycles', 'RUL'] + settings.CONSTANT_SENSORS
    return [col for col in df.columns if col not in exclude]

def scale_features(train_df: pd.DataFrame, test_df: pd.DataFrame = None, scaler_path: str = None):
    """
    Fit Scaler on train and transform both train and test.
    """
    feature_cols = get_feature_columns(train_df)
    scaler = StandardScaler()
    train_df[feature_cols] = scaler.fit_transform(train_df[feature_cols])
    if test_df is not None:
        test_df[feature_cols] = scaler.transform(test_df[feature_cols])

    if scaler_path:
        joblib.dump(scaler, scaler_path)

    return train_df, test_df, scaler

def preprocess_pipeline(train_path: str, test_path: str, rul_path: str):
    """
    Full preprocessing: load drop constant sensors, scale.
    Returns train_df, test_df, true_rul_dict, feature_cols.
    """
    from app.services.data_loader import load_train_data, load_test_data
    train_df = load_train_data(train_path)
    test_df, true_rul_dict = load_test_data(test_path, rul_path)

    train_df = drop_constant_sensors(train_df)
    test_df = drop_constant_sensors(test_df)
        
    feature_cols = get_feature_columns(train_df)
    train_df, test_df, scaler = scale_features(train_df, test_df)

    return train_df, test_df, true_rul_dict, feature_cols, scaler


