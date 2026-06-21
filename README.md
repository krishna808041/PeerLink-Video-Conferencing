<div align="center">

# PeerLink

### Real-Time Video Conferencing Web Application

Create or join meeting rooms, connect through peer-to-peer audio/video, chat in real time, and revisit meeting history.

<p>
  <a href="https://peerlink-video-meet.onrender.com"><img src="https://img.shields.io/badge/Live_Demo-Open_PeerLink-FF7A00?style=for-the-badge&logo=render&logoColor=white" alt="Live Demo" /></a>
  <a href="https://github.com/krishna808041/PeerLink-Video-Conferencing"><img src="https://img.shields.io/badge/Source_Code-GitHub-181717?style=for-the-badge&logo=github" alt="GitHub Repository" /></a>
</p>

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Material_UI-9-007FFF?style=flat-square&logo=mui&logoColor=white" alt="Material UI" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js and Express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/WebRTC-P2P-333333?style=flat-square&logo=webrtc&logoColor=white" alt="WebRTC" />
  <img src="https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=flat-square&logo=render&logoColor=black" alt="Render" />
</p>

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Application Flow](#application-flow)
- [System Architecture](#system-architecture)
- [WebRTC Signalling Flow](#webrtc-signalling-flow)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [REST API](#rest-api)
- [Socket Events](#socket-events)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Testing the Application](#testing-the-application)
- [Current Scope and Limitations](#current-scope-and-limitations)
- [Roadmap](#roadmap)
- [Author](#author)

---

## Overview

**PeerLink** is a MERN-based video conferencing application that combines **WebRTC** for peer-to-peer media transmission with **Socket.IO** for signalling and real-time messaging. Users can register, sign in, join a meeting with a code, communicate through video/audio and chat, control their media devices, share their screen, and view previously joined meeting codes.

The project demonstrates the complete lifecycle of a real-time communication application: authentication, room joining, peer negotiation, ICE exchange, media controls, participant cleanup, chat delivery, and meeting-history persistence.

> **Live application:** [peerlink-video-meet.onrender.com](https://peerlink-video-meet.onrender.com)

---

## Key Features

| Area | Functionality |
|---|---|
| User access | Register, sign in, sign out, and protect authenticated routes |
| Guest access | Join a meeting without creating an account |
| Meeting rooms | Create or join a room using a meeting code |
| Video conferencing | Peer-to-peer video communication through WebRTC |
| Audio controls | Mute or unmute the local microphone |
| Camera controls | Enable or disable the local camera |
| Screen sharing | Share the current screen during a meeting |
| Real-time chat | Exchange messages with all participants in the same room |
| Dynamic layouts | Rearrange remote participant tiles based on room size |
| Join and leave handling | Add new participants and remove disconnected participant tiles |
| Meeting history | Save and display meeting codes for authenticated users |
| Responsive lobby | Enter a display name and preview the meeting-entry experience |
| Deployment | Separate frontend and backend services connected through environment variables |

---

## Application Flow

```mermaid
flowchart LR
    A[Open PeerLink] --> B{Choose access mode}
    B --> C[Register or Sign In]
    B --> D[Join as Guest]
    C --> E[Home]
    E --> F[Enter Meeting Code]
    D --> G[Enter Display Name and Meeting Code]
    F --> H[Meeting Lobby]
    G --> H
    H --> I[Grant Camera and Microphone Access]
    I --> J[Join Socket.IO Room]
    J --> K[Negotiate WebRTC Peers]
    K --> L[Video, Audio and Chat]
    L --> M[Leave Meeting]
    M --> N[History for Authenticated User]
```

---

## System Architecture

```mermaid
flowchart TB
    subgraph BrowserA[Participant A]
        ReactA[React UI]
        PeerA[RTCPeerConnection]
        MediaA[Camera, Microphone, Screen]
    end

    subgraph BrowserB[Participant B]
        ReactB[React UI]
        PeerB[RTCPeerConnection]
        MediaB[Camera, Microphone, Screen]
    end

    subgraph Backend[Node.js Backend]
        Express[Express REST API]
        Signalling[Socket.IO Signalling and Chat]
    end

    Mongo[(MongoDB Atlas)]
    STUN[Google STUN Server]

    ReactA --> Signalling
    ReactB --> Signalling
    PeerA <--> PeerB
    MediaA --> PeerA
    MediaB --> PeerB
    PeerA --> STUN
    PeerB --> STUN
    ReactA --> Express
    ReactB --> Express
    Express --> Mongo
```

### Responsibility Split

- **WebRTC** carries participant audio, video, and screen-share media directly between browsers.
- **Socket.IO** exchanges offers, answers, ICE candidates, room membership changes, and chat messages.
- **Express REST APIs** handle registration, login, meeting-history creation, and history retrieval.
- **MongoDB** stores user data and meeting-history records.

---

## WebRTC Signalling Flow

```mermaid
sequenceDiagram
    participant A as Participant A
    participant S as Socket.IO Server
    participant B as Participant B

    A->>S: join-call(roomPath)
    B->>S: join-call(roomPath)
    S-->>A: user-joined(B, participants)
    S-->>B: user-joined(B, participants)
    A->>A: createOffer()
    A->>S: signal(B, offer)
    S-->>B: signal(A, offer)
    B->>B: setRemoteDescription() and createAnswer()
    B->>S: signal(A, answer)
    S-->>A: signal(B, answer)
    A->>S: signal(B, ICE candidate)
    S-->>B: signal(A, ICE candidate)
    B->>S: signal(A, ICE candidate)
    S-->>A: signal(B, ICE candidate)
    A<<-->>B: Direct WebRTC media connection
```

The signalling server coordinates connection setup but does not normally relay the media stream itself.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, React Router |
| UI | Material UI, Emotion, CSS Modules |
| Real-time communication | WebRTC, Socket.IO Client |
| Backend | Node.js, Express.js, Node HTTP Server |
| Signalling and chat | Socket.IO |
| Database | MongoDB, Mongoose, MongoDB Atlas |
| Authentication | bcrypt password hashing, opaque session token |
| HTTP client | Axios |
| Deployment | Render Static Site and Render Web Service |

---

## Project Structure

```text
PeerLink-Video-Conferencing/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── socketManager.js
│   │   │   └── user.controller.js
│   │   ├── models/
│   │   │   ├── meeting.model.js
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   └── users.routes.js
│   │   └── app.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── GuestJoin.jsx
│   │   │   ├── VideoMeet.jsx
│   │   │   ├── authentication.jsx
│   │   │   ├── history.jsx
│   │   │   ├── home.jsx
│   │   │   └── landing.jsx
│   │   ├── styles/
│   │   │   └── videoComponent.module.css
│   │   ├── utils/
│   │   │   └── withAuth.jsx
│   │   ├── App.jsx
│   │   ├── environment.jsx
│   │   └── main.jsx
│   └── package.json
│
└── .gitignore
```

---

## REST API

Base path:

```text
/api/v1/users
```

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/register` | Create a new user with a bcrypt-hashed password |
| `POST` | `/login` | Validate credentials and return a session token |
| `POST` | `/add_to_activity` | Save a meeting code to the authenticated user's history |
| `GET` | `/get_all_activity?token=...` | Return the user's saved meeting history |

### Example registration request

```json
{
  "name": "Krishna Panjawani",
  "username": "krishna",
  "password": "your_password"
}
```

### Example login response

```json
{
  "token": "generated_session_token"
}
```

---

## Socket Events

### Client to server

| Event | Payload | Purpose |
|---|---|---|
| `join-call` | Room path | Add a socket to a meeting room |
| `signal` | Target socket ID, signalling message | Relay offer, answer, or ICE candidate |
| `chat-message` | Message text, sender name | Send a message to the room |
| `disconnect` | Automatic | Remove the socket from active rooms |

### Server to client

| Event | Purpose |
|---|---|
| `user-joined` | Inform participants that a socket joined and share the room participant list |
| `signal` | Deliver signalling data from another participant |
| `chat-message` | Deliver a room chat message |
| `user-left` | Remove a disconnected participant from the interface |

---

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- MongoDB Atlas database or local MongoDB instance
- A modern browser with WebRTC support
- Camera and microphone permissions

### Clone the repository

```bash
git clone https://github.com/krishna808041/PeerLink-Video-Conferencing.git
cd PeerLink-Video-Conferencing
```

### Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

## Environment Variables

Never commit real credentials. Create the following local environment files.

<details>
<summary><strong>Backend environment — <code>backend/.env</code></strong></summary>

```env
PORT=8000
MONGO_URL=mongodb+srv://username:password@cluster.example.mongodb.net/peerlink
```

</details>

<details>
<summary><strong>Frontend environment — <code>frontend/.env</code></strong></summary>

```env
VITE_BACKEND_URL=http://localhost:8000
```

The frontend configuration should read `VITE_BACKEND_URL` and use it for both Axios requests and the Socket.IO connection.

</details>

---

## Running Locally

Open two terminals.

### Start the backend

```bash
cd backend
npm run dev
```

The backend normally runs at:

```text
http://localhost:8000
```

### Start the frontend

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

### Production build check

```bash
cd frontend
npm run build
npm run preview
```

---

## Deployment

PeerLink is deployed as separate frontend and backend services on Render.

### Backend Web Service

```text
Root Directory: backend
Build Command: npm ci
Start Command: npm start
```

Set `MONGO_URL` in the Render environment and allow the service's outbound addresses in MongoDB Atlas Network Access when required.

### Frontend Static Site

```text
Root Directory: frontend
Build Command: npm ci && npm run build
Publish Directory: dist
```

Set:

```env
VITE_BACKEND_URL=https://your-peerlink-backend.onrender.com
```

### React Router rewrite

Because PeerLink uses browser-side routing, configure:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

### Live deployment

```text
https://peerlink-video-meet.onrender.com
```

---

## Testing the Application

Use two different browser profiles or devices for a realistic meeting test.

- [ ] Registration creates a user
- [ ] Login returns a token and opens the home page
- [ ] Guest join opens the meeting lobby
- [ ] Meeting code routes both users to the same room
- [ ] Camera and microphone permission prompts appear
- [ ] Both participants receive remote audio and video
- [ ] Mute and unmute work
- [ ] Camera on and off work
- [ ] Screen sharing starts and restores the camera afterward
- [ ] Chat messages reach every room participant
- [ ] A leaving participant is removed immediately
- [ ] Meeting history is displayed in newest-first order
- [ ] Refreshing `/auth`, `/home`, `/history`, and a meeting route does not return a 404

### Multi-device note

`localhost` on a phone means the phone itself. To test across devices, use the deployed frontend/backend or expose the local services through a reachable network address with the correct CORS configuration.

---

## Current Scope and Limitations

- PeerLink currently uses a **mesh WebRTC topology**, which is best suited to small meeting rooms because every participant connects directly to every other participant.
- The configured public STUN server assists with NAT discovery, but no production TURN relay is currently documented. Some restrictive networks may therefore fail to establish media connections.
- Active Socket.IO room and chat data is held in server memory and is cleared when the backend restarts.
- The current opaque session token is stored in browser local storage; production authentication should move toward expiring, revocable, HTTP-only cookie sessions.
- Chat history is temporary for the active server process, while authenticated meeting-code history is stored in MongoDB.
- Render free-tier services may take time to wake after inactivity.

---

## Roadmap

- [ ] Add a TURN server for reliable connectivity on restrictive networks
- [ ] Replace legacy media APIs with a fully track-based WebRTC lifecycle
- [ ] Add ICE-candidate queuing and stronger reconnection handling
- [ ] Add expiring server-side sessions and secure HTTP-only cookies
- [ ] Move room state and chat to Redis for multi-instance deployment
- [ ] Add pagination and protected server-side meeting history
- [ ] Add recording and participant moderation controls
- [ ] Improve mobile layouts and accessibility
- [ ] Add automated unit, API, and multi-browser WebRTC tests
- [ ] Adopt an SFU architecture for larger meetings

---

## Author

**Krishna Panjawani**  
Computer Engineering Student · Full-Stack Developer

- GitHub: [@krishna808041](https://github.com/krishna808041)
- Live Project: [PeerLink](https://peerlink-video-meet.onrender.com)

---

## Project Usage

This project is shared for educational and portfolio purposes. Add a `LICENSE` file to the repository if you want to define permissions for reuse, modification, and distribution.

<div align="center">

**Connect instantly. Communicate in real time. Stay linked with PeerLink.**

[Back to top](#peerlink)

</div>
