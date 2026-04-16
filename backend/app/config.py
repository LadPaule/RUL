from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str ="postgresql://postgres:postgres@localhost:5432/rul"
    DATA_DIR: str = "data"
    MODEL_DIR: str = "models_store"
    CORS_ORIGINS: list = ['*', 'http://localhost:5173', 'http://localhost:3000']


    # Todo: Preprocessing constants
    CONSTANT_SENSORS: List[str] = [
        'sensor_1', 'sensor_5', 'sensor_6',
        'sensor_10', 'sensor_16', 'sensor_18', 'sensor_19'
    ]

    WINDOW_SIZES: List[int] = [5, 10]

    SEQUENCE_LENGTH: int = 30 #This is for LSTM.

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings= Settings()
