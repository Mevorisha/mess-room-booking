import React, { createContext, useState } from "react";

export class User {
  /**
   * @param {string} uid
   */
  constructor(uid) {
    this.uid = uid;
  }
}

const AuthContext = createContext({
  /** @type {User | null} */
  user: null,
  /** @type {(user: User | null) => void} */
  setUser: () => {},
});

export default AuthContext;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(/** @type {User | null} */ (null));

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
