"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const googleIsConfigured =
  googleClientId && !googleClientId.startsWith("your-");

export default function SignupForm() {
  const router = useRouter();
  const auth = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async ({ credential }) => {
    setError("");

    if (!credential || !auth?.loginWithGoogle) {
      setError("Google sign-up is unavailable. Please try again.");
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
          : "Unable to sign up with Google. Please try again."
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.email) {
      setError("Please enter your registered email address.");
      return;
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      if (auth?.register) {
        await auth.register(
          formData.name.trim(),
          formData.email.trim(),
          formData.password
        );
      } else {
        throw new Error("Registration service is unavailable.");
      }

      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="signup-form"
      onSubmit={handleSubmit}
    >

      {/* FULL NAME */}
      <div className="signup-field">

        <label htmlFor="name">
          Full Name
        </label>

        <div className="signup-input-wrapper">
          <span>♙</span>

          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
          />
        </div>

      </div>

      {/* MOBILE */}
      <div className="signup-field">

        <label htmlFor="mobile">
          Mobile Number
        </label>

        <div className="signup-input-wrapper">
          <span>☎</span>

          <input
            id="mobile"
            name="mobile"
            type="tel"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
          />
        </div>

      </div>

      {/* EMAIL */}
      <div className="signup-field">

        <label htmlFor="email">
          Registered Email
        </label>

        <div className="signup-input-wrapper">
          <span>✉</span>

          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
        </div>

        <small className="signup-field-hint">
          Enter either your mobile number or registered email.
        </small>

      </div>

      {/* PASSWORD */}
      <div className="signup-field">

        <label htmlFor="password">
          Password
        </label>

        <div className="signup-input-wrapper">
          <span>♙</span>

          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
          />
        </div>

        <small className="password-hint">
          ✓ At least 8 characters
          &nbsp; | &nbsp;
          ✓ 1 number
          &nbsp; | &nbsp;
          ✓ 1 special character
        </small>

      </div>

      {/* CONFIRM PASSWORD */}
      <div className="signup-field">

        <label htmlFor="confirmPassword">
          Confirm Password
        </label>

        <div className="signup-input-wrapper">
          <span>♙</span>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
          />
        </div>

      </div>

      {error && (
        <p className="signup-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="signup-submit"
        disabled={loading}
      >
        {loading ? "Creating Account..." : "Create Account →"}
      </button>

      <div className="login-divider">
        <span></span>
        <strong>OR</strong>
        <span></span>
      </div>

      {googleIsConfigured ? (
        <div className="google-login">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() =>
              setError("Google sign-up was cancelled or failed.")
            }
            text="signup_with"
            theme="outline"
            shape="rectangular"
            size="large"
            width={320}
          />
        </div>
      ) : (
        <p className="google-login-not-configured">
          Google sign-up is not configured. Set
          {" "}NEXT_PUBLIC_GOOGLE_CLIENT_ID in client/.env.local.
        </p>
      )}

    </form>
  );
}