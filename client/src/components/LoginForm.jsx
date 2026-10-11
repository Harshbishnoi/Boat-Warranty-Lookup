"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const googleIsConfigured =
  googleClientId && !googleClientId.startsWith("your-");

export default function LoginForm() {
  const router = useRouter();
  const auth = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleGoogleSuccess = async ({ credential }) => {
    setError("");

    if (!credential || !auth?.loginWithGoogle) {
      setError("Google sign-in is unavailable. Please try again.");
      return;
    }

    setLoading(true);
    try {
      await auth.loginWithGoogle(credential);
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in with Google. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const email = formData.email.trim();
    const password = formData.password;

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      if (auth?.login) {
        await auth.login(email, password);
      } else {
        throw new Error(
          "Authentication service is unavailable."
        );
      }

      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="professional-login-form"
      onSubmit={handleSubmit}
    >
      {/* LOGIN METHOD */}
      <div className="login-method-tabs">
        <button
          type="button"
          className="login-method active"
        >
          <span>✉</span>
          Email Login
        </button>

        <button
          type="button"
          className="login-method"
          onClick={() => {
            setError(
              "OTP login will be available soon."
            );
          }}
        >
          <span>▣</span>
          Use OTP
        </button>
      </div>

      {/* EMAIL */}
      <div className="login-field">
        <label htmlFor="email">
          Email
        </label>

        <div className="login-input-wrapper">
          <span className="login-input-icon">
            ◯
          </span>

          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="username"
          />
        </div>
      </div>

      {/* PASSWORD */}
      <div className="login-field">
        <label htmlFor="password">
          Password
        </label>

        <div className="login-input-wrapper">
          <span className="login-input-icon">
            ♙
          </span>

          <input
            id="password"
            name="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            autoComplete="current-password"
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() =>
              setShowPassword(
                (prev) => !prev
              )
            }
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword ? "◉" : "◌"}
          </button>
        </div>
      </div>

      {/* OPTIONS */}
      <div className="login-options">
        <label className="remember-option">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) =>
              setRememberMe(
                e.target.checked
              )
            }
          />

          <span className="custom-checkbox">
            {rememberMe ? "✓" : ""}
          </span>

          <span>Remember me</span>
        </label>

        <Link
          href="/login"
          className="forgot-password"
          onClick={(e) => {
            e.preventDefault();
            setError(
              "Password recovery will be available soon."
            );
          }}
        >
          Forgot Password?
        </Link>
      </div>

      {/* ERROR */}
      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      {/* SIGN IN */}
      <button
        type="submit"
        className="login-submit"
        disabled={loading}
      >
        {loading
          ? "Signing In..."
          : "Sign In"}

        {!loading && (
          <span>→</span>
        )}
      </button>

      {/* DIVIDER */}
      <div className="login-divider">
        <span></span>
        <strong>OR</strong>
        <span></span>
      </div>

      {/* GOOGLE */}
      {googleIsConfigured ? (
        <div className="google-login">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() =>
              setError("Google sign-in was cancelled or failed.")
            }
            text="signin_with"
            theme="outline"
            shape="rectangular"
            size="large"
            width={320}
          />
        </div>
      ) : (
        <p className="google-login-not-configured">
          Google sign-in is not configured. Set
          {" "}NEXT_PUBLIC_GOOGLE_CLIENT_ID in client/.env.local.
        </p>
      )}

      {/* SIGN UP */}
      <p className="login-signup">
        Don't have an account?

        <Link href="/signup">
          Create Account
        </Link>
      </p>
    </form>
  );
}