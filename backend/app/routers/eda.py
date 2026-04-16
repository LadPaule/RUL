from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import pandas as pd
from app.database import get_db
from app.config import settings
from app.services.data_loader import load_train_data
from app.services.preprocessing import drop_constant_sensors, get_feature_columns
from app.services.eda import (
    compute_descriptive_stats,
    get_correlation_matrix,
    get_top_correlations_with_rul,
    prepare_histogram_data,
    prepare_boxplot_data,
    prepare_pie_data
)
from app.schemas.schemas import StatisticsResponse, EDAVisualData, CorrelationItem, TopCorrelations

router = APIRouter()

def get_train_df():
    train_path = os.path.join(settings.DATA_DIR, "raw", "train_FD004.txt")
    if not os.path.exists(train_path):
        raise HTTPException(status_code=404, detail="Training data not uploaded yet")
    df = load_train_data(train_path)
    df = drop_constant_sensors(df)
    return df

@router.get("/eda/statistics", response_model=StatisticsResponse)
def get_statistics():
    df = get_train_df()
    stats = compute_descriptive_stats(df)
    return stats

@router.get("/eda/visualizations", response_model=EDAVisualData)
def get_visualization_data():
    df = get_train_df()
    feature_cols = get_feature_columns(df)
    
    # Select key sensors for histograms/boxplots
    key_sensors = ['sensor_2', 'sensor_3', 'sensor_4', 'sensor_7', 'sensor_11', 'sensor_12']
    key_sensors = [s for s in key_sensors if s in df.columns]
    
    # Histograms: raw values per sensor
    hist_data = {}
    for sensor in key_sensors:
        hist_data[sensor] = df[sensor].dropna().tolist()
    
    # Boxplot data: compute stats manually
    box_data = {}
    for sensor in key_sensors:
        q1 = float(df[sensor].quantile(0.25))
        q3 = float(df[sensor].quantile(0.75))
        iqr = q3 - q1
        lower_fence = q1 - 1.5 * iqr
        upper_fence = q3 + 1.5 * iqr
        outliers = df[sensor][(df[sensor] < lower_fence) | (df[sensor] > upper_fence)].tolist()
        box_data[sensor] = {
            'min': float(df[sensor].min()),
            'q1': q1,
            'median': float(df[sensor].median()),
            'q3': q3,
            'max': float(df[sensor].max()),
            'outliers': outliers
        }
    
    # Pie data: counts per op_setting_1 value
    pie_counts = df['op_setting_1'].value_counts().to_dict()
    pie_data = {str(k): int(v) for k, v in pie_counts.items()}
    
    # Correlation matrix
    numeric_df = df.select_dtypes(include=['number'])
    corr_matrix = numeric_df.corr().values.tolist()
    
    # Todo: Top correlations with RUL (the part you asked about) ---
    corr_with_rul = numeric_df.corr()['RUL'].drop('RUL').sort_values()
    
    positive_items = []
    negative_items = []
    for feat, corr in corr_with_rul.items():
        item = CorrelationItem(feature=feat, correlation=float(corr))
        if corr > 0:
            positive_items.append(item)
        else:
            negative_items.append(item)
    
    positive_items = sorted(positive_items, key=lambda x: abs(x.correlation), reverse=True)[:5]
    negative_items = sorted(negative_items, key=lambda x: abs(x.correlation), reverse=True)[:5]
    
    top_correlations = TopCorrelations(
        positive=positive_items,
        negative=negative_items
    )
  
    return {
        "histograms": hist_data,
        "pie_data": pie_data,
        "boxplot_data": box_data,
        "correlation_matrix": corr_matrix,
        "top_correlations": top_correlations
    }

@router.get("/eda/correlation/heatmap")
def get_correlation_heatmap():
    df = get_train_df()
    corr_matrix = get_correlation_matrix(df)
    feature_cols = get_feature_columns(df) + ['RUL']
    return {"columns": feature_cols, "matrix": corr_matrix}


@router.get("/eda/timeseries/{engine_id}")
def get_engine_timeseries(engine_id: int):
    df = get_train_df()
    engine_df = df[df['unit_number'] == engine_id].sort_values('time_cycles')

    if engine_df.empty:
        raise HTTPException(status_code=404, detail=f'Engine {engine_id} not found in the training data')
    
    # Select key sensors and operational settings to return
    sensors = ['sensor_2', 'sensor_3', 'sensor_4', 'sensor_7', 'sensor_11', 'sensor_12']
    # Ensure columns exist
    available_sensors = [s for s in sensors if s in engine_df.columns]
    result = {
        "engine_id": engine_id,
        "cycles": engine_df['time_cycles'].tolist(),
        "sensors": {}
    }
    for sensor in available_sensors:
        result["sensors"][sensor] = engine_df[sensor].tolist()
    return result




