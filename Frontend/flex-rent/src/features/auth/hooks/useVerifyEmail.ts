"use client";

import { useState } from "react";
import api from "@/core/api";

export function useVerifyEmail() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [verified, setVerified] = useState(false);

  const verify = async (token: string) => {
    setPending(true);
    setError(null);
    try {
      await api.post("/auth/verify-email", { token });
      setVerified(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  return { verify, error, pending, verified };
}
