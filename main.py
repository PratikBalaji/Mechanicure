import asyncio
import json
import sys
import site
import httpx

try:
    from fastapi import FastAPI, WebSocket, WebSocketDisconnect
    from fastapi.middleware.cors import CORSMiddleware
except ImportError:
    raise ImportError(
        f"Could not find import of 'fastapi', looked at search roots ({sys.path}) and site package path ({site.getsitepackages()}).\n"
        f"Current Python Executable: {sys.executable}\n"
        "Please ensure it is installed using: pip install fastapi uvicorn httpx"
    ) from None

app = FastAPI(title="Mechanicure Real-Time Diagnostic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "Mechanicure API is online", "websocket_path": "/ws/diagnose"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/mechanics")
async def get_mechanics(lat: float | None = None, lng: float | None = None, diagnosis: str | None = None):
    return [
        {
            "name": "Meineke Car Care Center",
            "rating": 4.6,
            "distance": "1.2 miles",
            "estimatedCost": "$120 - $180",
            "phone": "+1-555-0142",
            "email": "service@meineke-local.example",
        },
        {
            "name": "Mavis Discount Tire",
            "rating": 4.4,
            "distance": "2.0 miles",
            "estimatedCost": "$95 - $160",
            "phone": "+1-555-0188",
            "email": "quotes@mavis-local.example",
        },
        {
            "name": "Precision Auto Diagnostics",
            "rating": 4.9,
            "distance": "0.9 miles",
            "estimatedCost": "$140 - $210",
            "phone": "+1-555-0116",
            "email": "hello@precisionautodiag.example",
        },
    ]

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
        while True:
            message = await websocket.receive()
            
            if message["type"] == "websocket.disconnect":
                print("Client disconnected via message type.")
                break
                
            if "text" in message:
                text_data = message["text"]
                print(f"Received text message: {text_data[:100]}...")
                try:
                    payload = json.loads(text_data)
                    if payload.get("type") == "init_context":
                        data = payload.get("data", {})
                        vehicle_year = str(data.get("year") or vehicle_year)
                        vehicle_make = str(data.get("make") or vehicle_make)
                        vehicle_model = str(data.get("model") or vehicle_model)
                        symptom = str(data.get("symptom") or symptom)
                        
                        # Fetch recalls
                        if vehicle_make != "Unknown Make" and vehicle_model != "Unknown Model" and vehicle_year != "Unknown Year":
                            try:
                                recalls_url = (
                                    "https://api.nhtsa.gov/recalls/recallsByVehicle"
                                    f"?make={vehicle_make}&model={vehicle_model}&modelYear={vehicle_year}"
                                )
                                async with httpx.AsyncClient(timeout=10.0) as client:
                                    response = await client.get(recalls_url)
                                    if response.status_code == 200:
                                        recalls_payload = response.json()
                                        recalls_results = recalls_payload.get("results", [])
                                        if isinstance(recalls_results, list):
                                            recalls_count = len(recalls_results)
                                    else:
                                        print(f"NHTSA API warning: {response.status_code}")
                            except Exception as api_err:
                                print(f"NHTSA API failed, continuing without recalls: {api_err}")
                except json.JSONDecodeError:
                    print("Failed to parse JSON text message.")
                    
            elif "bytes" in message:
                # We received a frame
                # Simulate the AI processing time
                await asyncio.sleep(1) 
                
                # The mocked diagnostic response
                mocked_diagnosis = (
                    "Diagnostic Report:\n"
                    f"- Vehicle Profile Match: {vehicle_year} {vehicle_make} {vehicle_model}.\n"
                    "- Component Identified: Serpentine belt and tensioner assembly.\n"
                    f"- Reported Symptom: {symptom}.\n"
                    f"- Active NHTSA Recalls Found: {recalls_count}.\n"
                    "- Acoustic Telemetry: High-frequency friction detected.\n"
                    "- Status: Scanning continuous telemetry... minor wear detected."
                )

                # Stream the result back to the frontend instantly
                await websocket.send_json({
                    "status": "success",
                    "diagnosis": mocked_diagnosis,
                    "detections": [
                        {
                            "label": "Serpentine Belt",
                            "confidence": 0.94,
                            "box": {"x": 150, "y": 200, "w": 280, "h": 120}
                        }
                    ],
                    "acoustic": {
                        "frequency": "4.2 kHz",
                        "status": "ANOMALY DETECTED",
                        "signature": "High-pitch belt squeal"
                    }
                })
            else:
                print(f"Received unknown message type: {message.get('type')}")

    except WebSocketDisconnect:
        print("Client disconnected via exception.")
    except Exception as exc:
        import traceback
        print(f"WebSocket diagnostic error: {exc}")
        traceback.print_exc()
