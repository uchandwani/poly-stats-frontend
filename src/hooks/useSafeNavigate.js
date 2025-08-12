
import { useNavigate, useLocation } from "react-router-dom";

export function useSafeNavigate() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (to, opts) => {
    if (to !== pathname) navigate(to, opts);
  };
}
