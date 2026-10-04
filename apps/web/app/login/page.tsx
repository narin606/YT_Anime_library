"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { login } from "../../lib/auth";
import { registerPath, safeNextPath } from "../../lib/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/");
  const [signInRequired, setSignInRequired] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setNext(safeNextPath(search.get("next")));
    setSignInRequired(search.get("reason") === "signin_required");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await login({ email: String(data.get("email")), password: String(data.get("password")) });
      router.push(next); router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Sign in failed.");
    } finally { setBusy(false); }
  }

  return <main className="authPage">
    <Link className="authBrand" href="/"><span className="brandMark">遊</span><strong>YT Anime Library</strong></Link>
    <section className="authCard">
      <span className="eyebrow">Welcome back</span><h1>Continue your story.</h1>
      <p>{signInRequired ? "Sign in or create an account before opening this anime." : "Sign in to access your private profile and library."}</p>
      <form onSubmit={submit} className="authForm">
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" minLength={12} required /></label>
        {error && <p className="status error" role="alert">{error}</p>}
        <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="authSwitch"><Link href="/forgot-password">Forgot password?</Link></p><p className="authSwitch">New here? <Link href={registerPath(next)}>Create an account</Link></p>
    </section>
  </main>;
}
