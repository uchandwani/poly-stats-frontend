import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import MasterExerciseUI from "./pages/MasterExerciseUI";
import MeanDeviationConfig from "./components/MeanDeviationConfig";
import MeanDeviationComparison from "./components/MeanDeviationComparison";
import StatMeasures from "./pages/StatMeasures"; // ✅
import StatMeasuresComp from "./pages/StatMeasuresCompare";
import ExerciseRouter from "./pages/ExerciseRouter";
import ProblemHeaderDisplay from "./components/ProblemHeaderDisplay";

function App() {
  return (
    <>
      {/* ✅ Full-width header */}
      <Header />

      {/* ✅ Centered content below header */}
      <div className="w-full max-w-[1440px] mx-auto px-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />

          {/* Optional shortcut to comparison page */}
          <Route path="/exercise/Mean_05" element={<MeanDeviationComparison />} />

          {/* Default redirect to Basics_01 */}
          <Route path="/exercise" element={<Navigate to="/exercise/Basics_01" replace />} />

          {/* All parameterized exercises */}
          <Route
            path="/exercise/:code"
            element={
              <ProtectedRoute>
                <ExerciseRouter />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
