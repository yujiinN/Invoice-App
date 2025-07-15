from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Define the path to your SQLite database file.
# The '///' is important. It means a relative path from the current directory.
SQLALCHEMY_DATABASE_URL = "sqlite:///./database.db"

# Use check_same_thread for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()