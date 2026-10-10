"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "../api/api";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [token, setToken] =
    useState(() =>
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null
    );

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }

    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const restoreUser =
      async () => {
        if (!token) {
          setLoading(false);
          return;
        }

        try {
          const response =
            await apiRequest(
              "/auth/me",
              {},
              token
            );

          setUser(
            response.data
          );
        } catch (error) {
          if (
            error.status === 401 ||
            error.code ===
              "INVALID_TOKEN"
          ) {
            logout();
          }
        } finally {
          setLoading(false);
        }
      };

    restoreUser();
  }, [token]);

  const login = async (
    email,
    password
  ) => {
    const response =
      await apiRequest(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

    const newToken =
      response.data.token;

    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", newToken);
    }

    setToken(newToken);
    setUser(
      response.data.user
    );

    return response;
  };

  const loginWithGoogle = async (credential) => {
    const response = await apiRequest(
      "/auth/google",
      {
        method: "POST",
        body: JSON.stringify({ credential }),
      }
    );

    const newToken = response.data.token;

    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", newToken);
    }

    setToken(newToken);
    setUser(response.data.user);

    return response;
  };

  const register = async (
    name,
    email,
    password
  ) => {
    const response =
      await apiRequest(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

    const newToken =
      response.data.token;

    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", newToken);
    }

    setToken(newToken);
    setUser(
      response.data.user
    );

    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext
  );
}