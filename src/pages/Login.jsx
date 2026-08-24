import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { createAccount, resetPassword, signIn } from "../firebase/authService";

export function Login() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await (isCreating
        ? createAccount(email, password, username, contact)
        : signIn(email, password));
      nav("/dashboard");
    } catch (err) {
      console.error("Authentication failed", {
        code: err?.code,
        message: err?.message,
        error: err,
      });
      const messages = {
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/email-already-in-use":
          "An account already exists with this email.",
        "auth/weak-password": "Use a password with at least 6 characters.",
        "auth/operation-not-allowed":
          "Enable Email/Password sign-in in Firebase Console → Authentication → Sign-in method.",
        "auth/configuration-not-found":
          "Firebase Authentication is not configured for this project.",
        "auth/invalid-api-key":
          "The Firebase API key is invalid. Check the Vercel environment variables.",
        "auth/network-request-failed":
          "Network error. Check your internet connection and try again.",
        "auth/too-many-requests":
          "Too many attempts. Wait a moment and try again.",
      };
      setError(
        messages[err?.code] ||
          `Authentication failed${err?.code ? ` (${err.code})` : ""}. ${
            err?.message || "Check the browser console for details."
          }`,
      );
    } finally {
      setSubmitting(false);
    }
  };
  const forgotPassword = async () => {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await resetPassword(email);
      setError("Password reset email sent. Check your inbox.");
    } catch (err) {
      const messages = {
        "auth/invalid-email": "Enter a valid email address.",
        "auth/user-not-found": "No account was found with this email.",
        "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
      };
      console.error("Unable to reset password", err);
      setError(messages[err?.code] || "Unable to send the reset email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="login">
      <div className="login-brand">
        <span className="brand-mark">E</span>ENTROPIC
      </div>
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">CLIENT DASHBOARD</p>
        <h1>{isCreating ? "Create your account." : "Welcome back."}</h1>
        <p>
          {isCreating
            ? "Set up your secure dashboard account."
            : "Sign in to access your client work and deliverables."}
        </p>
        {isCreating && (
          <label>
            Full name
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="name"
              required
            />
          </label>
        )}
        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        {isCreating && (
          <label>
            Contact number
            <input
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              autoComplete="tel"
              placeholder="e.g. 021 123 4567"
            />
          </label>
        )}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isCreating ? "new-password" : "current-password"}
            minLength="6"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button full" disabled={submitting}>
          {submitting
            ? "Please wait…"
            : isCreating
            ? "Create account"
            : "Sign in"}
        </button>
        {!isCreating && (
          <button type="button" className="auth-switch" onClick={forgotPassword} disabled={submitting}>
            Forgot password?
          </button>
        )}
        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setIsCreating(!isCreating);
            setError("");
          }}
        >
          {isCreating
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </form>
    </div>
  );
}
