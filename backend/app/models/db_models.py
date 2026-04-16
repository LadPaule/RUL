from sqlalchemy import Column, Integer, String, DateTime, JSON, LargeBinary, Float
from datetime import datetime, UTC
from app.database import Base


class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.now(UTC))
    num_engines = Column(Integer)
    total_cycles = Column(Integer)

class TrainedModel(Base):
    __tablename__ = "models"
    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String, nullable=False)
    training_timestamp = Column(DateTime, default=datetime.now(UTC))
    file_path = Column(String)
    evaluation_metrics = Column(JSON)
    feature_importance = Column(JSON, nullable=True)
    model_binary = Column(LargeBinary, nullable=True)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    engine_id = Column(Integer, nullable=False)
    model_id = Column(Integer, nullable=False)
    predicted_rul = Column(Float, nullable=False)
    true_rul = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.now(UTC))
    input_summary = Column(JSON)
    