import httpx
import asyncio
import os

RUNWAY_API_KEY = os.getenv("RUNWAY_API_KEY")
RUNWAY_BASE_URL = "https://api.dev.runwayml.com/v1"

async def generate_video_runway(
    image_path: str,
    motion_prompt: str,
    duration: int = 5
) -> dict:
    """
    Submit image-to-video job to Runway Gen-4 Turbo.
    Poll until complete, return local video path.
    """
    headers = {
        "Authorization": f"Bearer {RUNWAY_API_KEY}",
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06"
    }

    async with httpx.AsyncClient() as client:
        # Check if we are passing a local path, but Runway expects a URL or base64.
        # For simplicity, we assume image_path could be base64 data URI here, 
        # or we read the file and convert to base64 if it's a local file.
        prompt_image = image_path
        if os.path.exists(image_path):
            import base64
            with open(image_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
                prompt_image = f"data:image/png;base64,{b64}"

        response = await client.post(
            f"{RUNWAY_BASE_URL}/image_to_video",
            headers=headers,
            json={
                "model": "gen4_turbo",
                "promptImage": prompt_image,
                "promptText": motion_prompt,
                "duration": duration,
                "ratio": "1280:720"
            }
        )
        if response.status_code != 200:
            return { "local_path": None, "source": "failed", "error": response.text }
            
        job = response.json()
        task_id = job.get("id")
        if not task_id:
             return { "local_path": None, "source": "failed", "error": "No task ID" }

        # Step 2: Poll for completion
        while True:
            await asyncio.sleep(5)
            status_response = await client.get(
                f"{RUNWAY_BASE_URL}/tasks/{task_id}",
                headers=headers
            )
            if status_response.status_code != 200:
                continue
                
            task = status_response.json()

            if task.get("status") == "SUCCEEDED":
                video_url = task["output"][0]
                # Download and save
                video_data = await client.get(video_url)
                
                os.makedirs("outputs/videos", exist_ok=True)
                output_path = f"outputs/videos/{task_id}.mp4"
                
                with open(output_path, "wb") as f:
                    f.write(video_data.content)
                return { "local_path": output_path, "source": "runway" }

            elif task.get("status") in ["FAILED", "CANCELLED"]:
                return { "local_path": None, "source": "failed", "error": str(task) }
