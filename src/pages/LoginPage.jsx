import { useState } from "react";
import axios from "axios";
import { useSafeNavigate } from "../hooks/useSafeNavigate";
import { AUTH_BASE } from "../services/apiBase";


export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  console.log("The user name is ", username);
  const [error, setError] = useState("");
  const safeNavigate = useSafeNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const res = await axios.post(`${AUTH_BASE}/login`, {
      username,
      password,
    });

    const { token, user } = res.data;

    // ✅ Safety check: ensure token and user are defined
    if (!token || !user) {
      throw new Error("Invalid response from server");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    alert(`✅ Welcome ${user.username} (${user.role})`);

    // ✅ Redirect based on role
     if (user.role === "admin") {
     safeNavigate("/admin/dashboard", { replace: true });
    } else {
     safeNavigate("/exercise/Basics_01", { replace: true });
    }

  } catch (err) {
    console.error("❌ Login error:", err);

    const message =
      err.response?.data?.message ||
      err.response?.data?.error || // for backend that returns `error` instead of `message`
      err.message ||
      "❌ Login failed. Please try again.";

    setError(message);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-semibold mb-4 text-center">Login</h2>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => {
            setUsername("guest");
            setPassword("guest");
            document.querySelector("form").requestSubmit(); // triggers the form submit
          }}
          className="w-full mt-2 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
        >
          Login as Guest
        </button>

      </form>
    </div>
  );
}
