from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import numpy as np

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/position_data")
async def position_data() -> Dict:
    # return JSON data in format data.x data.y data.z
    t = np.load("../data/time.npy")
    x = np.load("../data/px.npy")
    y = np.load("../data/py.npy")
    z = np.zeros_like(x)
    pitch = np.load("../data/theta.npy")
    return {"time": t.tolist(),
            "x": x.tolist(),
            "y": y.tolist(),
            "z": z.tolist(),
            "pitch": pitch.tolist()}
