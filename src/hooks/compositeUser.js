import { useContext } from "react";
import AuthContext from "../contexts/auth.js";
import AccountContext from "../contexts/account.js";
import ProfileContext from "../contexts/profile.js";
import IdentityContext from "../contexts/identity.js";
import UserContext from "../contexts/user.js";

/**
 * @typedef {{
 *   userCtx: import("../contexts/user.js").UserContextType;
 *   authCtx: import("../contexts/auth.js").AuthContextType;
 *   accountCtx: import("../contexts/account.js").AccountContextType;
 *   profileCtx: import("../contexts/profile.js").ProfileContextType;
 *   identityCtx: import("../contexts/identity.js").IdentityContextType;
 * }} CompositeUserContextType
 *
 * @returns {CompositeUserContextType}
 */
export default function useCompositeUser() {
  return {
    userCtx: useContext(UserContext),
    authCtx: useContext(AuthContext),
    accountCtx: useContext(AccountContext),
    profileCtx: useContext(ProfileContext),
    identityCtx: useContext(IdentityContext),
  };
}
