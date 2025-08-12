// src/components/Header.jsx
import { Link, useLocation } from "react-router-dom";
import { useSafeNavigate } from "../hooks/useSafeNavigate";
import { useEffect, useState } from "react";
import { fetchGroupedExercises } from "../api/exerciseService";

// Map tabs & fallbacks (unchanged pieces trimmed for brevity)
const exerciseConfig = {
  statistics: { basics: "Basics", mean: "Mean Deviation", sd: "Standard Deviation", insights: "Insights" },
  differential: { functions: "Functions", evenodd: "Even/Odd Functions", derivatives: "Derivative", applications: "Applications" },
};
const prefixMap = {
  basics: "Basics", mean: "Mean", sd: "SD", insights: "Insights",
  functions: "Functions", evenodd: "EvenOdd", derivatives: "Derivative", applications: "Applications",
};
const DEFAULT_BY_GROUP = { statistics: "Basics_01", differential: "Functions_01" };

function sectionKeyFromPath(pathname) {
  const m = pathname.match(/\/exercise\/([A-Za-z]+)_\d+/);
  if (!m) return null;
  const prefix = m[1];
  const entry = Object.entries(prefixMap).find(([, v]) => v.toLowerCase() === prefix.toLowerCase());
  return entry ? entry[0] : null;
}

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem("user");
    return raw && raw !== "undefined" ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Header() {
  const location = useLocation();
  const safeNavigate = useSafeNavigate();

  // --- auth state that actually re-renders the chip ---
  const [user, setUser] = useState(getUserFromStorage() || { username: "Guest", role: "guest" });
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  // reflect auth changes from login/logout or other tabs
  useEffect(() => {
    const sync = () => setUser(getUserFromStorage() || { username: "Guest", role: "guest" });
    sync(); // on mount + route change
    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
    };
  }, [location.pathname]);

  const [group, setGroup] = useState("statistics");
  const [activeMenu, setActiveMenu] = useState("basics");
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(null);

  const [codeMap, setCodeMap] = useState({ statistics: {}, differential: {} });

  // Fetch grouped exercise codes
  useEffect(() => {
    (async () => {
      const grouped = await fetchGroupedExercises();
      setCodeMap({
        statistics: {
          basics: grouped.basics ?? [],
          mean: grouped.mean ?? [],
          sd: grouped.sd ?? [],
          insights: grouped.insights ?? [],
        },
        differential: {
          functions: grouped.functions ?? [],
          evenodd: grouped.evenodd ?? [],
          derivatives: grouped.derivatives ?? [],
          applications: grouped.applications ?? [],
        },
      });
    })();
  }, []);

  // URL drives section/group
  // URL drives section/group + a single safe default redirect from root
    useEffect(() => {
      const key = sectionKeyFromPath(location.pathname);
      if (key) {
        setActiveMenu(key);
        setGroup(["basics", "mean", "sd", "insights"].includes(key) ? "statistics" : "differential");
        return;
      }
      // Only redirect from "/" (landing). Do NOT redirect from other routes to avoid loops.
      if (location.pathname === "/" || location.pathname === "/index.html") {
        setGroup("statistics");
        setActiveMenu("basics");
        const target = `/exercise/${DEFAULT_BY_GROUP.statistics}`;
        if (location.pathname !== target) safeNavigate(target, { replace: true });
      }
    }, [location.pathname, safeNavigate]);


  const currentCodeList = codeMap?.[group]?.[activeMenu] ?? [];
  const path = location.pathname || "";
  const isStatisticsActive = /\/exercise\/(Basics|Mean|SD|Insights)_\d+/i.test(path);
  const isDifferentialActive = /\/exercise\/(Functions|EvenOdd|Derivative|Applications)_\d+/i.test(path);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed")); // tell header to refresh
    safeNavigate("/", { replace: true });
  };

  const continueAsGuest = () => {
    const guest = { username: "Guest", role: "guest" };
    localStorage.setItem("user", JSON.stringify(guest));
    localStorage.setItem("token", "guest-token");
    window.dispatchEvent(new Event("auth-changed"));
    if (!location.pathname.startsWith("/exercise/")) {
      safeNavigate(`/exercise/${DEFAULT_BY_GROUP.statistics}`, { replace: true });
    }
  };

  const handleExerciseClick = (index) => {
    const code = currentCodeList[index]?.code;
    if (code) {
      safeNavigate(`/exercise/${code}`, {replace: true});
      setSelectedExerciseIndex(index);
    } else {
      const prefix = prefixMap[activeMenu];
      const fallback = prefix ? `${prefix}_01` : DEFAULT_BY_GROUP[group];
      safeNavigate(`/exercise/${fallback}`, {replace: true});
      setSelectedExerciseIndex(null);
    }
  };

  const topBtnBase = "px-3 py-1 rounded border text-sm transition-colors";
  const topBtnActive = "bg-blue-600 text-white border-blue-600";
  const topBtnInactive = "bg-gray-100 text-blue-800 border-gray-200 hover:bg-blue-200";

  return (
    <header className="w-full bg-gray-100 border-b shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
        {/* Top-level group buttons */}
        <nav className="flex gap-2">
          <button
            type="button"
            className={`${topBtnBase} ${isStatisticsActive ? topBtnActive : topBtnInactive}`}
            onClick={() => {
              setGroup("statistics");
              setActiveMenu("basics");
              setSelectedExerciseIndex(null);
              safeNavigate(`/exercise/${DEFAULT_BY_GROUP.statistics}`, { replace: true });
            }}
          >
            Statistics
          </button>

          <button
            type="button"
            className={`${topBtnBase} ${isDifferentialActive ? topBtnActive : topBtnInactive}`}
            onClick={() => {
              setGroup("differential");
              setActiveMenu("functions");
              setSelectedExerciseIndex(null);
              safeNavigate(`/exercise/${DEFAULT_BY_GROUP.differential}`, { replace: true });
            }}
          >
            Differential
          </button>
        </nav>

        {/* Section tabs */}
        <nav className="flex gap-4 text-sm font-medium text-blue-700">
          {Object.entries(exerciseConfig[group]).map(([key, label]) => {
            const firstFromApi = codeMap?.[group]?.[key]?.[0]?.code;
            const prefix = prefixMap[key];
            const targetCode = firstFromApi || (prefix ? `${prefix}_01` : DEFAULT_BY_GROUP[group]);

            return (
              <Link
                key={key}
                to={`/exercise/${targetCode}`}
                onClick={() => {
                  setActiveMenu(key);
                  setSelectedExerciseIndex(null);
                }}
                className={`hover:underline ${activeMenu === key ? "underline font-bold text-black" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: user chip + auth actions + exercise buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Exercise number buttons */}
          {currentCodeList.map((ex, index) => (
            <button
              key={ex.code}
              onClick={() => handleExerciseClick(index)}
              title={ex.code}
              className={`w-6 h-6 text-xs font-bold border rounded transition-all ${
                selectedExerciseIndex === index ? "bg-blue-500 text-white" : "bg-white text-blue-800 hover:bg-blue-100"
              }`}
            >
              {index + 1}
            </button>
          ))}

          {/* User chip - always visible */}
          <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
            {user?.username ?? "Guest"}{" "}
            <span className="opacity-70">({user?.role ?? "guest"})</span>
          </span>

          {/* Auth actions */}
          {!isLoggedIn || user?.role === "guest" ? (
            <>
              <Link
                to="/"
                className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                title="Log in"
              >
                Login
              </Link>
              <button
                onClick={continueAsGuest}
                className="bg-gray-600 text-white text-xs px-2 py-1 rounded hover:bg-gray-700"
                title="Continue as Guest"
              >
                Continue as Guest
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700"
              title="Log out"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
