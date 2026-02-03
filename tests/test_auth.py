"""
Unit tests for auth: signup, login, refresh, /me.
"""
import pytest
from fastapi.testclient import TestClient
import uuid

from server import app
from database import SessionLocal
import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_user(db_session):
    """Create a test user for login/refresh tests."""
    user = models.User(
        user_id=str(uuid.uuid4()),
        email="test@example.com",
        name="Test User",
        password_hash=pwd_context.hash("password123"),
    )
    db_session.add(user)
    profile = models.UserProfile(user_id=user.user_id)
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def db_session():
    """Provide a DB session for test setup."""
    from database import TestingSessionLocal
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_signup_success(client):
    response = client.post(
        "/api/auth/signup",
        json={
            "email": "newuser@example.com",
            "name": "New User",
            "password": "securepass123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "expires_at" in data


def test_signup_duplicate_email(client, test_user):
    response = client.post(
        "/api/auth/signup",
        json={
            "email": "test@example.com",
            "name": "Another User",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "already exists" in response.json().get("detail", "").lower()


def test_login_success(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "expires_at" in data


def test_login_invalid_credentials(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_token_refresh(client, test_user):
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    token = login_resp.json()["access_token"]

    response = client.post(
        "/api/auth/refresh",
        params={"token": token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "expires_at" in data


def test_me_requires_auth(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_success(client, test_user):
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "user_id" in data
