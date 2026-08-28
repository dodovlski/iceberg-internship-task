import { redirect } from "next/navigation";
import { normaliseLocale } from "@/src/i18n/get-dictionary";

export default async function PropertiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  redirect(`/${normaliseLocale(localeParam)}/demo?view=listings`);
}
