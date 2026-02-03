"""
Unit tests for Aadhaar/DigiLocker verification flow.
"""
import pytest
from unittest.mock import patch, AsyncMock
import uuid
from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from database import SessionLocal
import models

from server import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def authenticated_user():
    """Create user with valid session for aadhaar/start."""
    db = SessionLocal()
    user = models.User(
        user_id=str(uuid.uuid4()),
        email="aadhaar@test.com",
        name="Aadhaar User",
        password_hash="hash",
    )
    db.add(user)
    db.commit()

    session = models.UserSession(
        user_id=user.user_id,
        session_token="aadhaar-test-token",
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(session)
    db.commit()
    db.close()
    return user, "aadhaar-test-token"


def test_aadhaar_start_requires_auth(client):
    """GET /aadhaar/start without token should return 401."""
    response = client.get("/aadhaar/start")
    assert response.status_code == 401


@patch("routes.aadhaar.generate_auth_link", new_callable=AsyncMock)
def test_aadhaar_start_returns_url_when_authenticated(mock_generate, client, authenticated_user):
    """GET /aadhaar/start with valid token should return auth_url."""
    _, token = authenticated_user
    mock_generate.return_value = "https://digilocker.example.com/verify"

    response = client.get(
        "/aadhaar/start",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "auth_url" in data
    assert data["auth_url"] == "https://digilocker.example.com/verify"
