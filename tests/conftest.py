"""
Pytest configuration for Camartes backend tests.
Run from project root: pytest tests -v
"""
import sys
import os
from pathlib import Path

# Add backend to path before any backend imports
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Use SQLite for tests - must be set before database module is imported
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from server import app
from database import get_db
import models

# Use SQLite for tests (fast, isolated)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    models.Base.metadata.create_all(bind=engine)
    yield
    models.Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Expose for fixtures that need direct DB access (e.g. test_user setup)
import database as db_module
db_module.TestingSessionLocal = TestingSessionLocal


@pytest.fixture
def client():
    return TestClient(app)
