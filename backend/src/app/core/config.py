from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Find .env file - check both backend/ and backend/src/
_env_file = Path(__file__).resolve().parent.parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_env_file) if _env_file.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_name: str = "FlowSplit"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # CORS - comma-separated list of allowed origins
    # Use "*" for development, specific origins for production
    cors_origins: str = "*"

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""

    # Database (Supabase Postgres)
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/flowsplit"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    # Plaid (for bank connections)
    plaid_client_id: str = ""
    plaid_secret: str = ""
    plaid_environment: str = "sandbox"  # sandbox, development, production

    # Pushpay (for external giving)
    pushpay_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
