from fastapi import Response, APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import os
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from app.database import get_db
from app.models.db_models import TrainedModel
from app.schemas.schemas import TrainRequest, ModelResponse
from app.config import settings
from app.services.data_loader import load_train_data, load_test_data
from app.services.preprocessing import preprocess_pipeline, get_feature_columns
from app.services.feature_eng import add_rolling_features
from app.services.ml_models import train_and_evaluate, save_model, get_model
from app.schemas.schemas import ModelCompareResponse
import math
import json

router = APIRouter()

def run_training(model_type: str, db: Session):
    """Background training task."""
    train_path = os.path.join(settings.DATA_DIR, "raw", "train_FD004.txt")
    test_path = os.path.join(settings.DATA_DIR, "raw", "test_FD004.txt")
    rul_path = os.path.join(settings.DATA_DIR, "raw", "RUL_FD004.txt")

    if not all(os.path.exists(p) for p in [train_path, test_path, rul_path]):
        raise HTTPException(status_code=400, detail="Data files missing. Please upload first.")

    # Preprocess
    train_df, test_df, true_rul_dict, feature_cols, scaler = preprocess_pipeline(
        train_path, test_path, rul_path
    )

    # Add rolling features
    train_df = add_rolling_features(train_df, feature_cols)
    test_df = add_rolling_features(test_df, feature_cols)

    train_df = train_df.dropna()
    test_df = test_df.dropna()

    # Prepare train/test arrays
    feature_cols_eng = [col for col in train_df.columns if col not in ['unit_number', 'time_cycles', 'RUL']]
    X_train = train_df[feature_cols_eng].values
    y_train = train_df['RUL'].values

    # Test: last cycle per engine (fixed PerformanceWarning)
    idx = test_df.groupby('unit_number')['time_cycles'].idxmax()
    test_last = test_df.loc[idx].reset_index(drop=True)
    X_test = test_last[feature_cols_eng].values
    y_test = np.array([true_rul_dict[int(uid)] for uid in test_last['unit_number']])

    # Train and evaluate
    result = train_and_evaluate(model_type, X_train, y_train, X_test, y_test)
    model = result['model']
    metrics = result['metrics']

    # Feature importance for Random Forest
    feature_importance = None
    if model_type == 'random_forest':
        importances = model.feature_importances_
        feature_importance = {feature_cols_eng[i]: float(importances[i]) for i in range(len(feature_cols_eng))}
        feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:20])

    # Save model and scaler
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs(settings.MODEL_DIR, exist_ok=True)
    model_path = os.path.join(settings.MODEL_DIR, f"{model_type}_{timestamp}.pkl")
    scaler_path = os.path.join(settings.MODEL_DIR, f"{model_type}_{timestamp}_scaler.pkl")
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    # Store in database
    db_model = TrainedModel(
        model_type=model_type,
        file_path=model_path,
        evaluation_metrics=metrics,
        feature_importance=feature_importance
    )
    db.add(db_model)
    db.commit()
    db.refresh(db_model)

@router.post("/train")
async def train_model(
    request: TrainRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if request.model_type not in ['linear', 'random_forest', 'polynomial']:
        raise HTTPException(status_code=400, detail="Invalid model type")
    background_tasks.add_task(run_training, request.model_type, db)
    return {"message": f"Training of {request.model_type} model started in background."}

@router.get("/models", response_model=list[ModelResponse])
def list_models(db: Session = Depends(get_db)):
    models = db.query(TrainedModel).order_by(TrainedModel.training_timestamp.desc()).all()
    return models


@router.get("/models/compare")
def compare_models(db: Session = Depends(get_db)):
    models = db.query(TrainedModel).all()
    comparison = []
    for m in models:
        cleaned_metrics = {}
        if m.evaluation_metrics:
            for k, v in m.evaluation_metrics.items():
                try:
                    if v is None:
                        cleaned_metrics[k] = 0.0
                    elif isinstance(v, (int, float)):
                        if math.isnan(v) or math.isinf(v):
                            cleaned_metrics[k] = 0.0
                        else:
                            cleaned_metrics[k] = float(v)
                    else:
                        cleaned_metrics[k] = float(v) if v is not None else 0.0
                except (ValueError, TypeError):
                    cleaned_metrics[k] = 0.0
        else:
            cleaned_metrics = {"rmse": 0.0, "mae": 0.0, "r2": 0.0, "cmapss_score": 0.0}
        
        comparison.append({
            "model_type": m.model_type,
            "id": m.id,
            "metrics": cleaned_metrics
        })
    # Return raw JSON response
    return Response(content=json.dumps(comparison), media_type="application/json")




@router.get("/models/{model_id}")
def get_model_details(model_id: int, db: Session = Depends(get_db)):
    model = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return {
        "id": model.id,
        "model_type": model.model_type,
        "training_timestamp": model.training_timestamp,
        "metrics": model.evaluation_metrics,
        "feature_importance": model.feature_importance
    }

