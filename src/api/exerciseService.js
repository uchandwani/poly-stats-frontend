// src/api/exerciseService.js
import { API_BASE } from "../services/apiBase";


export async function fetchGroupedExercises() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_BASE}/exercises/grouped`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("❌ Network error fetching exercises:", err);
    return {};
  }
}

