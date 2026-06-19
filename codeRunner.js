import fetch from "node-fetch";

// Piston is a free, public, sandboxed code execution engine
// (https://github.com/engineer-man/piston). We use the public
// instance so we never execute untrusted user code ourselves.
const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

// Maps our editor's "language" field to Piston's expected
// language + version identifiers.
const LANGUAGE_MAP = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "cpp", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
  csharp: { language: "csharp", version: "6.12.0" },
  go: { language: "go", version: "1.16.2" },
  ruby: { language: "ruby", version: "3.0.1" },
  rust: { language: "rust", version: "1.68.2" },
  php: { language: "php", version: "8.2.3" },
  bash: { language: "bash", version: "5.2.0" },
};

const FILENAME_MAP = {
  javascript: "main.js",
  typescript: "main.ts",
  python: "main.py",
  java: "Main.java",
  cpp: "main.cpp",
  c: "main.c",
  csharp: "main.cs",
  go: "main.go",
  ruby: "main.rb",
  rust: "main.rs",
  php: "main.php",
  bash: "main.sh",
};

export async function runCode(language, sourceCode, stdin = "") {
  const mapping = LANGUAGE_MAP[language];
  if (!mapping) {
    return {
      ok: false,
      error: `Running code in "${language}" is not supported yet.`,
    };
  }

  try {
    const res = await fetch(PISTON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: mapping.language,
        version: mapping.version,
        files: [
          {
            name: FILENAME_MAP[language] || "main",
            content: sourceCode,
          },
        ],
        stdin,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Execution service error (${res.status})` };
    }

    const data = await res.json();

    const stdout = data?.run?.stdout || "";
    const stderr = data?.run?.stderr || "";
    const compileStderr = data?.compile?.stderr || "";
    const signal = data?.run?.signal;

    return {
      ok: true,
      stdout,
      stderr: compileStderr ? `${compileStderr}\n${stderr}` : stderr,
      signal,
    };
  } catch (err) {
    return { ok: false, error: err.message || "Failed to execute code" };
  }
}

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_MAP);
