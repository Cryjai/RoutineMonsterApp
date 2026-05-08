import { PhoneShell } from "@/components/PhoneShell";
import { useMutation } from "@tanstack/react-query";
import { apiJson, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const loginMut = useMutation({
    mutationFn: (e: string) => apiJson("POST", "/api/login", { email: e }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-state"] });
      toast({ title: "Welcome 🎉", description: "Signed in." });
      navigate("/profiles");
    },
  });

  return (
    <PhoneShell hideNav>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-4 hover-elevate active-elevate rounded-full px-2 py-1 -ml-2"
        data-testid="link-back-login"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </Link>

      <div className="text-center mt-2">
        <div className="text-5xl mb-2 float" aria-hidden>👾</div>
        <h1 className="font-display text-3xl font-bold tracking-tight leading-tight">
          Welcome <span className="shimmer-text">back</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-[34ch] mx-auto">
          Sign in to sync routines & stars across devices. Prototype 用 demo login，唔會儲真 password。
        </p>
      </div>

      <div className="mt-6 space-y-2">
        <button
          onClick={() => {
            const e = "you@gmail.com";
            setEmail(e);
            loginMut.mutate(e);
          }}
          className="w-full rounded-full border border-card-border bg-card px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover-elevate active-elevate-2"
          data-testid="button-google-login"
        >
          <GoogleIcon /> Continue with Google
        </button>
        <button
          onClick={() => {
            const e = "demo@apple.com";
            setEmail(e);
            loginMut.mutate(e);
          }}
          className="w-full rounded-full border border-card-border bg-card px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover-elevate active-elevate-2"
          data-testid="button-apple-login"
        >
          <span className="text-xl leading-none"></span> Continue with Apple
        </button>
      </div>

      <div className="my-5 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>or email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email) loginMut.mutate(email);
        }}
        className="soft-card p-4 space-y-3"
      >
        <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">Email</label>
        <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 bg-transparent text-sm outline-none"
            data-testid="input-email"
          />
        </div>
        <button
          type="submit"
          disabled={!email || loginMut.isPending}
          className="w-full rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-bold hover-elevate active-elevate-2 disabled:opacity-50"
          data-testid="button-email-login"
        >
          Sign in
        </button>
      </form>

      <p className="mt-4 text-[11px] text-center text-muted-foreground">
        By continuing you agree to our cute Terms & Privacy 條文。
      </p>
    </PhoneShell>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c3 0 5.7 1.1 7.8 3l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.3 4.5 9.7 9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-4.9c-1.9 1.4-4.4 2.4-6.9 2.4-5.4 0-9.7-3.5-11.3-7.5l-6.5 5C9.7 39 16.3 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.4-4.4 5.6l6 4.9C40.9 35.6 43.5 30.2 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
