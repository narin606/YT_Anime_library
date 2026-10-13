"use client";

import { useState } from "react";
import { logout } from "../../../lib/auth";

// This navigation is rendered only after the detail page verifies the session.
export function DetailNavigation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out. Try again.");
      setBusy(false);
    }
  }

  return <nav aria-label="Main navigation">
    <a href="/">Catalogue</a>
    <a href="/#library">My library</a>
    <button className="signInLink navButton" type="button" disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Sign out"}</button>
    {error && <span className="status error" role="alert">{error}</span>}
  </nav>;
}
