"""
Tests for API endpoints (Story 096).

Uses FastAPI's TestClient with dependency overrides to avoid requiring
a live database or real Supabase JWT.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# ── Health check ──────────────────────────────────────────────────────────────

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


# ── Unauthenticated requests return 401 or 403 ───────────────────────────────

@pytest.mark.parametrize("path", [
    "/api/v1/buckets",
    "/api/v1/deposits",
    "/api/v1/users/me",
])
def test_protected_routes_require_auth(client, path):
    response = client.get(path)
    assert response.status_code in (401, 403, 422), (
        f"{path} should reject unauthenticated requests"
    )


def test_buckets_post_requires_auth(client):
    response = client.post("/api/v1/buckets", json={"name": "Test", "bucket_type": "percentage", "allocation_value": 10})
    assert response.status_code in (401, 403, 422)


def test_deposits_post_requires_auth(client):
    response = client.post("/api/v1/deposits", json={"amount": 1000, "source": "manual"})
    assert response.status_code in (401, 403, 422)


# ── Invalid token returns 401 ─────────────────────────────────────────────────

def test_invalid_bearer_token_rejected(client):
    response = client.get(
        "/api/v1/buckets",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert response.status_code in (401, 403)


# ── OpenAPI schema is available ───────────────────────────────────────────────

def test_openapi_schema_available(client):
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "paths" in schema


def test_openapi_includes_core_routes(client):
    response = client.get("/api/v1/openapi.json")
    paths = response.json()["paths"]
    assert any("buckets" in path for path in paths)
    assert any("deposits" in path for path in paths)
