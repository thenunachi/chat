from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from groq import Groq
import os
import json
import shutil
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    suffix = Path(file.filename or "file").suffix.lower() or ".bin"
    filename = f"{int(time.time() * 1000)}{suffix}"
    dest = UPLOAD_DIR / filename
    with dest.open("wb") as buf:
        shutil.copyfileobj(file.file, buf)
    return {"url": f"/uploads/{filename}"}


@app.get("/uploads/{filename}")
async def serve_upload(filename: str):
    path = UPLOAD_DIR / filename
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)


class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, WebSocket] = {}

    async def connect(self, username: str, websocket: WebSocket):
        await websocket.accept()
        self.connections[username] = websocket

    def disconnect(self, username: str):
        self.connections.pop(username, None)

    def is_taken(self, username: str) -> bool:
        return username in self.connections

    def users(self) -> list[str]:
        return list(self.connections.keys())

    async def broadcast(self, message: dict):
        dead = []
        data = json.dumps(message)
        for username, ws in self.connections.items():
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(username)
        for u in dead:
            self.connections.pop(u, None)

    async def send_to(self, username: str, message: dict):
        ws = self.connections.get(username)
        if ws:
            await ws.send_text(json.dumps(message))


manager = ConnectionManager()


@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    username = username.strip()

    if not username or len(username) > 20:
        await websocket.accept()
        await websocket.send_text(json.dumps({"type": "error", "content": "Invalid username."}))
        await websocket.close()
        return

    if manager.is_taken(username):
        await websocket.accept()
        await websocket.send_text(json.dumps({"type": "error", "content": "Username already taken."}))
        await websocket.close()
        return

    await manager.connect(username, websocket)
    await manager.broadcast({
        "type": "system",
        "content": f"{username} joined the chat",
        "users": manager.users(),
    })

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            text = message.get("content", "").strip()
            msg_type = message.get("msgType", "text")
            dm_to = message.get("dmTo", "")

            if not text:
                continue

            # Direct message
            if dm_to:
                if not manager.is_taken(dm_to):
                    await manager.send_to(username, {
                        "type": "system",
                        "content": f"{dm_to} is not online.",
                        "users": manager.users(),
                    })
                    continue
                payload = {
                    "type": "dm",
                    "from": username,
                    "to": dm_to,
                    "content": text,
                    "msgType": msg_type,
                }
                await manager.send_to(dm_to, payload)
                await manager.send_to(username, payload)
                continue

            # Group message
            await manager.broadcast({
                "type": "message",
                "username": username,
                "content": text,
                "msgType": msg_type,
                "users": manager.users(),
            })

            if msg_type != "text":
                continue

            if text.lower().startswith("/ask"):
                question = text[4:].strip()
                if not question:
                    await manager.send_to(username, {
                        "type": "system",
                        "content": "Usage: /ask <your question>",
                        "users": manager.users(),
                    })
                    continue

                if not os.getenv("GROQ_API_KEY"):
                    await manager.broadcast({
                        "type": "ai_done",
                        "content": "GROQ_API_KEY is not set.",
                        "users": manager.users(),
                    })
                    continue

                await manager.broadcast({"type": "ai_start", "content": "", "users": manager.users()})

                stream = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant in a group chat. Be clear and concise."},
                        {"role": "user", "content": question},
                    ],
                    stream=True,
                )

                for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        await manager.broadcast({"type": "ai_chunk", "content": delta, "users": manager.users()})

                await manager.broadcast({"type": "ai_done", "content": "", "users": manager.users()})

    except WebSocketDisconnect:
        manager.disconnect(username)
        await manager.broadcast({
            "type": "system",
            "content": f"{username} left the chat",
            "users": manager.users(),
        })
