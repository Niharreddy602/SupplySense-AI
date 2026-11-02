import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "SupplySense AI - Supply Chain Intelligence"
    ENV: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    
    # Defaults to SQLite if PostgreSQL is not provided, allowing zero-friction local testing
    # To use PostgreSQL, set DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./supplysense.db")
    
    DEFAULT_FORECAST_HORIZON_DAYS: int = 14
    ML_MODEL_TYPE: str = "random_forest"
    ANOMALY_CONTAMINATION: float = 0.05

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()

