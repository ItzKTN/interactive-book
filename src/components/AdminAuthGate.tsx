"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Lock, LogOut, ShieldCheck } from "lucide-react";

const AUTH_STORAGE_KEY = "fotinov_admin_authenticated_v1";

interface AdminAuthGateProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function AdminAuthGate({
  children,
  pageTitle = "Административен достъп",
}: AdminAuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved =
        sessionStorage.getItem(AUTH_STORAGE_KEY) ||
        localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved === "true") {
        setIsAuthenticated(true);
      }
    } catch {
      // ignore storage errors
    } finally {
      setChecking(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validUsers = ["ItzKTN", "tqncho"];
    const validPasswords = ["Q@a201020", "23323223a"];

    const normalizedInputUser = username.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const isMatchedPair = validUsers.some(
      (u, idx) =>
        u.trim().toLowerCase() === normalizedInputUser &&
        validPasswords[idx] === trimmedPassword
    );

    const isAnyValidCombination =
      validUsers.some((u) => u.trim().toLowerCase() === normalizedInputUser) &&
      validPasswords.includes(trimmedPassword);

    if (isMatchedPair || isAnyValidCombination) {
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
        localStorage.setItem(AUTH_STORAGE_KEY, "true");
      } catch {
        // ignore
      }
      setIsAuthenticated(true);
    } else {
      setError("Невалидно потребителско име или парола.");
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  if (checking) {
    return (
      <div className="antique-desk-bg flex min-h-screen items-center justify-center font-serif text-[#f3e5c8]">
        <p className="text-lg italic">❦ Отваряне на възрожденския архив... ❦</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="antique-desk-bg flex min-h-screen flex-col items-center justify-center px-4 py-12 font-serif text-[#26170a]">
        <div className="vintage-parchment relative w-full max-w-md border-4 border-double border-[#5a3518] p-8">
          <div className="pointer-events-none absolute inset-2 border border-[#8c6239]/55" />

          <div className="relative mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#c89d54] bg-gradient-to-br from-[#7c1d12] to-[#4a0e07] text-[#f7efde] shadow-lg">
              <Lock className="h-6 w-6 text-[#ebd29c]" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#6e1a12]">
              ─── ❦ Възрожденски Архив ❦ ───
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#241307] sm:text-3xl">
              {pageTitle}
            </h1>
            <p className="mt-2 text-sm italic text-[#523015]">
              Летописът е в режим само за четене. Въведете ключ за достъп до{" "}
              <code>/edit</code> и <code>/data</code>.
            </p>
          </div>

          <form onSubmit={handleLogin} className="relative space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a2611]">
                Потребителско име
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="mt-1 w-full border-2 border-[#7a5230] bg-[#fbf5e6] px-3.5 py-2 text-base text-[#26170a] focus:border-[#6e1a12] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a2611]">
                Парола (Ключ)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="mt-1 w-full border-2 border-[#7a5230] bg-[#fbf5e6] px-3.5 py-2 text-base text-[#26170a] focus:border-[#6e1a12] focus:outline-none"
              />
            </div>

            {error && (
              <div className="border border-[#7c1d12] bg-[#7c1d12]/10 p-3 text-xs font-bold text-[#6e1a12]">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 border-2 border-[#4a180d] bg-gradient-to-b from-[#6e1a12] to-[#4e110b] py-2.5 text-sm font-bold uppercase tracking-widest text-[#f7efde] shadow transition hover:from-[#5a150e] hover:to-[#3b0c07]"
            >
              <KeyRound className="h-4 w-4 text-[#ebd29c]" />
              <span>Отключи архива</span>
            </button>
          </form>

          <div className="relative mt-6 border-t border-[#8c6239] pt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6e1a12] underline hover:text-[#241307]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Обратно към летописа (Само за четене)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between border-b border-[#8c6239]/60 bg-[#231308] px-4 py-1.5 font-serif text-xs text-[#f5ead4]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#c89d54]" />
          <span>
            ❦ Режим на редактор активен (Стоян Калчев & Константин Караниколов)
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1 border border-[#8c6239] bg-[#382010] px-2.5 py-0.5 text-[11px] text-[#f5ead4] hover:bg-[#5a3216]"
        >
          <LogOut className="h-3 w-3" />
          <span>Заключи (Изход)</span>
        </button>
      </div>
      {children}
    </div>
  );
}
