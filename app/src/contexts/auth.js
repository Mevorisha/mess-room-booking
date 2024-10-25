import React, { createContext, useState } from "react";

const AuthContext = createContext({
  /** @type {{ uid: string }} */
  user: {
    uid: "",
  },
  /** @type {(user: { uid: string }) => void} */
  setUser: () => {},
});

export default AuthContext;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    /** @type {{ uid: string }} */
    ({
      uid: "",
    })
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
