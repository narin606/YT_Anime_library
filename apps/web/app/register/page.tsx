"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { register } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await register({ name: String(data.get("name")), email: String(data.get("email")), password: String(data.get("password")) });
      router.push("/"); router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Registration failed.");
    } finally { setBusy(false); }
  }

  return <main className="authPage">
    <Link className="authBrand" href="/"><span className="brandMark">遊</span><strong>YT Anime Library</strong></Link>
    <section className="authCard">
      <span className="eyebrow">Create your profile</span><h1>Your anime profile starts here.</h1>
      <p>Create a private account for the catalogue today. Watchlists and viewing progress are coming later.</p>
      <form onSubmit={submit} className="authForm">
        <label>Profile name<input name="name" autoComplete="nickname" maxLength={32} required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="new-password" minLength={12} required /><small>Use at least 12 characters.</small></label>
        {error && <p className="status error" role="alert">{error}</p>}
        <button disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
      <p className="authSwitch">Already have an account? <Link href="/login">Sign in</Link></p>
    </section>
  </main>;
}
