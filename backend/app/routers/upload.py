from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import shutil
from app.database import get_db
from app.models.db_models import Dataset
from app.services.data_loader import load_train_data, load_test_data
from app.config import settings

router = APIRouter()

@router.post("/upload", response_model=dict)
async def upload_files(
    train_file: UploadFile = File(...),
    test_file: UploadFile = File(...),
    rul_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Ensure directories exist
    raw_dir = os.path.join(settings.DATA_DIR, "raw")
    os.makedirs(raw_dir, exist_ok=True)

    train_path = os.path.join(raw_dir, "train_FD004.txt")
    test_path = os.path.join(raw_dir, "test_FD004.txt")
    rul_path = os.path.join(raw_dir, "RUL_FD004.txt")

    # Save uploaded files
    try:
        with open(train_path, "wb") as buffer:
            shutil.copyfileobj(train_file.file, buffer)
        with open(test_path, "wb") as buffer:
            shutil.copyfileobj(test_file.file, buffer)
        with open(rul_path, "wb") as buffer:
            shutil.copyfileobj(rul_file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save error: {str(e)}")

    # Verify files by loading
    try:
        df_train = load_train_data(train_path)
        df_test, _ = load_test_data(test_path, rul_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid file format: {str(e)}")

    # Store dataset metadata
    dataset = Dataset(
        name="CMAPSS FD004",
        num_engines=int(df_train['unit_number'].nunique()),
        total_cycles=len(df_train)
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return {
        "message": "Files uploaded and validated successfully",
        "dataset_id": dataset.id,
        "train_engines": dataset.num_engines,
        "train_cycles": dataset.total_cycles,
        "test_engines": df_test['unit_number'].nunique()
    }

@router.get("/datasets", response_model=list)
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(Dataset.upload_timestamp.desc()).all()
    return [{"id": ds.id, "name": ds.name, "timestamp": ds.upload_timestamp,
             "num_engines": ds.num_engines, "total_cycles": ds.total_cycles} for ds in datasets]











