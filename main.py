from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI(title="Mechanicure Real-Time Diagnostic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws/diagnose")
async def websocket_diagnose(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to real-time diagnostic stream.")

    try:
        while True:
            # Wait to receive a frame (as bytes) from the React frontend
            frame_bytes = await websocket.receive_bytes()

            # Simulate the AI processing time
            await asyncio.sleep(2)

            # The mocked diagnostic response
            mocked_diagnosis = (
                "Diagnostic Report:\n"
                "- Vehicle Profile Match: 2024 Hyundai Palisade Calligraphy.\n"
                "- Component Identified: Serpentine belt and tensioner assembly.\n"
                "- Status: Scanning continuous telemetry... minor wear detected."
            )

            # Stream the result back to the frontend instantly
            await websocket.send_json({
                "status": "success",
                "diagnosis": mocked_diagnosis
            })

    except WebSocketDisconnect:
        print("Client disconnected.")
