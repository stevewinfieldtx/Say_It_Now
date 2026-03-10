"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null | "loading">("loading");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes (magic link click)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError("Something went wrong. Please try again.");
      setSending(false);
    } else {
      setSent(true);
      setSending(false);
    }
  };

  // Still checking session
  if (session === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  // Authenticated — show the app
  if (session) {
    return <>{children}</>;
  }

  // Not authenticated — show email gate
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-5">
      {/* Logo / branding */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          How Do I Say 🌏
        </h1>
        <p className="text-gray-500 text-sm max-w-xs">
          Speak any phrase in 16 languages. No reading required.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-7">
        {!sent ? (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Get started free</h2>
            <p className="text-sm text-gray-500 mb-5">
              Enter your email and we&apos;ll send you a magic link — no password needed.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={!email.trim() || sending}
                className="w-full py-3 bg-slate-900 hover:bg-slate-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-sm transition"
              >
                {sending ? "Sending..." : "Send magic link →"}
              </button>
            </form>

            <p className="text-xs text-gray-400 mt-4 text-center">
              Free forever for all 100 phrases · No credit card
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Check your inbox</h2>
            <p className="text-sm text-gray-500 mb-4">
              We sent a magic link to <span className="font-semibold text-gray-700">{email}</span>
            </p>
            <p className="text-xs text-gray-400">
              Click the link in the email to sign in. You can close this tab.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-5 text-xs text-blue-500 hover:underline"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center max-w-xs">
        By continuing, you agree to receive occasional product updates. No spam.
      </p>
    </div>
  );
}
