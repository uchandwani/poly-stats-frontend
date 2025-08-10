import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchGroupedExercises } from "../api/exerciseService";

// Centralized labels
const exerciseConfig = {
  statistics: {
    basics: "Basics",
    mean: "Mean Deviation",
    sd: "Standard Deviation",
    insights: "Insights",
  },
  differential: {
    functions: "Functions",
    evenodd: "Even/Odd Functions",
    derivatives: "Derivative",
    applications: "Applications",
  },
};

// URL prefixes
const prefixMap = {
  basics: "Basics",
  mean: "Mean",
  sd: "SD",
  insights: "Insights",
  functions: "Functions",
  evenodd: "EvenOdd",
  derivatives: "Derivative",
  applications: "Applications",
};

// Default landing per top group
const DEFAULT_BY_GROUP = {
  statistics: "Basics_01",
  differential: "Functions_01",
};

// Derive section key from /exercise/Prefix_##
function sectionKeyFromPath(pathname) {
  const m = pathname.match(/\/exercise\/([A-Za-z]+)_\d+/);
  if (!m) return null;
  const prefix = m[1];
  const entry = Object.entries(prefixMap).find(
    ([, v]) => v.toLowerCase() === prefix.toLowerCase()
  );
  return entry ? entry[0] : null;
}

const readUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const [group, setGroup] = useState("statistics");
  const [activeMenu, setActiveMenu] = useState("basics");
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(null);
  const [codeMap, setCodeMap] = useState({ statistics: {}, differential: {} });

  // Auth state (no automatic guest here)
  const [user, setUser] = useState(readUser());
  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token) && user && user.role !== "guest";

  // Load grouped exercises
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

  // URL drives group/menu
  useEffect(() => {
    const key = sectionKeyFromPath(location.pathname);
    if (key) {
      setActiveMenu(key);
      setGroup(
        ["basics", "mean", "sd", "insights"].includes(key)
          ? "statistics"
          : "differential"
      );
    } else {
      setGroup("statistics");
      setActiveMenu("basics");
      const allow = ["/login", "/admin"]; // allowlist of non-exercise roots
      const isAllowed =
      allow.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
          if (!location.pathname.startsWith("/exercise/") && !isAllowed) {
          navigate(`/exercise/${DEFAULT_BY_GROUP.statistics}`, { replace: true });
          }
     }
  }, [location.pathname, navigate]);

  const currentCodeList = codeMap?.[group]?.[activeMenu] ?? [];

  // Keep the blue number highlight in sync with the URL
  useEffect(() => {
    const m = location.pathname.match(/\/exercise\/([A-Za-z]+_\d+)/);
    if (m && currentCodeList.length) {
      const idx = currentCodeList.findIndex((x) => x.code === m[1]);
      setSelectedExerciseIndex(idx >= 0 ? idx : null);
    } else {
      setSelectedExerciseIndex(null);
    }
  }, [location.pathname, currentCodeList]);

  const path = location.pathname || "";
  const isStatisticsActive = /\/exercise\/(Basics|Mean|SD|Insights)_\d+/i.test(path);
  const isDifferentialActive = /\/exercise\/(Functions|EvenOdd|Derivative|Applications)_\d+/i.test(path);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const handleGuest = () => {
    const guest = { username: "Guest", role: "guest" };
    localStorage.setItem("user", JSON.stringify(guest));
    localStorage.setItem("token", "guest-token");
    setUser(guest);
    navigate(`/exercise/${DEFAULT_BY_GROUP.statistics}`);
  };

  const handleExerciseClick = (index) => {
    const code = currentCodeList[index]?.code;
    if (code) {
      navigate(`/exercise/${code}`);
      setSelectedExerciseIndex(index);
    } else {
      const prefix = prefixMap[activeMenu];
      const fallbackCode = prefix ? `${prefix}_01` : DEFAULT_BY_GROUP[group];
      if (fallbackCode) navigate(`/exercise/${fallbackCode}`);
      setSelectedExerciseIndex(null);
    }
  };

  const topBtnBase = "px-3 py-1 rounded border text-sm transition-colors";
  const topBtnActive = "bg-blue-600 text-white border-blue-600";
  const topBtnInactive = "bg-gray-100 text-blue-800 border-gray-200 hover:bg-blue-200";

  return (
    <header className="w-full bg-gray-100 border-b shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
        {/* Top-level: Statistics / Differential */}
        <nav className="flex gap-2">
          <button
            type="button"
            className={`${topBtnBase} ${isStatisticsActive ? topBtnActive : topBtnInactive}`}
            onClick={() => {
              setGroup("statistics");
              setActiveMenu("basics");
              setSelectedExerciseIndex(null);
              navigate(`/exercise/${DEFAULT_BY_GROUP.statistics}`);
            }}
            title="Statistics (Basics_01)"
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
              navigate(`/exercise/${DEFAULT_BY_GROUP.differential}`);
            }}
            title="Differential (Functions_01)"
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

        {/* Title */}
        <h1 className="text-base font-semibold text-center flex-1 text-gray-800">
          {exerciseConfig[group]?.[activeMenu] ?? "Welcome"}
        </h1>

        {/* Exercise pills + auth controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {currentCodeList.map((ex, index) => (
            <button
              key={ex.code}
              onClick={() => handleExerciseClick(index)}
              title={ex.code}
              className={`w-6 h-6 text-xs font-bold border rounded transition-all ${
                selectedExerciseIndex === index
                  ? "bg-blue-500 text-white"
                  : "bg-white text-blue-800 hover:bg-blue-100"
              }`}
            >
              {index + 1}
            </button>
          ))}

          {isLoggedIn ? (
            <>
              <span className="text-sm text-gray-600">
                {user.username} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
              >
                Login
              </button>
              <button
                onClick={handleGuest}
                className="bg-gray-600 text-white text-xs px-2 py-1 rounded hover:bg-gray-700"
                title="Use the app without an account"
              >
                Continue as Guest
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
