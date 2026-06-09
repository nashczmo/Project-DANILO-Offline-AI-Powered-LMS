import uvicorn
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    raise RuntimeError("Lifespan crash!")
    yield

app = FastAPI(lifespan=lifespan)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
