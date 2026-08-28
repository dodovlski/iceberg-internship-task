import Link from "next/link";
import { ArrowRight, ClipboardCheck, Database, Inbox, ShieldCheck } from "lucide-react";
import { ConfettiDots, SquiggleUnderline } from "@/components/section-decorations";
import { buttonVariants, IconCircle, Panel } from "@/components/ui";
import { getDictionary, normaliseLocale } from "@/src/i18n/get-dictionary";
import { cn } from "@/src/utils/cn";

const preview = {
  en: [
    ["Sarah Mitchell", "Viewing request and parking question", "Missing parking details detected"],
    ["James Roberts", "Seller valuation request", "Follow-up call recommended"],
    ["Priya Kapoor", "Bristol rental search", "Under-offer risk flagged"],
  ],
  tr: [
    ["Selin Aksoy", "Evi görme talebi ve otopark sorusu", "Eksik otopark bilgisi tespit edildi"],
    ["Mert Yılmaz", "Satıcı değerleme talebi", "Takip görüşmesi önerildi"],
    ["Derya Kaplan", "Bristol kiralık arayışı", "Teklif süreci riski işaretlendi"],
  ],
};

const features = {
  en: [
    ["Understand messages", "Extract intent, urgency and property references from messy inbound leads."],
    ["Check listings", "Compare customer questions against known property fields and stale availability."],
    ["Prepare actions", "Draft reply, CRM note, follow-up task and listing update in one card."],
    ["Human approval", "Keep the agent in control when confidence is low or data is missing."],
  ],
  tr: [
    ["Mesajları anla", "Dağınık müşteri taleplerinden niyet, aciliyet ve ilgili ilan bilgisini çıkar."],
    ["İlanları kontrol et", "Müşteri sorularını bilinen ilan alanları ve güncellik riskleriyle karşılaştır."],
    ["Aksiyon hazırla", "Cevap taslağı, müşteri kayıt notu, takip görevi ve ilan aksiyonunu tek kartta hazırla."],
    ["İnsan onayı", "Güven düşükse veya veri eksikse danışmanı kararın merkezinde tut."],
  ],
};

const featureColors = ["primary", "secondary", "tertiary", "quaternary"] as const;

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = normaliseLocale(localeParam);
  const dictionary = getDictionary(locale);
  const icons = [Inbox, Database, ClipboardCheck, ShieldCheck];

  return (
    <div className="space-y-16 md:space-y-24">
      <section className="surface-card-playful relative grid gap-10 overflow-hidden px-5 py-12 md:grid-cols-2 md:items-center md:px-10 lg:py-20">
        <ConfettiDots />
        <div className="hero-blob" aria-hidden />
        <div className="relative motion-safe:animate-pop-in">
          <p className="eyebrow mb-4">{dictionary.tagline}</p>
          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] text-foreground md:text-5xl lg:text-6xl">
            {dictionary.productName}
          </h1>
          <SquiggleUnderline className="mt-3 text-secondary" />
          <p className="mt-6 font-body text-base leading-7 text-muted-foreground md:text-lg">
            {locale === "en"
              ? "Turn every estate agency message into a verified next-best-action."
              : "Her emlak mesajını doğrulanmış bir sonraki aksiyona dönüştür."}
          </p>
          <p className="mt-3 font-body text-sm leading-6 text-muted-foreground">
            {locale === "en"
              ? "An AI inbox, listing check and daily briefing assistant for UK estate agents."
              : "Birleşik Krallık emlak danışmanları için gelen kutusu, ilan kontrolü ve günlük özet asistanı."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/${locale}/demo`}
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "group")}
              style={{ transitionTimingFunction: "var(--motion-bounce)" }}
            >
              {dictionary.openDemo}
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/20 bg-white/95 text-primary">
                <ArrowRight size={16} strokeWidth={2.5} className="motion-safe:group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link
              href={`/${locale}/approach`}
              className={buttonVariants({ variant: "secondary", size: "lg" })}
              style={{ transitionTimingFunction: "var(--motion-bounce)" }}
            >
              {dictionary.readApproach}
            </Link>
          </div>
        </div>
        <Panel variant="terminal" title={locale === "tr" ? "Canlı kuyruk" : "live queue"} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-30" aria-hidden />
          <div className="relative divide-y-2 divide-border">
            {preview[locale].map(([lead, subject, status], index) => (
              <div key={lead} className="p-5 transition-colors hover:bg-muted/50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mono-detail">#{index + 1}</div>
                    <div className="card-title-glow mt-2 text-lg">{lead}</div>
                    <div className="mt-1 font-body text-sm text-muted-foreground">{subject}</div>
                  </div>
                  <IconCircle color="tertiary" size="sm">
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </IconCircle>
                </div>
                <div className="mt-3 accent-bar text-sm">{status}</div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-bold md:text-3xl">
          {locale === "en" ? "How it works" : "Nasıl çalışır"}
        </h2>
        <p className="mt-2 max-w-xl font-body text-muted-foreground">
          {locale === "en"
            ? "Four steps from messy inbox to approved action."
            : "Dağınık gelen kutusundan onaylı aksiyona dört adım."}
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features[locale].map(([title, text], index) => {
            const Icon = icons[index];
            const color = featureColors[index];
            return (
              <Feature
                key={title}
                icon={<Icon size={20} strokeWidth={2.5} />}
                title={title}
                text={text}
                index={index + 1}
                color={color}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
  index,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  index: number;
  color: (typeof featureColors)[number];
}) {
  const headerTint = {
    primary: "bg-primary/15",
    secondary: "bg-secondary/20",
    tertiary: "bg-tertiary/25",
    quaternary: "bg-quaternary/20",
  }[color];

  return (
    <article className="surface-card-playful group relative p-6 md:min-h-56">
      <div className={cn("-mx-6 -mt-6 mb-6 border-b-2 border-border px-6 py-4", headerTint)}>
        <div className="flex items-center justify-between">
          <IconCircle color={color} size="md" className="allow-tilt -mt-10 shadow-pop motion-safe:group-hover:animate-wiggle">
            {icon}
          </IconCircle>
          <div className="mono-detail font-bold">{String(index).padStart(2, "0")}</div>
        </div>
      </div>
      <h3 className="card-title-glow">{title}</h3>
      <p className="mt-3 font-body text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}
