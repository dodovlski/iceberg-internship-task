"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Languages } from "lucide-react";
import type { Locale } from "@/src/types";
import { getDictionary } from "@/src/i18n/get-dictionary";
import { cn } from "@/src/utils/cn";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const dictionary = getDictionary(locale);

  function hrefFor(target: Locale) {
    const parts = pathname.split("/");
    if (parts[1] === "en" || parts[1] === "tr") {
      parts[1] = target;
      return parts.join("/") || `/${target}`;
    }
    return `/${target}`;
  }

  return (
    <div className="relative">
      <button
        className="inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-card px-4 font-body text-sm font-semibold text-foreground shadow-[2px_2px_0_0_#E0E0E8] transition-all duration-300 hover:bg-tertiary/40"
        onClick={() => setOpen((value) => !value)}
        type="button"
        aria-expanded={open}
        aria-label={dictionary.language}
      >
        <Languages strokeWidth={2.5} size={16} />
        <span className="hidden sm:inline">{locale === "tr" ? "TR" : "EN"}</span>
      </button>
      {open ? (
        <div className="absolute right-0 top-14 z-40 w-44 rounded-xl border-2 border-ink bg-card p-1.5 shadow-hard">
          <Link
            className="flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 font-body text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            href={hrefFor("en")}
            onClick={() => setOpen(false)}
          >
            <span aria-hidden className="font-bold text-foreground">
              EN
            </span>
            <span>{dictionary.english}</span>
          </Link>
          <Link
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 font-body text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            )}
            href={hrefFor("tr")}
            onClick={() => setOpen(false)}
          >
            <span aria-hidden className="font-bold text-foreground">
              TR
            </span>
            <span>{dictionary.turkish}</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
