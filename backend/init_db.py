from app.database import Base, engine
from app.models import user, note, conversation, message  # ensure models imported

if __name__ == "__main__":
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")
