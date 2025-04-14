/** USER is the base Context, used by all other contexts */

import React, { createContext, useCallback, useState } from "react";
import UploadedImage from "@/modules/classes/UploadedImage";
import User from "@/modules/classes/User";

/* ---------------------------------- USER CONTEXT OBJECT ----------------------------------- */

export interface DispatchUserActions {
  from?: User;
  fromFirebaseAuth?: import("firebase/auth").User;
  type?: "TENANT" | "OWNER";
  email?: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  profilePhotos?: UploadedImage;
  identityPhotos?: { workId?: UploadedImage; govId?: UploadedImage };
}

export interface UserContextType {
  user: User;
  dispatchUser: (action: DispatchUserActions | "LOADCURRENT" | "RESET") => void;
}

const UserContext = createContext<UserContextType>({
  user: User.empty(),
  dispatchUser: () => void 0,
});

export default UserContext;

/* ------------------------------------ USER PROVIDER COMPONENT ----------------------------------- */

export function UserProvider({ children }: { children: React.JSX.Element }): React.JSX.Element {
  const [user, setUser] = useState(User.loadCurrentUser());

  const dispatchUser = useCallback(
    (action: DispatchUserActions | "LOADCURRENT" | "RESET") =>
      setUser((oldUser) => {
        if (action === "LOADCURRENT") return User.loadCurrentUser();
        else if (action === "RESET") return User.empty();
        else if (action.from != null) return action.from;
        else if (action.fromFirebaseAuth != null) return User.fromFirebaseAuthUser(action.fromFirebaseAuth);

        const newUser = oldUser.clone();

        if (action.type != null) {
          newUser.setType(action.type);
        }
        if (action.email != null) {
          newUser.setEmail(action.email);
        }
        if (action.mobile != null) {
          newUser.setMobile(action.mobile);
        }
        if (action.firstName != null) {
          newUser.setProfileName(action.firstName, null);
        }
        if (action.lastName != null) {
          newUser.setProfileName(null, action.lastName);
        }
        if (action.profilePhotos != null) {
          newUser.setProfilePhotos(action.profilePhotos);
        }
        if (action.identityPhotos?.workId != null) {
          newUser.setIdentityPhotos({ workId: action.identityPhotos.workId });
        }
        if (action.identityPhotos?.govId != null) {
          newUser.setIdentityPhotos({ govId: action.identityPhotos.govId });
        }

        return newUser;
      }),
    [setUser]
  );

  return (
    <UserContext.Provider
      value={{
        user,
        dispatchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
