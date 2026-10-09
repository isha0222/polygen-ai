import time
import requests
import os

from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1", tags=["Generation"])

THREE_WS_URL = "https://three.ws/api/3d/generate"


class GenerateRequest(BaseModel):
    prompt: str
    style: str = "realistic"
    quality: str = "draft"


def save_glb(data):
    glb_url = data.get("glbUrl")

    if not glb_url:
        return data

    generated_folder = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "generated"
    )

    os.makedirs(generated_folder, exist_ok=True)

    glb_response = requests.get(
        glb_url,
        timeout=(10, 60)
    )

    glb_response.raise_for_status()

    file_path = os.path.join(
        generated_folder,
        "model.glb"
    )

    with open(file_path, "wb") as file:
        file.write(glb_response.content)

    data["local_file"] = file_path

    return data


@router.post("/generate")
def generate_model(request: GenerateRequest):

    enhanced_prompt = (
        f"{request.prompt}. "
        f"Style: {request.style}. "
        f"Quality: {request.quality}."
    )

    response = requests.post(
        THREE_WS_URL,
        json={"prompt": enhanced_prompt},
        timeout=(10, 300)
    )

    response.raise_for_status()
    data = response.json()

    if data.get("status") == "done":
        return save_glb(data)

    if data.get("status") == "pending":
        job = data.get("job")

        for _ in range(60):
            wait_time = data.get("retryAfter", 5)
            time.sleep(wait_time)

            poll = requests.get(
                THREE_WS_URL,
                params={"job": job},
                timeout=(10, 60)
            )

            poll.raise_for_status()
            data = poll.json()

            if data.get("status") == "done":
                return save_glb(data)

            if data.get("status") == "error":
                return data

        return {
            "status": "timeout",
            "message": "3D generation is still processing.",
            "job": job
        }

    return data


@router.get("/model")
def get_model():

    file_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "generated",
        "model.glb"
    )

    if not os.path.exists(file_path):
        return {
            "status": "error",
            "message": "Model file not found"
        }

    return FileResponse(
        file_path,
        media_type="model/gltf-binary",
        filename="model.glb"
    )
