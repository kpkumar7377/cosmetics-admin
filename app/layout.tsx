import { AuthProvider } from "../lib/authContext";
import ShellInner from "../components/ShellInner";
import "./globals.css";

export const metadata = {
  title: "Cosmetics Store — Admin",
};

export default function AdminLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-ivory">
      <body className="min-h-full font-sans text-ink antialiased bg-ivory selection:bg-gold/20 selection:text-brand">
        <AuthProvider>
          <div className="flex flex-col md:flex-row min-h-screen w-full">
            <ShellInner>{children}</ShellInner>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
