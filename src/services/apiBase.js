// src/services/apiBase.js
const fromEnv = (import.meta?.env?.VITE_API_URL || "").trim();

// normalize: remove trailing slash
const normalize = (s) => s.replace(/\/+$/, "");

// Prefer same-origin proxy to avoid CORS & Firefox cross-origin navigation issues
// If VITE_API_URL is empty, default to "/api" (Rewrite handles it).
const API_BASE_URL = fromEnv ? normalize(fromEnv) : "/api";

export const API_BASE = API_BASE_URL;
export const AUTH_BASE = `${API_BASE}/auth`;

// Tiny helper to build URLs safely
export const apiUrl = (path = "") => `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;


