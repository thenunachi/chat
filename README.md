# 💬 ChatBot — Real-Time Group Chat App

A full-stack real-time messenger-style chat application built with **React + FastAPI + WebSocket**, featuring group chat, private DMs, AI assistance, media sharing, and animated UI.

---

## ✨ Features

### 💬 Chat
- **Group Chat** — everyone in the room sees all messages in real time
- **Private DMs** — click any user in the sidebar to open a 1-on-1 conversation
- **Online / Offline status** — users show green (online) or grey (offline) with live presence indicator
- **Unread DM badges** — animated badge shows unread count per user
- **System messages** — join and leave events shown inline

### 🤖 AI Help (Groq)
- Type `/ask <question>` in group chat to get an AI response streamed live to everyone
- Powered by **Llama 3.3 70B** via the Groq API
- Click the **Ask AI** button to wrap your current input automatically

### 😊 Expressions
- **Emoji picker** — full searchable emoji panel (no API key needed)
- **GIF panel** — built-in curated reaction GIFs in 3 categories: Reactions, Greetings, Fun (no API key needed)

### 📷 Media
- **Image upload** — click the camera button or drag & drop any image onto the chat
- **Voice messages** — hold the mic button to record, release to send; plays inline for all users
- All media uploads are stored on the backend and served via URL

### 🔔 Sounds
- Ascending chime when a user **joins**
- Descending chime when a user **leaves**
- Soft double-pop for **incoming messages**
- Click sound when **you send**
- All sounds generated via Web Audio API — no external files

### 🎨 UI
- White frosted-glass panels with backdrop blur
- Custom SVG background with animated pastel colour orbs, dot grid, and geometric accents
- Animated join screen hero illustration (floating chat bubbles with typing dots)
- Animated empty-state illustration (context-aware for group vs DM)
- Fully responsive layout

---

## 🛠 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, CSS (no framework)  |
| Backend   | FastAPI, Python 3.11+               |
| Realtime  | WebSocket (native browser + FastAPI)|
| AI        | Groq API — Llama 3.3 70B            |
| Media     | FastAPI file upload + FileResponse  |
| Sounds    | Web Audio API                       |

---

## 📁 Project Structure

```
chatBot/
├── backend/
│   ├── main.py            # FastAPI app — WebSocket, upload, AI routing
│   ├── requirements.txt
│   ├── .env               # GROQ_API_KEY (not committed)
│   ├── .env.example
│   └── uploads/           # Uploaded images and voice messages
│
└── frontend/
    ├── src/
    │   ├── App.jsx         # Main app — all chat logic and UI
    │   ├── App.css         # Full light-theme styles
    │   ├── GifPanel.jsx    # Built-in curated GIF reaction panel
    │   ├── Animations.jsx  # SVG animated illustrations
    │   ├── sounds.js       # Web Audio API sound effects
    │   └── assets/
    │       └── bg.svg      # Custom SVG background
    ├── vite.config.js      # Vite proxy config for /upload and /uploads
    └── .env.example
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- A free [Groq API key](https://console.groq.com) (for AI features)

### 1. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Start the server
uvicorn main:app --reload --port 8001
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

> **Tip:** Open multiple tabs with different usernames to test multi-user chat and DMs.

---

## ⚙️ Configuration

### Backend — `backend/.env`

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get a free key at [console.groq.com](https://console.groq.com). Without it, the app still works — AI responses will show a "key not set" message.

### Frontend — `vite.config.js`

The Vite dev server proxies `/upload` and `/uploads` to `http://localhost:8001` to avoid CORS issues. No changes needed.

---

## 📡 WebSocket Message Protocol

### Client → Server

| Field    | Type   | Description                                 |
|----------|--------|---------------------------------------------|
| content  | string | Message text or uploaded file URL           |
| msgType  | string | `"text"` \| `"image"` \| `"gif"` \| `"audio"` |
| dmTo     | string | *(optional)* Username for private DM        |

### Server → Client

| type       | Description                              |
|------------|------------------------------------------|
| `system`   | Join/leave notification + updated users list |
| `message`  | Group chat message                       |
| `dm`       | Private direct message                   |
| `ai_start` | AI response started streaming            |
| `ai_chunk` | AI response token chunk                  |
| `ai_done`  | AI response complete                     |
| `error`    | Connection error (e.g. username taken)   |

---

## 🖱️ Usage Tips

| Action | How |
|---|---|
| Send message | Type + Enter (or click Send) |
| New line | Shift + Enter |
| Ask AI | `/ask your question` or click **Ask AI** button |
| Send GIF | Click **GIF** button → pick a reaction |
| Send image | Click 📷 button or drag & drop onto chat |
| Voice message | Hold 🎤 mic button → release to send |
| Open DM | Click any username in the sidebar |
| Back to group | Click **# Group Chat** or ← back button |

---

## 📦 Dependencies

### Backend
```
fastapi
uvicorn[standard]
groq
python-dotenv
websockets
python-multipart
```

### Frontend
```
react
vite
emoji-picker-react
```

---

## 🔒 Notes

- Uploaded files are stored in `backend/uploads/` and served via the backend. Clear this folder to remove old media.
- All WebSocket connections are in-memory — restarting the backend disconnects all users.
- DM message history is stored in the browser session only (not persisted).
