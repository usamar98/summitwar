"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, hasPublicSupabaseEnv } from "@/lib/supabase/client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!hasPublicSupabaseEnv()) {
      setError("Supabase Auth is not configured in this environment.");
      return;
    }
    setPending(true);
    setError(null);
    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", nextPath);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString(), shouldCreateUser: true },
    });
    setPending(false);
    if (authError) setError(authError.message);
    else setSent(true);
  }
  if (sent)
    return (
      <Alert className="border-accent/25 bg-accent/5">
        <Mail className="text-accent" />
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription>
          The passwordless link returns to {nextPath}. It expires automatically.
        </AlertDescription>
      </Alert>
    );
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="login-email">Email used at checkout</Label>
        <Input
          id="login-email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          required
          placeholder="founder@startup.com"
          autoComplete="email"
        />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Sign-in unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 w-full"
      >
        {pending ? <Loader2 className="animate-spin" /> : <Mail />}
        {pending ? "Sending link…" : "Email me a management link"}
      </Button>
    </form>
  );
}
