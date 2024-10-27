import React, { createContext, useState } from "react";

export class User {
  /**
   * @param {string} uid
   * @param {"TENANT" | "OWNER" | ""} type
   * @param {string} photoURL
   */
  constructor(uid, type, photoURL) {
    this.uid = uid;
    this.type = type;
    this.photoURL = photoURL;
  }

  static empty() {
    return new User("", "", "");
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
