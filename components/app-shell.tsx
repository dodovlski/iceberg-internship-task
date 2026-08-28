import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/src/types";
import { getDictionary } from "@/src/i18n/get-dictionary";
import { LanguageSwitcher } from "./language-switcher";
import { PaperBackground } from "./paper-background";

export function AppShell({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <div className="iceberg-surface relative min-h-screen bg-transparent text-foreground">
      <PaperBackground />
      <header className="sticky top-0 z-40 border-b-2 border-ink/10 bg-card/95 shadow-[0_2px_0_0_#E0E0E8] backdrop-blur-sm">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <Link
            href={`/${locale}`}
            className="group flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90"
          >
            <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-ink bg-ink shadow-[2px_2px_0_0_#000000]">
              <Image
                src="/brand/os.png"
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-cover"
                priority
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-heading text-base font-bold tracking-tight">
                {dictionary.productName}
              </span>
              <span className="hidden truncate font-body text-xs text-muted-foreground lg:block">
                {dictionary.tagline}
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {[
              [dictionary.nav.demo, `/${locale}/demo`],
              [dictionary.nav.approach, `/${locale}/approach`],
            ].map(([label, href]) => (
              <Link key={href} className="nav-link" href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher locale={locale} />
        </div>
      </header>
      <main className="relative z-10 w-full px-4 pb-20 pt-8 md:px-6 lg:px-8">{children}</main>
    </div>
  );
}
