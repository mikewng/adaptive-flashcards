from pydantic_settings import BaseSettings, SettingsConfigDict
import json

class Settings(BaseSettings):
    APP_NAME: str = "smart_flashcards"
    API_V1_PREFIX: str = "/api"

    JWT_SECRET: str = "ENV FILE"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes for access tokens
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days for refresh tokens

    DATABASE_URL: str = ""

    CORS_ORIGINS: str = '["http://localhost:5173", "http://localhost:3000"]'

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS from JSON string to list"""
        try:
            return json.loads(self.CORS_ORIGINS)
        except:
            return ["http://localhost:5173", "http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

settings = Settings()