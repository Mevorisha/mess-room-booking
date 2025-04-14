import { useContext } from "react";
import AuthContext from "@/contexts/auth.jsx";
import AccountContext from "@/contexts/account.jsx";
import ProfileContext from "@/contexts/profile.jsx";
import IdentityContext from "@/contexts/identity.jsx";
import UserContext from "@/contexts/user.jsx";

export interface CompositeUserContextType {
  userCtx: import("@/contexts/user.jsx").UserContextType;
  authCtx: import("@/contexts/auth.jsx").AuthContextType;
  accountCtx: import("@/contexts/account.jsx").AccountContextType;
  profileCtx: import("@/contexts/profile.jsx").ProfileContextType;
  identityCtx: import("@/contexts/identity.jsx").IdentityContextType;
}

export default function useCompositeUser(): CompositeUserContextType {
  return {
    userCtx: useContext(UserContext),
    authCtx: useContext(AuthContext),
    accountCtx: useContext(AccountContext),
    profileCtx: useContext(ProfileContext),
    identityCtx: useContext(IdentityContext),
  };
}
