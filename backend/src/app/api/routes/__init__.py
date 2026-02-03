from app.api.routes.auth import router as auth_router
from app.api.routes.buckets import router as buckets_router
from app.api.routes.deposits import router as deposits_router
from app.api.routes.split_plans import router as split_plans_router
from app.api.routes.users import router as users_router

__all__ = [
    "auth_router",
    "users_router",
    "buckets_router",
    "deposits_router",
    "split_plans_router",
]
