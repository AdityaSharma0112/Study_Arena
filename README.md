# Study Arena — ₹0 Architecture WebRTC Video Calling & AI Arena

A production-grade, zero-media-server-cost video conferencing and AI discussion arena platform built with **React (Vite)**, **Django Channels (ASGI WebSockets)**, and **WebRTC Full-Mesh P2P (Google STUN)**.

---

## 🎯 Architectural Philosophy

1. **Django DOES NOT carry the video:** All video and audio streams travel directly peer-to-peer (P2P) between browsers using public STUN (`stun:stun.l.google.com:19302`). The Django ASGI server only carries lightweight JSON signaling events (`offer`, `answer`, `ice-candidate`, `media-state`).
2. **True ₹0 Server Cost:** Vercel Hobby hosts the React frontend, Render Free hosts the Django ASGI web service, and media bandwidth is 0 GB on the server.
3. **Horizontally Scalable:** Backed by Redis Pub/Sub channel layers (`channels-redis`) and Celery background workers for scalable signaling and async evaluation.

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup (Django + Django Channels)
```bash
# In project root:
cd backend
python -m venv venv
# On Windows:
..\venv\Scripts\pip install -r requirements.txt
# Run migrations:
..\venv\Scripts\python.exe manage.py migrate
# Start Daphne ASGI Server:
..\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Backend will be running at `http://127.0.0.1:8000/` with WebSocket endpoint at `ws://127.0.0.1:8000/ws/rooms/<ROOM_CODE>/`.

### 2. Frontend Setup (React + Vite)
```bash
# In a new terminal:
cd frontend
npm install
npm run dev
```

Frontend will be running at `http://localhost:5173/`.

---

## 🧪 Testing a 2-Person or Multi-Person Call

1. Open `http://localhost:5173/` in your browser.
2. Click **Launch New Arena**, name your room, and enter the **Pre-Call Lobby**.
3. Click **Join Arena Stage**.
4. Copy the **Room Code** (e.g. `5ED1BEB8`) from the top navbar pill.
5. Open an **Incognito Window** or a second browser at `http://localhost:5173/?room=5ED1BEB8` (or paste the code in "Join Existing Room").
6. Click **Join Arena Stage** in the second window.
7. Observe instantaneous WebRTC P2P video & audio handshake, active speaker green glow indicator, mute/unmute syncing, and live chat!

---

## 🗺️ Roadmap & Next Phases

- [x] **Phase 1: Working WebRTC Mesh Call & Signaling Foundation** (Completed!)
- [ ] **Phase 2: Game Loop, Timers & Room Synchronization** (Synchronized 60s countdowns, speaker turns)
- [ ] **Phase 3: Client-Side Speech-to-Text & AI Moderator** (Web Speech STT + pluggable LLM questions)
- [ ] **Phase 4: Async Answer Evaluation & Celery Processing** (Technical depth, clarity, relevance scoring)
- [ ] **Phase 5: Communication Analytics, Docker Compose & 1-Click Deploy** (Render + Vercel scripts)
