"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Edit3, Feather, FolderKanban, Lock } from "lucide-react";

interface NavbarProps {
  currentSlug?: string;
  bookTitle?: string;
  readOnlyPublic?: boolean;
}

export default function Navbar({
  currentSlug = "prologue",
  bookTitle = "Константин Фотинов (1790 – 1858)",
  readOnlyPublic = false,
}: NavbarProps) {
  const pathname = usePathname();

  const isData = pathname?.startsWith("/data");
  const isEdit = pathname === "/edit" || pathname?.endsWith("/edit");
  const isReader = !isData && !isEdit;

  const editHref = currentSlug ? `/${currentSlug}/edit` : "/edit";
  const readerHref = currentSlug ? `/${currentSlug}` : "/";

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#8c6239] bg-gradient-to-b from-[#2a170b] via-[#211208] to-[#190d05] font-serif text-[#f3e5c8] shadow-[0_4px_20px_rgba(0,0,0,0.65)]">
      <div className="mx-auto flex h-13 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6">
        <div className="min-w-0 flex-1">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#f3e5c8] transition hover:opacity-90 sm:gap-3"
          >
            {/* Wax Seal / Brass Emblem */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#c89d54] bg-gradient-to-br from-[#7c1d12] to-[#4a0e07] text-[#f7efde] shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:h-9 sm:w-9">
              <Feather className="h-3.5 w-3.5 text-[#ebd29c] sm:h-4 sm:w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-serif text-sm font-bold tracking-wider text-[#f5e6c8] sm:text-lg">
                  {bookTitle}
                </span>
                <span className="hidden text-xs text-[#c89d54] sm:inline">
                  ❦
                </span>
                <span className="hidden border border-[#8c6239]/80 bg-[#382010] px-2.5 py-0.5 text-[11px] font-semibold tracking-widest text-[#e2c792] lg:inline-block">
                  Стоян Калчев & Константин Караниколов от 10Г Клас
                </span>
              </div>
            </div>
          </Link>
        </div>

        {readOnlyPublic && isReader ? (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden text-xs italic tracking-wide text-[#c4a472] md:inline">
              ❦ Възрожденски архив • Лето 1844 ❦
            </span>
            <Link
              href={editHref}
              title="Вход за редактори (/edit и /data)"
              className="flex items-center gap-1 border border-[#8c6239] bg-[#331c0d] px-2.5 py-1 text-xs font-bold tracking-wider text-[#e8d2a6] shadow-inner transition hover:border-[#c89d54] hover:bg-[#5a3216] hover:text-white sm:gap-1.5 sm:px-3"
            >
              <Lock className="h-3 w-3 text-[#c89d54]" />
              <span>Вход</span>
            </Link>
          </div>
        ) : (
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href={readerHref}
              className={`flex items-center gap-1 border px-2 py-1 text-xs font-bold tracking-wider transition sm:gap-1.5 sm:px-3 sm:text-sm ${
                isReader
                  ? "border-[#c89d54] bg-[#6e1a12] text-[#f7efde]"
                  : "border-[#8c6239]/60 bg-[#2e190c] text-[#e2c792] hover:bg-[#472814]"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Четец</span>
            </Link>

            <Link
              href={editHref}
              className={`flex items-center gap-1 border px-2 py-1 text-xs font-bold tracking-wider transition sm:gap-1.5 sm:px-3 sm:text-sm ${
                isEdit
                  ? "border-[#c89d54] bg-[#6e1a12] text-[#f7efde]"
                  : "border-[#8c6239]/60 bg-[#2e190c] text-[#e2c792] hover:bg-[#472814]"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span className="sm:hidden">Редактор</span>
              <span className="hidden sm:inline">Редактор (/edit)</span>
            </Link>

            <Link
              href="/data"
              className={`flex items-center gap-1 border px-2 py-1 text-xs font-bold tracking-wider transition sm:gap-1.5 sm:px-3 sm:text-sm ${
                isData
                  ? "border-[#c89d54] bg-[#6e1a12] text-[#f7efde]"
                  : "border-[#8c6239]/60 bg-[#2e190c] text-[#e2c792] hover:bg-[#472814]"
              }`}
            >
              <FolderKanban className="h-3.5 w-3.5" />
              <span className="sm:hidden">Архив</span>
              <span className="hidden sm:inline">Архив снимки (/data)</span>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
