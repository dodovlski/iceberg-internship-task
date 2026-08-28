import { AppShell } from "@/components/app-shell";
import { normaliseLocale } from "@/src/i18n/get-dictionary";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "tr" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AppShell locale={normaliseLocale(locale)}>{children}</AppShell>;
}
