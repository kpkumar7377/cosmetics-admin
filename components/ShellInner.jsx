"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { useAuth } from "../lib/authContext";

export default function ShellInner({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (pathname === "/login") {
    return <main className="flex-1">{children}</main>;
  }

  if (loading) {
    return <main className="flex-1 px-8 py-6 text-sm text-gray-500">Loading...</main>;
  }

  if (!user) return null; // AuthProvider is already redirecting to /login

  return (
    <>
      <Sidebar />
      <main className="flex-1 px-8 py-6">{children}</main>
    </>
  );
}
