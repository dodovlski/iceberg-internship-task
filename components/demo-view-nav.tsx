import Link from "next/link";
import { getDictionary } from "@/src/i18n/get-dictionary";
import type { Locale } from "@/src/types";
import { cn } from "@/src/utils/cn";

export type DemoView = "workflow" | "listings";

export function DemoViewNav({ locale, activeView }: { locale: Locale; activeView: DemoView }) {
  const dictionary = getDictionary(locale);
  const tabs: { id: DemoView; href: string; label: string }[] = [
    { id: "workflow", href: `/${locale}/demo`, label: dictionary.demoWorkflow },
    { id: "listings", href: `/${locale}/demo?view=listings`, label: dictionary.properties },
  ];

  return (
    <nav
      className="surface-card-product flex flex-wrap gap-1 p-1.5"
      aria-label={locale === "tr" ? "Demo görünümleri" : "Demo views"}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeView;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "rounded-full px-4 py-2 font-heading text-sm font-bold transition-all duration-200",
              active
                ? "border-2 border-ink bg-primary text-primary-foreground shadow-[2px_2px_0_0_#000000]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
