from fastapi import FastAPI
from app.core.config import settings

from app.api.v1 import decks_router, cards_router, study_router, auth_router
# later: auth, users, drafts, ingest, analytics

app = FastAPI(title=settings.APP_NAME)

app.include_router(auth_router.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["auth"])
app.include_router(decks_router.router, prefix=f"{settings.API_V1_PREFIX}/decks", tags=["decks"])
app.include_router(cards_router.router, prefix=f"{settings.API_V1_PREFIX}/cards", tags=["cards"])
app.include_router(study_router.router, prefix=f"{settings.API_V1_PREFIX}/study", tags=["study"])


@app.get("/")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
