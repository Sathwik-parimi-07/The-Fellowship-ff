import React, { useState } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { supabase } from "./lib/supabase";
import { grad, inputCls } from "./lib/helpers";
import { Card, Btn } from "./ui";

export default function Auth() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'err' | 'ok', text }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name.");
        const { data, error } = await supabase.auth.signUp({
          email, password: pw,
          options: { data: { name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) setMsg({ type: "ok", text: "Almost there — check your inbox to confirm your email, then sign in." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      }
    } catch (err) {
      setMsg({ type: "err", text: err.message || "Something went wrong." });
    }
    setBusy(false);
  };

  const forgot = async () => {
    if (!email) { setMsg({ type: "err", text: "Type your email above first, then tap Forgot password." }); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setMsg(error ? { type: "err", text: error.message } : { type: "ok", text: "Password reset link sent — check your inbox." });
    setBusy(false);
  };

  const tab = (m, label) => (
    <button type="button" onClick={() => { setMode(m); setMsg(null); }}
      className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${mode === m ? "text-white" : "text-violet-700 hover:bg-violet-50"}`}
      style={mode === m ? { background: grad.btn } : {}}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden" style={{ background: grad.hero }}>
      <div className="absolute rounded-full" style={{ width: 420, height: 420, top: -140, left: -140, background: "rgba(255,255,255,.1)", filter: "blur(3px)" }} />
      <div className="absolute rounded-full" style={{ width: 320, height: 320, bottom: -120, right: -80, background: "rgba(255,255,255,.08)" }} />
      <div className="relative w-full max-w-md fade-up">
        <div className="text-center text-white mb-7">
          <div className="mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ width: 62, height: 62, background: "rgba(255,255,255,.18)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.28)" }}>
            <BookOpen size={30} />
          </div>
          <h1 className="font-display font-semibold" style={{ fontSize: 46, lineHeight: 1 }}>Abide</h1>
          <p className="text-sm font-semibold mt-2.5" style={{ color: "#f0e6ff" }}>Daily QT · Songs · Prayer · One family</p>
        </div>

        <Card className="p-5">
          <div className="flex gap-1.5 bg-violet-50 rounded-2xl p-1.5 mb-4">
            {tab("signin", "Sign in")}
            {tab("signup", "Create account")}
          </div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} autoComplete="name" />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required className={inputCls} autoComplete="email" />
            <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password (6+ characters)" type="password" required minLength={6} className={inputCls}
              autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            {msg && (
              <p className={`text-sm font-semibold rounded-xl px-3.5 py-2.5 ${msg.type === "err" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                {msg.text}
              </p>
            )}
            <Btn type="submit" disabled={busy} className="w-full">
              {busy ? "One moment…" : mode === "signup" ? "Create my account" : "Sign in"} <ArrowRight size={15} />
            </Btn>
          </form>
          {mode === "signin" && (
            <button onClick={forgot} disabled={busy} className="mt-3 text-xs font-bold text-violet-500 hover:text-fuchsia-600 transition">
              Forgot password?
            </button>
          )}
          <p className="text-xs text-slate-400 mt-4">
            New accounts join as mentees. Your mentor's account is promoted to admin once (see the README).
          </p>
        </Card>
      </div>
    </div>
  );
}
