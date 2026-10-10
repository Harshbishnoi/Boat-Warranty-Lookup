"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/context/AuthContext";

export default function AuthProviderWrapper({ children }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const googleIsConfigured =
    clientId && !clientId.startsWith("your-");

  const content = <AuthProvider>{children}</AuthProvider>;

  return googleIsConfigured ? (
    <GoogleOAuthProvider clientId={clientId}>
      {content}
    </GoogleOAuthProvider>
  ) : (
    content
  );
}