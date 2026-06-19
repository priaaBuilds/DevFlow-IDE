# DevFlow IDE — Real-Time Collaborative Code Editor

## The Vision

Imagine a world where distance doesn't divide developers. Where a developer in Tokyo and their teammate in New York can write, debug, and celebrate code together—as if they're sitting side by side in the same room.

DevFlow IDE transforms this vision into reality. This is a full-stack collaborative coding environment where multiple people edit the same file simultaneously, see each other's presence in real-time, chat alongside the code, and run code together with shared output—across 12 programming languages.

This isn't just another code editor. It's a living, breathing collaborative ecosystem where every keystroke resonates across the globe in milliseconds, ideas flow seamlessly through integrated chat, and code runs in a shared sandbox visible to everyone.

## The Experience

**Real-Time Telepathy**: Watch as your collaborators' cursors dance across the screen, their text appearing as if by magic. Powered by WebSockets, every edit is synchronized instantly—no refresh, no delay, no "Is everyone seeing what I'm seeing?"

**Side-by-Side, Not Alone**: The integrated chat panel keeps conversations flowing alongside the code. Discuss architecture, share quick jokes, or debate semicolons—all without leaving your workspace.

**Run Code Together**: With a single click, execute code in a secure sandbox powered by the Piston API. The output appears simultaneously on every screen, turning solo debugging into a team sport.

**12 Languages, Infinite Possibilities**: From Python to Rust, JavaScript to Go—DevFlow speaks your language. The Monaco Editor provides syntax highlighting, autocompletion, and IntelliSense for all supported languages.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         React Application                           │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐      │   │
│  │  │  Landing  │  │ Dashboard │  │  Room     │  │  Snippet  │      │   │
│  │  │   Page    │  │   Page    │  │   Page    │  │   Page    │      │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘      │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Monaco Editor                             │   │   │
│  │  │  (Syntax Highlighting, Autocomplete, IntelliSense)          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                   │   │
│  │  │  Presence  │  │   Chat     │  │  Console   │                   │   │
│  │  │  Sidebar   │  │   Panel    │  │   Panel    │                   │   │
│  │  └────────────┘  └────────────┘  └────────────┘                   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              Socket.IO Client                                │   │   │
│  │  │  (Real-time bidirectional communication)                    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    │ WebSocket / HTTP                      │
│                                    ▼                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER (Node.js)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Express Server                                │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    REST API Endpoints                        │   │   │
│  │  │  POST /api/rooms  │  GET /api/rooms/:id  │  POST /api/snippets│   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                   Socket.IO Server                           │   │   │
│  │  │  ┌───────────────────────────────────────────────────────┐  │   │   │
│  │  │  │              Event Handlers                           │  │   │   │
│  │  │  │  join_room │ code_change │ run_request │ chat_message │  │   │   │
│  │  │  └───────────────────────────────────────────────────────┘  │   │   │
│  │  │                                                              │   │   │
│  │  │  ┌───────────────────────────────────────────────────────┐  │   │   │
│  │  │  │           Room Management                             │  │   │   │
│  │  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │   │   │
│  │  │  │  │  Room 1     │  │  Room 2     │  │  Room N     │  │  │   │   │
│  │  │  │  │  Users: 3   │  │  Users: 5   │  │  Users: 2   │  │  │   │   │
│  │  │  │  │  Files: 2   │  │  Files: 4   │  │  Files: 1   │  │  │   │   │
│  │  │  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │   │   │
│  │  │  └───────────────────────────────────────────────────────┘  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                   Code Runner                               │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │              Piston API Integration                 │   │   │   │
│  │  │  │  (Sandboxed execution across 12+ languages)        │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    │ Database Operations                   │
│                                    ▼                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PERSISTENCE LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         MongoDB                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│  │  │  Rooms      │  │  Snippets   │  │   Chat      │                │   │
│  │  │  Collection │  │  Collection │  │  History    │                │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              In-Memory Store (Auto-Fallback)                        │   │
│  │  (Preserves collaboration when MongoDB is unavailable)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Piston API                                     │   │
│  │  (Sandboxed code execution service for 12+ languages)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Flow Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │              USER ACTION                    │
                    └─────────────────────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────────────────┐
                    │         React Component                     │
                    │    (onChange, onClick, onSubmit)            │
                    └────────────────┬────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────────────────┐
                    │      Socket.IO Client Event                 │
                    │   (code_change, run_request, chat_message)  │
                    └────────────────┬────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────────────────┐
                    │         Socket.IO Server                    │
                    │    (Receives and processes events)          │
                    └────────────────┬────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────────────────┐
                    │         Route Handler                       │
                    │   ┌──────────┐  ┌──────────┐  ┌──────────┐ │
                    │   │ Broadcast│  │ Database │  │  Execute │ │
                    │   │  to Room │  │  Update  │  │   Code   │ │
                    │   └──────────┘  └──────────┘  └──────────┘ │
                    └────────────────┬────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────────────────┐
                    │           Response to Client                │
                    │   (code_changed, run_result, presence)      │
                    └────────────────┬────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────────────────┐
                    │         UI Update (Re-render)               │
                    └─────────────────────────────────────────────┘
```

## Technology Stack

```
Frontend:     React | Vite | Monaco Editor | Socket.IO Client | React Router
Backend:      Node.js | Express | Socket.IO | Mongoose (MongoDB) | nanoid
Execution:    Piston Public API (Sandboxed Code Execution)
Persistence:  MongoDB | In-Memory Store (Auto-Fallback)
DevOps:       Git | GitHub | npm | Vite
```

## Project Structure

```
devflow-ide/
│
├── server/                         Express + Socket.IO Backend
│   ├── server.js                   REST routes + socket event handlers
│   ├── models.js                   Mongoose schemas (Room, Snippet)
│   ├── codeRunner.js               Piston API integration
│   ├── package.json
│   └── .env.example
│
└── client/                         React + Vite Frontend
    ├── src/
    │   ├── pages/
    │   │   ├── LandingPage.jsx     "Join or Create Session"
    │   │   ├── DashboardPage.jsx   Project dashboard
    │   │   ├── RoomPage.jsx        Collaborative workspace
    │   │   └── SnippetPage.jsx     Read-only snippet view
    │   ├── components/
    │   │   ├── PresenceSidebar.jsx Live collaborator list
    │   │   ├── ChatPanel.jsx       Integrated team chat
    │   │   ├── ConsolePanel.jsx    Shared code output
    │   │   └── EditorToolbar.jsx   Editor controls
    │   ├── lib/
    │   │   ├── socket.js           Socket.IO client + REST helpers
    │   │   └── languages.js        Language mapping
    │   ├── theme.css               Syntactic Dark theme
    │   ├── App.jsx                 Router configuration
    │   └── main.jsx                Entry point
    ├── package.json
    └── .env.example
```

## How It Works

**Session Creation**: A user creates or joins a room via `POST /api/rooms` or by navigating to `/room/:roomId`. The client establishes a Socket.IO connection and emits `join_room` to register presence.

**Room State Management**: The server tracks per-room presence in memory and persists room state (files, chat) to MongoDB. If MongoDB isn't reachable, the system gracefully falls back to an in-memory map—ensuring collaboration continues uninterrupted with zero configuration.

**Real-Time Code Synchronization**:
1. On every keystroke, Monaco's `onChange` fires → client emits `code_change`
2. Server broadcasts to everyone else in the room using `socket.to(roomId).emit(...)` (never back to the sender)
3. Remote clients receive `code_changed_by_other_user` and update their Monaco model
4. A smart `ignoreNextChange` guard prevents echo loops—ensuring only user-initiated changes are propagated

**Collaborative Code Execution**:
1. Any client emits `run_request` with language + content
2. Server calls Piston API for sandboxed execution
3. Server broadcasts `run_started` (execution in progress)
4. Piston returns output → server broadcasts `run_result` to all
5. Everyone sees the output simultaneously—like pairing over someone's shoulder

**Snippet Persistence**:
1. User triggers `POST /api/snippets` with current file content
2. Server creates an independent, permanent copy
3. Returns shareable URL: `/snippet/:snippetId`
4. Read-only view ensures the code remains intact and unaltered

## Setup and Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB (optional—works without it)

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env if needed, or leave as-is for in-memory fallback
npm run dev      # Uses nodemon, restarts on changes
```

The server starts on `http://localhost:4000` by default. It logs whether MongoDB connected successfully; if not, it automatically uses an in-memory store (collaboration still works, but state resets on server restart).

**MongoDB Options**:
- **Local**: Run `mongod` (default URI `mongodb://localhost:27017/devflow_ide` already matches `.env.example`)
- **Atlas**: Get your connection string and paste it into `MONGO_URI`

### Frontend Setup

```bash
cd client
npm install
cp .env.example .env
# Edit VITE_SERVER_URL if backend isn't on localhost:4000
npm run dev
```

Open `http://localhost:5173`. Create a session, then open the same URL in a second browser tab (or share the link) to see real-time collaboration in action.

## Key Real-Time Events (Socket.IO)

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join_room` | client → server | Join a session, register presence |
| `room_state` | server → client | Initial sync of files/chat on join |
| `presence_update` | server → all | Live collaborator list |
| `code_change` | client → server | Broadcast a content edit |
| `code_changed_by_other_user` | server → others | Apply a remote edit |
| `cursor_move` / `cursor_update` | bidirectional | Live cursor positions (extendable) |
| `language_change` / `language_changed` | bidirectional | Sync active file language |
| `chat_message` | bidirectional | Team chat communication |
| `run_request` / `run_started` / `run_result` | bidirectional | Shared code execution lifecycle |

## Extending DevFlow

**Multi-File Explorer**: The data model (`Room.files[]`) already supports multiple files. Add a file tree UI—`active_file_change` is already wired up.

**Live Cursors**: The `cursor_move` and `cursor_update` events exist server-side. Connect them to Monaco's `onDidChangeCursorPosition` and render decorations per collaborator color.

**IDE Settings**: Add a settings panel (font size, theme, tab width). Store in `localStorage` or MongoDB for cross-device sync.

**Authentication**: Currently anonymous with `sessionStorage` display names. Add real accounts for persistent identity across sessions and devices.

**Additional Ideas**:
- Code history with version control
- Voice/Video integration via WebRTC
- Code formatting with Prettier
- Export as GitHub Gist
- Self-hosted Piston instance for production scale

## Code Execution Notes

DevFlow uses the public Piston API—a battle-tested, sandboxed execution environment. You don't need to build or maintain your own sandboxing system.

**For Production Scale**:
- Self-host a Piston instance (it's open source)
- Implement rate limiting and request queuing
- Monitor execution time and resource usage
- Swap in alternative execution services as needed

## About This Project

A real-time, collaborative code editor powered by React, Node.js, and Socket.IO. Features instant state synchronization across clients, multi-room coding sessions, and full Monaco Editor integration. Demonstrates mastery of:

- Real-time systems (WebSockets)
- State synchronization across distributed clients
- Third-party service integration
- Full-stack development from database to UI
- Production-ready features with graceful fallbacks

## License

Distributed under the **MIT License**. See `LICENSE` for full details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to your branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- **Monaco Editor** - The engine that powers VS Code
- **Socket.IO** - Real-time bidirectional communication
- **Piston API** - Safe, sandboxed code execution
- **React** - Declarative UI library
- **Vite** - Lightning-fast builds
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - Flexible document database
- **Mongoose** - Elegant ODM

## Connect

**Author**: Lahamge Priya Somnath (@priaaBuilds)  
**GitHub**: https://github.com/priaaBuilds/DevFlow-IDE

---

*Made with code, coffee, and a passion for collaborative coding.*
