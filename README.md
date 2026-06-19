# DevFlow IDE — Real-Time Collaborative Code Editor

A full-stack collaborative coding environment: multiple people edit the same
file at once, see each other's presence, chat alongside the code, and run
code together with shared output — across 12 languages.

## Stack

- **Backend:** Node.js, Express, Socket.IO, Mongoose (MongoDB), nanoid
- **Frontend:** React (Vite), Monaco Editor (`@monaco-editor/react`), Socket.IO client, React Router
- **Code execution:** [Piston](https://github.com/engineer-man/piston) public API (sandboxed, no need to run untrusted code yourself)
- **Persistence:** MongoDB for rooms, chat history, and saved snippets — with an automatic in-memory fallback if no database is configured, so live collaboration still works without any DB setup.

## Project structure

```
devflow-ide/
├── server/              Express + Socket.IO backend
│   ├── server.js        Main entrypoint: REST routes + socket event handlers
│   ├── models.js         Mongoose schemas (Room, Snippet)
│   ├── codeRunner.js     Piston API integration for "Run code"
│   ├── package.json
│   └── .env.example
└── client/              React + Vite frontend
    ├── src/
    │   ├── pages/
    │   │   ├── LandingPage.jsx     "Join or Create Session"
    │   │   ├── DashboardPage.jsx   "Project Dashboard"
    │   │   ├── RoomPage.jsx        The collaborative workspace (Monaco + chat + console)
    │   │   └── SnippetPage.jsx     Read-only view for shared saved snippets
    │   ├── components/
    │   │   ├── PresenceSidebar.jsx
    │   │   ├── ChatPanel.jsx
    │   │   ├── ConsolePanel.jsx
    │   │   └── EditorToolbar.jsx
    │   ├── lib/
    │   │   ├── socket.js     Shared Socket.IO client + REST helpers
    │   │   └── languages.js  Language → Monaco/Piston mapping
    │   ├── theme.css         "Syntactic Dark" design tokens
    │   ├── App.jsx           Router
    │   └── main.jsx
    ├── package.json
    └── .env.example
```

## How it works

1. A user creates or joins a room (`POST /api/rooms`, or just navigating to `/room/:roomId`).
2. The client opens a Socket.IO connection and emits `join_room`.
3. The server tracks per-room presence in memory and persists room state (files, chat) to MongoDB (or an in-memory map if MongoDB isn't reachable).
4. On every keystroke, Monaco's `onChange` fires → the client emits `code_change` → the server **broadcasts** it to everyone else in the room (`socket.to(roomId).emit(...)`, never back to the sender) and writes the new content to the room's document.
5. Other clients listen for `code_changed_by_other_user` and update their Monaco model. A small `ignoreNextChange` guard on the receiving end prevents an echo loop where applying a remote change would itself fire `onChange` and re-broadcast it.
6. Running code: any client emits `run_request` with the active file's language + content. The server calls the Piston API and broadcasts `run_started` / `run_result` to **everyone in the room**, so the console output is a shared, synchronized view — like pairing over someone's shoulder.
7. Saving a snippet (`POST /api/snippets`) takes an explicit, independent copy of the current file into its own permanent, shareable URL (`/snippet/:snippetId`), separate from the live (and more ephemeral) room state.

## Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env if your MongoDB isn't local, or leave as-is to use the in-memory fallback
npm run dev      # uses nodemon, restarts on changes
# or: npm start
```

The server starts on `http://localhost:4000` by default. It logs whether MongoDB connected successfully; if not, it automatically uses an in-memory store (presence/collab still works, but state resets on server restart).

**MongoDB options:**
- Run locally: `mongod` (default URI `mongodb://localhost:27017/devflow_ide` already matches `.env.example`)
- Or use a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and paste its connection string into `MONGO_URI`

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env
# Edit VITE_SERVER_URL if your backend isn't on localhost:4000
npm run dev
```

Open `http://localhost:5173`. Create a session, then open the same URL in a second browser tab/window (or share the link with someone else) to see real-time collaboration in action.

## Key real-time events (Socket.IO)

| Event | Direction | Purpose |
|---|---|---|
| `join_room` | client → server | Join a session, register presence |
| `room_state` | server → client | Initial sync of files/chat on join |
| `presence_update` | server → all in room | Live collaborator list |
| `code_change` | client → server | Broadcast a content edit |
| `code_changed_by_other_user` | server → others | Apply a remote edit |
| `cursor_move` / `cursor_update` | bidirectional | (Hook included for live cursor positions — wire into Monaco's `onDidChangeCursorPosition` to extend) |
| `language_change` / `language_changed` | bidirectional | Sync the active file's language across clients |
| `chat_message` | bidirectional | Team chat |
| `run_request` / `run_started` / `run_result` | bidirectional | Shared code execution |

## Extending this

- **Multi-file explorer:** The data model (`Room.files[]`) already supports multiple files per room — add a file tree UI and `active_file_change` is already wired up.
- **Live cursors:** The `cursor_move`/`cursor_update` socket events exist server-side; connect them to Monaco's `onDidChangeCursorPosition` and render decorations per collaborator color.
- **IDE Settings:** Add a settings panel (font size, theme, tab width) stored in `localStorage` or per-user prefs in Mongo.
- **Auth:** Currently anonymous with a display name in `sessionStorage`. Add real accounts if you want persistent identity across sessions/devices.

## Notes on the "Run code" feature

Code execution goes through the public Piston API rather than executing
arbitrary code on your own server — this avoids needing to build a sandboxing
system from scratch. For production use at scale, consider self-hosting a
Piston instance (it's open source) or swapping in another sandboxed
execution service.
