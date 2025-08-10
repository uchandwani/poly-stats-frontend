
// src/services/apiBase.js
import { API_BASE_URL } from "../config";

export const API_BASE = API_BASE_URL;            // <- now uses VITE_API_URL in prod
export const AUTH_BASE = `${API_BASE}/auth`;

