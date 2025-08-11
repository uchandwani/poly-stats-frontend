// src/config.js
const fromEnv = import.meta.env?.VITE_API_URL?.trim();
const isDev = import.meta.env.DEV;

// Use VITE_API_URL if provided; otherwise sensible fallbacks.
export const API_BASE_URL = (
  fromEnv ||
  (isDev ? 'http://localhost:5002/api' : '/api')
).replace(/\/$/, ''); // no trailing slash

