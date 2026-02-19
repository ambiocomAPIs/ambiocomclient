// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const me = async () => {
    try {
      const { data } = await axios.get("https://ambiocomserver.onrender.com/api/auth/me", { withCredentials: true });
      // console.log("ME RESPONSE:", data);
      setUser(data.user); // {id,email,rol}
    } catch (err) {
      console.log("ME ERROR:", err?.response?.status, err?.response?.data || err?.message);
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    me();
  }, []);

  useEffect(() => {
    // console.log("ROL CONTEXT:", user?.rol, "USER CONTEXT:", user, "loadingAuth:", loadingAuth);
    console.log("ROL CONTEXT:", user?.rol);
  }, [user, loadingAuth]);

  const logout = async () => {
    await axios.post("https://ambiocomserver.onrender.com/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        rol: user?.rol,
        isAuth: !!user,
        loadingAuth,
        refreshMe: me,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
