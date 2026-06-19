import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Represents a single file inside a collaborative room.
 * Most simple sessions will only have one file, but this
 * structure leaves room for a multi-file explorer later.
 */
const FileSchema = new Schema(
  {
    name: { type: String, required: true, default: "main.js" },
    language: { type: String, required: true, default: "javascript" },
    content: { type: String, default: "" },
  },
  { _id: false }
);

/**
 * A Room is a live (or formerly live) collaborative session.
 * roomId is the short, URL-safe, shareable code (e.g. "x7f3kq").
 */
const RoomSchema = new Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "Untitled Session" },
    files: { type: [FileSchema], default: () => [defaultFile()] },
    activeFileIndex: { type: Number, default: 0 },
    chatHistory: {
      type: [
        {
          userName: String,
          text: String,
          ts: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

function defaultFile() {
  return {
    name: "main.js",
    language: "javascript",
    content: `// Welcome to DevFlow IDE
// Start typing - everyone in this room sees your changes live.

function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet("World");
`,
  };
}

export const Room = mongoose.model("Room", RoomSchema);

/**
 * A SavedSnippet is an explicit "save a copy" action by a user,
 * separate from the live room state, for their personal library.
 */
const SnippetSchema = new Schema({
  snippetId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: "Untitled Snippet" },
  language: { type: String, default: "javascript" },
  content: { type: String, default: "" },
  sourceRoomId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Snippet = mongoose.model("Snippet", SnippetSchema);

export { defaultFile };
