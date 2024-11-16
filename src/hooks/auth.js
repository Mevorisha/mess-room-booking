import { useContext } from "react";
import AuthContext from "../contexts/auth.js";

/**
 * @returns {import("../contexts/auth.js").AuthContextType}
 */
export default function useAuth() {
  return useContext(AuthContext);
}
