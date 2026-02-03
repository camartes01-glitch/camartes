"""
Unit tests for session middleware: Bearer token validation, request.state.user.
"""
import pytest
from datetime import datetime, timedelta
import uuid

from fastapi.testclient import TestClient
from database import SessionLocal
import models

from server import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def user_with_session():
    """Create a user and valid session."""
    db = SessionLocal()
    user = models.User(
        user_id=str(uuid.uuid4()),
        email="session@test.com",
        name="Session User",
        password_hash="hash",
    )
    db.add(user)
    db.commit()

    session = models.UserSession(
        user_id=user.user_id,
        session_token="valid-token-abc",
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(session)
    db.commit()
    db.refresh(user)
    db.refresh(session)
    token = session.session_token
    db.close()
    return user, token


def test_protected_route_without_token_returns_401(client):
    """Request to /api/auth/me without Authorization header should return 401."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_protected_route_with_invalid_token_returns_401(client):
    """Request with invalid Bearer token should return 401."""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401


def test_protected_route_with_valid_token_succeeds(client, user_with_session):
    """Request with valid Bearer token should succeed."""
    _, token = user_with_session
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "session@test.com"


def test_reviews_require_auth(client):
    """POST /api/reviews without auth should return 401."""
    response = client.post(
        "/api/reviews",
        json={
            "provider_id": "some-id",
            "service_type": "photographer",
            "rating": 5,
        },
    )
    assert response.status_code == 401


def test_reviews_with_valid_token_succeeds(client, user_with_session):
    """POST /api/reviews with valid token should succeed."""
    user, token = user_with_session
    response = client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "provider_id": user.user_id,
            "service_type": "photographer",
            "rating": 5,
        },
    )
    assert response.status_code == 200
