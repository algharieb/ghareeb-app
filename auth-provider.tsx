import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/storage";
import { User } from "@/lib/types";
import { LoaderPinwheel } from "lucide-react";

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  register: (userData: Omit<User, "id" | "createdAt" | "lastSeen">) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authUtils = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Initialize auth state
    const checkAuth = async () => {
      try {
        // This will set the auth state based on localStorage
        setIsLoading(false);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (!isLoading) {
      const path = window.location.pathname;
      
      if (!authUtils.isAuthenticated && path !== "/" && path !== "/signup") {
        setLocation("/");
      } else if (authUtils.isAuthenticated) {
        if (path === "/" || path === "/signup") {
          // Redirect to appropriate dashboard based on role
          if (authUtils.user?.role === "admin") {
            setLocation("/admin");
          } else {
            setLocation("/chat");
          }
        }
      }
    }
  }, [isLoading, authUtils.isAuthenticated, authUtils.user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-background">
        <div className="text-center">
          <LoaderPinwheel className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-foreground">جاري تحميل التطبيق...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        ...authUtils,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
