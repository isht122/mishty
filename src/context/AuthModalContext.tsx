"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AuthModal } from "@/components/AuthModal";

type AuthMode = "login" | "signup";

interface AuthModalContextValue {
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  successMessage: string | null;
  clearSuccessMessage: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(
  undefined
);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openAuth = (mode: AuthMode = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const closeAuth = () => setAuthOpen(false);

  const clearSuccessMessage = () => setSuccessMessage(null);

  return (
    <AuthModalContext.Provider
      value={{ openAuth, closeAuth, successMessage, clearSuccessMessage }}
    >
      {children}
      <AuthModal
        isOpen={authOpen}
        onClose={closeAuth}
        onSuccess={(message) => {
          setSuccessMessage(message);
          setAuthOpen(false);
        }}
        initialMode={authMode}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return ctx;
}