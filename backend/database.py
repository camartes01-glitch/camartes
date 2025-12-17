from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# --- Database Setup ---
# Elastic Beanstalk will provide the DATABASE_URL as an environment variable.
# We no longer need to load it from a .env file.
DATABASE_URL = os.getenv("DATABASE_URL")

# If the URL is missing, raise an error to make debugging clear.
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

# The Supabase URL uses the 'asyncpg' driver, but our synchronous SQLAlchemy engine
# needs the 'psycopg2' driver. We explicitly replace it.
if DATABASE_URL.startswith("postgresql+asyncpg"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2", 1)

# Create the SQLAlchemy engine.
engine = create_engine(DATABASE_URL)

# This sets up the session factory that our endpoints will use.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This is the dependency that provides a database session to each API request.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
