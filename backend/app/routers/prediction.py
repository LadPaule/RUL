from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime
from app.database import get_db
from app.models.db_models import TrainedModel, Prediction
from app.schemas.schemas import PredictionResponse
from app.config import settings
from app.services.preprocessing import drop_constant_sensors, get_feature_columns
from app.services.feature_eng import add_rolling_features

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
async def predict_rul(
    model_id: int = Form(...),
    engine_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Get model from DB
    model_entry = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model_entry:
        raise HTTPException(status_code=404, detail="Model not found")

    # Load model
    model_path = model_entry.file_path
    if not os.path.exists(model_path):
        raise HTTPException(status_code=500, detail="Model file missing")
    model = joblib.load(model_path)

    # Load scaler (saved during training)
    scaler_path = model_path.replace('.pkl', '_scaler.pkl')
    scaler = joblib.load(scaler_path) if os.path.exists(scaler_path) else None

    # Read uploaded CSV (expected format: cycles × sensor columns)
    try:
        df_input = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {str(e)}")

    # Ensure required columns exist
    required_cols = ['time_cycles'] + [f'sensor_{i}' for i in range(1, 22)] + ['op_setting_1', 'op_setting_2', 'op_setting_3']
    # Relax check: if 'unit_number' not present, assume single engine

    # Preprocess
    df_input = drop_constant_sensors(df_input)
    feature_cols = get_feature_columns(df_input)

    if scaler:
        df_input[feature_cols] = scaler.transform(df_input[feature_cols])

    # Add rolling features (need to simulate engine id)
    df_input['unit_number'] = engine_id
    df_input = add_rolling_features(df_input, feature_cols)

    # Use last cycle for prediction (or user could specify)
    last_cycle = df_input.sort_values('time_cycles').iloc[-1:]
    feature_cols_eng = [col for col in df_input.columns if col not in ['unit_number', 'time_cycles']]
    X_pred = last_cycle[feature_cols_eng].values

    predicted_rul = float(model.predict(X_pred)[0])

    # Store prediction in DB
    pred_entry = Prediction(
        engine_id=engine_id,
        model_id=model_id,
        predicted_rul=predicted_rul,
        true_rul=None,
        input_summary={"num_cycles": len(df_input)}
    )
    db.add(pred_entry)
    db.commit()
    db.refresh(pred_entry)

    return PredictionResponse(
        engine_id=engine_id,
        predicted_rul=predicted_rul,
        model_used=model_entry.model_type,
        timestamp=pred_entry.timestamp
    )

@router.get("/predictions")
def list_predictions(engine_id: int = None, model_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Prediction)
    if engine_id:
        query = query.filter(Prediction.engine_id == engine_id)
    if model_id:
        query = query.filter(Prediction.model_id == model_id)
    predictions = query.order_by(Prediction.timestamp.desc()).all()
    return predictions








    