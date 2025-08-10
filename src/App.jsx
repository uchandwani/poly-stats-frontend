import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ExerciseRouter from "./pages/ExerciseRouter";
import MeanDeviationComparison from "./components/MeanDeviationComparison";

export default function App() {
  return (
    <>
      {/* Global header */}
      <Header />

      {/* Page content */}
      <div className="w-full max-w-[1440px] mx-auto px-4">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/exercise/Basics_01" replace />} />
          <Route path="/exercise" element={<Navigate to="/exercise/Basics_01" replace />} />

          {/* Example specific page (must be before :code) */}
          <Route path="/exercise/Mean_05" element={<MeanDeviationComparison />} />

          {/* Main app: all parameterized exercises */}
          <Route
            path="/exercise/:code"
            element={
              <ProtectedRoute>
                <ExerciseRouter />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/exercise/Basics_01" replace />} />
        </Routes>
      </div>
    </>
  );
}
