from fastapi import APIRouter

from app.api.routes import (
    auth_router,
    bank_accounts_router,
    buckets_router,
    deposits_router,
    split_plans_router,
    split_templates_router,
    users_router,
    webhooks_router,
)

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(buckets_router)
api_router.include_router(bank_accounts_router)
api_router.include_router(deposits_router)
api_router.include_router(split_plans_router)
api_router.include_router(split_templates_router)
api_router.include_router(webhooks_router)

__all__ = ["api_router"]
