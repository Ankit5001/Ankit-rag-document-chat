from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 1. Load the URL from your .env file
load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Create the connection engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. Create a SessionLocal class (each instance is a database session)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create a Base class (we will use this to create our models)
Base = declarative_base()

# 5. Dependency to get the database session in other files
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()