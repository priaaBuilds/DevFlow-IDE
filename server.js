import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import dotenv from "dotenv";

import { Room, Snippet, defaultFile } from "./models.js";
import { runCode, SUPPORTED_LANGUAGES } from "./codeRunner.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/devflow_ide";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

// ---------- MongoDB connection ----------
let dbConnected = false;
mongoose
  .connect(MONGO_URI)
  .then(() => {
    dbConnected = true;
    console.log("[mongo] connected");
  })
  .catch((err) => {
    console.error("[mongo] connection failed - persistence disabled:", err.message);
  });

// In-memory fallback store used if MongoDB isn't available, so the
// real-time collaboration still works even without a DB configured.
const memoryRooms = new Map();

async function getOrCreateRoom(roomId, name) {
  if (dbConnected) {
    let room = await Room.findOne({ roomId });
    if (!room) {
      room = await Room.create({ roomId, name: name || "Untitled Session" });
    }
    return room;
  }
  if (!memoryRooms.has(roomId)) {
    memoryRooms.set(roomId, {
      roomId,
      name: name || "Untitled Session",
      files: [defaultFile()],
      activeFileIndex: 0,
      chatHistory: [],
      createdAt: new Date(),
      lastActiveAt: new Date(),
    });
  }
  return memoryRooms.get(roomId);
}

async function saveRoom(room) {
  if (dbConnected && room.save) {
    room.lastActiveAt = new Date();
    await room.save();
  } else {
    room.lastActiveAt = new Date();
    memoryRooms.set(room.roomId, room);
  }
}

// ---------- REST API ----------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, dbConnected });
});

// List supported languages for the run-code feature
app.get("/api/languages", (req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES });
});

// Create a new room, returns the shareable roomId
app.post("/api/rooms", async (req, res) => {
  try {
    const roomId = nanoid(8);
    const room = await getOrCreateRoom(roomId, req.body?.name);
    res.json({
      roomId: room.roomId,
      name: room.name,
      shareLink: `/room/${room.roomId}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch room state (used when a client joins / refreshes)
app.get("/api/rooms/:roomId", async (req, res) => {
  try {
    const room = await getOrCreateRoom(req.params.roomId);
    res.json({
      roomId: room.roomId,
      name: room.name,
      files: room.files,
      activeFileIndex: room.activeFileIndex,
      chatHistory: room.chatHistory.slice(-100),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List recently active rooms (for a simple dashboard)
app.get("/api/rooms", async (req, res) => {
  try {
    if (dbConnected) {
      const rooms = await Room.find({}, "roomId name lastActiveAt files")
        .sort({ lastActiveAt: -1 })
        .limit(20);
      res.json({
        rooms: rooms.map((r) => ({
          roomId: r.roomId,
          name: r.name,
          lastActiveAt: r.lastActiveAt,
          fileCount: r.files.length,
        })),
      });
    } else {
      const rooms = Array.from(memoryRooms.values())
        .sort((a, b) => b.lastActiveAt - a.lastActiveAt)
        .slice(0, 20)
        .map((r) => ({
          roomId: r.roomId,
          name: r.name,
          lastActiveAt: r.lastActiveAt,
          fileCount: r.files.length,
        }));
      res.json({ rooms });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run code (stateless - does not require a room)
app.post("/api/run", async (req, res) => {
  const { language, code, stdin } = req.body || {};
  if (!language || typeof code !== "string") {
    return res.status(400).json({ error: "language and code are required" });
  }
  const result = await runCode(language, code, stdin || "");
  res.json(result);
});

// Save a personal snippet copy
app.post("/api/snippets", async (req, res) => {
  try {
    const { title, language, content, sourceRoomId } = req.body || {};
    const snippetId = nanoid(10);
    if (dbConnected) {
      await Snippet.create({ snippetId, title, language, content, sourceRoomId });
    }
    res.json({ snippetId, shareLink: `/snippet/${snippetId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/snippets/:snippetId", async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: "Persistence is not configured" });
    }
    const snippet = await Snippet.findOne({ snippetId: req.params.snippetId });
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Socket.IO real-time collaboration ----------

// roomId -> Map<socketId, { userName, color, cursor }>
const presence = new Map();

const USER_COLORS = [
  "#60a5fa", "#34d399", "#a78bfa", "#f472b6",
  "#fbbf24", "#38bdf8", "#fb923c", "#4ade80",
];

function colorForIndex(i) {
  return USER_COLORS[i % USER_COLORS.length];
}

function getPresenceList(roomId) {
  const map = presence.get(roomId);
  if (!map) return [];
  return Array.from(map.entries()).map(([socketId, info]) => ({
    socketId,
    ...info,
  }));
}

io.on("connection", (socket) => {
  let currentRoomId = null;
  let currentUserName = null;

  socket.on("join_room", async ({ roomId, userName }) => {
    try {
      currentRoomId = roomId;
      currentUserName = userName || `Guest-${socket.id.slice(0, 4)}`;

      socket.join(roomId);

      if (!presence.has(roomId)) presence.set(roomId, new Map());
      const roomPresence = presence.get(roomId);
      roomPresence.set(socket.id, {
        userName: currentUserName,
        color: colorForIndex(roomPresence.size),
        cursor: null,
      });

      const room = await getOrCreateRoom(roomId);

      // Send current state to the joining client only
      socket.emit("room_state", {
        files: room.files,
        activeFileIndex: room.activeFileIndex,
        chatHistory: room.chatHistory.slice(-100),
      });

      // Notify everyone (including the joiner) of updated presence
      io.to(roomId).emit("presence_update", getPresenceList(roomId));

      // System message in chat
      io.to(roomId).emit("chat_message", {
        userName: "System",
        text: `${currentUserName} joined the session`,
        ts: Date.now(),
        system: true,
      });
    } catch (err) {
      socket.emit("error_message", { error: err.message });
    }
  });

  // Broadcast code changes to everyone else in the room, and persist
  socket.on("code_change", async ({ roomId, fileIndex, content }) => {
    socket.to(roomId).emit("code_changed_by_other_user", { fileIndex, content });

    try {
      const room = await getOrCreateRoom(roomId);
      if (room.files[fileIndex]) {
        room.files[fileIndex].content = content;
        await saveRoom(room);
      }
    } catch (err) {
      console.error("[code_change] persist failed:", err.message);
    }
  });

  // Live cursor / selection position sharing
  socket.on("cursor_move", ({ roomId, position }) => {
    const roomPresence = presence.get(roomId);
    if (roomPresence?.has(socket.id)) {
      roomPresence.get(socket.id).cursor = position;
    }
    socket.to(roomId).emit("cursor_update", {
      socketId: socket.id,
      userName: currentUserName,
      position,
    });
  });

  // Switching the active file (for multi-file rooms)
  socket.on("active_file_change", async ({ roomId, fileIndex }) => {
    socket.to(roomId).emit("active_file_changed", { fileIndex });
    try {
      const room = await getOrCreateRoom(roomId);
      room.activeFileIndex = fileIndex;
      await saveRoom(room);
    } catch (err) {
      console.error("[active_file_change] persist failed:", err.message);
    }
  });

  // Language change for the active file (affects syntax highlighting + run target)
  socket.on("language_change", async ({ roomId, fileIndex, language }) => {
    io.to(roomId).emit("language_changed", { fileIndex, language });
    try {
      const room = await getOrCreateRoom(roomId);
      if (room.files[fileIndex]) {
        room.files[fileIndex].language = language;
        await saveRoom(room);
      }
    } catch (err) {
      console.error("[language_change] persist failed:", err.message);
    }
  });

  // Team chat
  socket.on("chat_message", async ({ roomId, text }) => {
    const message = { userName: currentUserName, text, ts: Date.now() };
    io.to(roomId).emit("chat_message", message);
    try {
      const room = await getOrCreateRoom(roomId);
      room.chatHistory.push(message);
      if (room.chatHistory.length > 200) room.chatHistory.shift();
      await saveRoom(room);
    } catch (err) {
      console.error("[chat_message] persist failed:", err.message);
    }
  });

  // Someone runs the code - broadcast result to everyone (shared console)
  socket.on("run_request", async ({ roomId, language, code, stdin }) => {
    io.to(roomId).emit("run_started", { byUser: currentUserName });
    const result = await runCode(language, code, stdin || "");
    io.to(roomId).emit("run_result", { byUser: currentUserName, ...result });
  });

  socket.on("disconnect", () => {
    if (currentRoomId && presence.has(currentRoomId)) {
      const roomPresence = presence.get(currentRoomId);
      roomPresence.delete(socket.id);
      io.to(currentRoomId).emit("presence_update", getPresenceList(currentRoomId));
      io.to(currentRoomId).emit("chat_message", {
        userName: "System",
        text: `${currentUserName || "A user"} left the session`,
        ts: Date.now(),
        system: true,
      });
      if (roomPresence.size === 0) presence.delete(currentRoomId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[server] DevFlow IDE backend listening on port ${PORT}`);
});
