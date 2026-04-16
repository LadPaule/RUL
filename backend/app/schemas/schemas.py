from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DatasetResponse(BaseModel):
    id: int
    name: str
    upload_timestamp: datetime
    num_engine: int
    total_cycles: int

    class Config:
        from_attributes = True

class ModelResponse(BaseModel):
    id: int
    model_type: str
    training_timestamp: datetime
    evaluation_metrics: Dict[str, float]
    feature_importance: Optional[Dict[str, float]] = None

    class Config:
        from_attributes = True

class TrainRequest(BaseModel):
    model_type: str  
    dataset_id: Optional[int] = None  

class PredictionRequest(BaseModel):
    model_id: int
    engine_id: int
    data: List[List[float]] 

class PredictionResponse(BaseModel):
    engine_id: int
    predicted_rul: float
    model_used: str
    timestamp: datetime

class StatisticsResponse(BaseModel):
    mean: Dict[str, float]
    median: Dict[str, float]
    mode: Dict[str, float]
    std: Dict[str, float]
    count: int


class CorrelationItem(BaseModel):
    feature: str
    correlation: float

class TopCorrelations(BaseModel):
    positive: List[CorrelationItem]
    negative: List[CorrelationItem]

class EDAVisualData(BaseModel):
    histograms: Dict[str, List[float]]
    pie_data: Dict[str, int]
    boxplot_data: Dict[str, Dict[str, Any]]
    correlation_matrix: List[List[float]]
    top_correlations: TopCorrelations


class ModelCompareItem(BaseModel):
    model_type: str
    id: int
    metrics: Dict[str, float]

class ModelCompareResponse(BaseModel):
    models: List[ModelCompareItem]

