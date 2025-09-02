/** USER is the base Context, used by all other contexts */

import React, { createContext, useEffect, useState } from "react";
import IdentityWrapper from "@/modules/classes/User";
import { Nullable } from "sharedtypes";

/* ---------------------------------- USER CONTEXT OBJECT ----------------------------------- */

export interface UserContextType {
  user: IdentityWrapper;
  setUser: React.Dispatch<React.SetStateAction<Nullable<IdentityWrapper>>>;
}

const UserContext = createContext<UserContextType>({
  user: IdentityWrapper.loadCurrentUser() ?? IdentityWrapper.invalid(),
  setUser: () => void 0,
});

export default UserContext;

/* ------------------------------------ USER PROVIDER COMPONENT ----------------------------------- */

export function UserProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const [initUser, setUser] = useState<Nullable<IdentityWrapper>>(IdentityWrapper.loadCurrentUser());

  // check user is not invalid after delay of 2.5 sec
  useEffect(() => {
    const clear = setTimeout(() => {
      if (initUser == null || initUser.isInvalid()) {
        console.error("Failed to fetch account from firebase");
      }
    }, 5000);
    return () => clearTimeout(clear);
  }, [initUser]);

  const user = initUser ?? IdentityWrapper.invalid();
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}
