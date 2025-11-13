from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
Base = declarative_base()

# CLI: create tables
if __name__ == "__main__":
    from app.models import user as _user, note as _note, conversation as _conv, message as _msg  # ensure models are imported
    Base.metadata.create_all(bind=engine)
