"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { User } from "@/types";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user state on mount and auth changes
  useEffect(() => {
    const checkAdminRole = async (email: string): Promise<boolean> => {
      if (!email) return false;
      try {
        const { data, error } = await supabase
          .from("admins")
          .select("email")
          .ilike("email", email.trim())
          .maybeSingle();

        if (error) {
          console.warn("Error querying admins table:", error.message);
          return false;
        }
        return !!data;
      } catch (err) {
        console.error("Exception checking admin status:", err);
        return false;
      }
    };

    const syncUser = async (session: any) => {
      if (session?.user) {
        const email = session.user.email || "";
        const isAdmin = await checkAdminRole(email);
        setUser({
          name: session.user.user_metadata?.name || email.split("@")[0] || "User",
          email,
          role: isAdmin ? "admin" : "user",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email.trim()) return { success: false, error: "Email is required" };
    if (!password) return { success: false, error: "Password is required" };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string, confirmPassword: string) => {
      if (!name.trim()) return { success: false, error: "Name is required" };
      if (!email.trim()) return { success: false, error: "Email is required" };
      if (!password) return { success: false, error: "Password is required" };
      if (password !== confirmPassword)
        return { success: false, error: "Passwords do not match" };
      if (password.length < 6)
        return { success: false, error: "Password must be at least 6 characters" };

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      loading,
    }),
    [user, login, signup, logout, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
