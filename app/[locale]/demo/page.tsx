import { DemoDashboard } from "@/components/demo-dashboard";
import { DemoPropertiesInventory } from "@/components/demo-properties";
import { DemoViewNav, type DemoView } from "@/components/demo-view-nav";
import { normaliseLocale } from "@/src/i18n/get-dictionary";

function resolveDemoView(view: string | string[] | undefined): DemoView {
  const value = Array.isArray(view) ? view[0] : view;
  return value === "listings" ? "listings" : "workflow";
}

export default async function DemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const { locale: localeParam } = await params;
  const locale = normaliseLocale(localeParam);
  const { view } = await searchParams;
  const activeView = resolveDemoView(view);

  return (
    <div className="space-y-4">
      <DemoViewNav locale={locale} activeView={activeView} />
      {activeView === "listings" ? (
        <DemoPropertiesInventory locale={locale} />
      ) : (
        <DemoDashboard locale={locale} />
      )}
    </div>
  );
}
