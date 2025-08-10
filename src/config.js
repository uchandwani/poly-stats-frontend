// src/config.js
export const BASE = import.meta.env.DEV
  ? "http://localhost:5002/api" // Direct in dev
  : "/api";                     // Relative in prod
