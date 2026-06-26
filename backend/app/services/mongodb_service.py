import os

MONGODB_URI = os.getenv("MONGODB_URI")

def save_generation(data: dict):
    """
    Stub for MongoDB persistence.
    In a full implementation, this would save to the DB.
    """
    print(f"MongoDB Stub: Saved generation for session {data.get('session_id')}")
    pass
