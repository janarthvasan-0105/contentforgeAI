from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from app.api.database import supabase
from app.config import get_settings
from jose import jwt as jose_jwt, JWTError, ExpiredSignatureError

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Supabase JWT secret — get this from:
# Supabase Dashboard → Settings → API → JWT Secret
# Add SUPABASE_JWT_SECRET=<your_jwt_secret> to your .env
SUPABASE_JWT_SECRET = getattr(settings, "supabase_jwt_secret", "")


def verify_token(token: str = Depends(oauth2_scheme)) -> str:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")

    # ── Strategy 1: Local JWT decode (fast, no network) ──────────────────
    # Supabase signs user tokens with HS256 using the project's JWT secret.
    # Get it from: Supabase Dashboard → Settings → API → JWT Secret
    if SUPABASE_JWT_SECRET:
        try:
            payload = jose_jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}  # Supabase doesn't set aud by default
            )
            user_id = payload.get("sub")
            if user_id:
                print(f"[DEBUG] Bearer type: {type(user_id)} | value start: {str(user_id)[:20]}")
                return user_id
        except ExpiredSignatureError:
            print("Token verification failed: JWT expired")
            raise exc
        except JWTError as e:
            print(f"Local JWT decode failed, trying remote: {e}")

    # ── Strategy 2: Remote Supabase verification (fallback) ──────────────
    # Used when SUPABASE_JWT_SECRET is not set.
    # This is slower (network call) but always works.
    try:
        import asyncio
        import concurrent.futures

        def _get_user():
            return supabase.auth.get_user(token)

        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(_get_user)
            try:
                user_response = future.result(timeout=8)  # 8s timeout
            except concurrent.futures.TimeoutError:
                print("Token verification failed: timed out after 8s")
                raise exc

        if user_response and user_response.user:
            return user_response.user.id
        raise exc
    except HTTPException:
        raise
    except Exception as e:
        print(f"Token verification failed: {e}")
        raise exc
