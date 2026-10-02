"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { login } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await login({ email: String(data.get("email")), password: String(data.get("password")) });
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next?.startsWith("/") ? next : "/"); router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Sign in failed.");
    } finally { setBusy(false); }
  }

  return <main className="authPage">
    <Link className="authBrand" href="/"><span className="brandMark">遊</span><strong>YT Anime Library</strong></Link>
    <section className="authCard">
      <span className="eyebrow">Welcome back</span><h1>Continue your story.</h1>
      <p>Sign in to access your private profile while the personal library experience is being built.</p>
      <form onSubmit={submit} className="authForm">
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" minLength={12} required /></label>
        {error && <p className="status error" role="alert">{error}</p>}
        <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="authSwitch">New here? <Link href="/register">Create an account</Link></p>
    </section>
  </main>;
}
