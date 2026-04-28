import asyncio
import json

import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

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

    vehicle_year = "Unknown Year"
    vehicle_make = "Unknown Make"
    vehicle_model = "Unknown Model"
    symptom = "No symptom reported"
    recalls_count = 0

    try:
        init_message = await websocket.receive_text()

        try:
            init_payload = json.loads(init_message)
            intake_data = init_payload.get("data", {}) if isinstance(init_payload, dict) else {}

            vehicle_year = str(intake_data.get("year") or vehicle_year)
            vehicle_make = str(intake_data.get("make") or vehicle_make)
            vehicle_model = str(intake_data.get("model") or vehicle_model)
            symptom = str(intake_data.get("symptom") or symptom)
        except json.JSONDecodeError:
            print("Failed to parse initial intake context JSON.")

        if vehicle_make != "Unknown Make" and vehicle_model != "Unknown Model" and vehicle_year != "Unknown Year":
            recalls_url = (
                "https://api.nhtsa.gov/recalls/recallsByVehicle"
                f"?make={vehicle_make}&model={vehicle_model}&modelYear={vehicle_year}"
            )

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(recalls_url)
                response.raise_for_status()
                recalls_payload = response.json()

            recalls_results = recalls_payload.get("results", [])
            if isinstance(recalls_results, list):
                recalls_count = len(recalls_results)

        while True:
            # Wait to receive a frame (as bytes) from the React frontend
            _frame_bytes = await websocket.receive_bytes()

            # Simulate the AI processing time
            await asyncio.sleep(2)

            # The mocked diagnostic response
            mocked_diagnosis = (
                "Diagnostic Report:\n"
                f"- Vehicle Profile Match: {vehicle_year} {vehicle_make} {vehicle_model}.\n"
                "- Component Identified: Serpentine belt and tensioner assembly.\n"
                f"- Reported Symptom: {symptom}.\n"
                f"- Active NHTSA Recalls Found: {recalls_count}.\n"
                "- Status: Scanning continuous telemetry... minor wear detected."
            )

            # Stream the result back to the frontend instantly
            await websocket.send_json({
                "status": "success",
                "diagnosis": mocked_diagnosis
            })

    except WebSocketDisconnect:
        print("Client disconnected.")
    except Exception as exc:
        print(f"WebSocket diagnostic error: {exc}")
