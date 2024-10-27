import { useContext } from "react";
import AuthContext, { AuthState, User } from "../contexts/auth.js";

/**
 * @returns {{ state: AuthState, user: User }}
 */
export default function useAuth() {
  const { state, user } = useContext(AuthContext);
  return { state, user };
}
