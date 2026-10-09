import os
from dotenv import load_dotenv
from supabase import create_client

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.generation import router as generation_router

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

print("SUPABASE URL:", SUPABASE_URL)
print("SECRET KEY FOUND:", bool(SUPABASE_SECRET_KEY))

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)

app = FastAPI(
    title="PolyGen API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generation_router)


@app.get("/")
def root():
    return {"message": "PolyGen API is running!"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# @app.get("/test-supabase")
# def test_supabase():
#     response = supabase.table("generations").select("*").limit(1).execute()

#     return {
#         "status": "connected",
#         "data": response.data
#     }
