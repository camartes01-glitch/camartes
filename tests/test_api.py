"""
API contract tests - verify expected behavior of key endpoints.
"""
import pytest
from fastapi.testclient import TestClient

from server import app


@pytest.fixture
def client():
    return TestClient(app)


def test_get_me_unauthenticated_returns_401(client):
    """GET /api/auth/me without token should return 401."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_health_check_returns_200(client):
    """GET /health should return 200."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
