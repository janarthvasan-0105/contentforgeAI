from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from app.api.database import supabase
from app.config import get_settings

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_token(token: str = Depends(oauth2_scheme)) -> str:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    try:
        # We can verify the user by fetching their data using the token
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            # We return the user's ID (or email/metadata username)
            # Typically user_id is user.id, but if existing logic uses "username",
            # we should return that. Supabase doesn't natively enforce unique usernames
            # but we can store it in user_metadata or just return the user.id.
            # We'll return user.id for unique tracking.
            return user_response.user.id
        raise exc
    except Exception as e:
        print(f"Token verification failed: {e}")
        raise exc
