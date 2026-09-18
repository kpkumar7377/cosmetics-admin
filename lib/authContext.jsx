"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadUser = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      if (data.user.role !== "admin") throw new Error("Not an admin account");
      setUser(data.user);
    } catch (_) {
      localStorage.removeItem("adminToken");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Route guard: redirect to /login if not authenticated (except on the login page itself).
  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, user, pathname, router]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.user.role !== "admin") {
      throw { response: { data: { message: "This account does not have admin access." } } };
    }
    localStorage.setItem("adminToken", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("adminToken");
    setUser(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
