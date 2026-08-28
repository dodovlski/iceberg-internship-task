import Image from "next/image";
import { Panel } from "@/components/ui";
import { getDictionary, normaliseLocale } from "@/src/i18n/get-dictionary";

const sections = {
  en: [
    [
      "Which problem are you solving?",
      "EstateOS targets the UK's £119m/yr estate-agency revenue leakage. Passive CRMs cannot structure chaotic inbound from Rightmove, Zoopla, web forms and branch email. EstateOS is an Agentic AI Workflow Layer that triages each message into qualified CRM actions, reducing the 5–10 missed business calls/branch/week and competing for the 80% of valuations won by the first credible responder.",
    ],
    [
      "How does the user use this feature?",
      "The agent works in a structured Data Triage Panel, not an open chat. They select an inbound message, review the AI Action Card (intent, lead score, matched listing, confidence, missing fields, Compliance Risk Flags, DMCC-safe reply draft, CRM note, follow-up, listing action) and approve, edit or reject. Human-in-the-loop approval is mandatory; nothing is customer-facing until signed off.",
    ],
    [
      "What data is needed?",
      "Inbound channels: Rightmove/Zoopla enquiries, web forms and branch inbox. CRM: listing status (Under Offer/SSTC), pricing, NTSELAT Part A/B/C material information (parking, flood risk, EPC, lease length, construction, mining area). Customer history: prior contact, qualification gaps and follow-up state. Sensitive AML/KYC identity data stays masked and isolated from model training.",
    ],
    [
      "How would you approach it technically?",
      "Stack: Next.js App Router, TypeScript, server-side API routes (keys off-client). Pipeline: (1) NLP intent triage with urgency scoring (Viewing Inquiry, Valuation Request, Missing Info, etc.); (2) RAG, drafts only from verified CRM facts to minimise hallucination; (3) Legal Guardian verification cross-checking Part B/C against CRM; (4) DMCC 2024 pricing engine formatting totals as \"(Rent + Deposit + Mandatory Fees incl. VAT)\" to block drip pricing. Gemini structured JSON + deterministic fallbacks for demo mode.",
    ],
    [
      "How does the legal compliance layer work?",
      "Every outbound AI action passes Legal Guardian before send. It enforces DMCC 2024 unfair-practice rules, material information, misleading omissions and auditability. The verification layer instantiates Compliance Risk Flags when Part B/C fields (EPC, parking, flood, etc.) are missing or stale. The pricing engine aggregates mandatory fees so non-compliant offers are technically blocked. Output: PASS / WARN / FAIL with field-level evidence.",
    ],
    [
      "Why event-driven instead of weekly compliance?",
      "Compliance fires on operational events, not calendar reviews: message received, action card generated, reply approved, customer send, listing update, portal sync, CRM note saved, follow-up created, valuation opportunity detected, end-of-day recap. Each event logs rule version, listing snapshot, AI output, human approval and final wording for audit.",
    ],
    [
      "Which AI features are included?",
      "Intent extraction, lead scoring, customer-type classification, property matching, Part A/B/C gap detection, stale availability checks, DMCC-safe reply drafting, CRM notes, follow-up tasks, alternative listings, Valuation Opportunity signals, 48h+ unanswered-email flags (Severe Risk of Losing Instruction), AI inbox prioritisation, customer simulation, context upload, morning brief and end-of-day recap, all wrapped by Legal Guardian.",
    ],
    [
      "What are the biggest risks or edge cases?",
      "Hallucination (e.g. inventing garden-permit facts), mitigated by RAG + human approval. Open-ended chat requests are mitigated by locking UI to the triage panel, not free-text bubbles. GDPR/AML data bleed, mitigated by masking and isolating sensitive KYC from the AI layer. Adoption resistance, mitigated by embedding as an invisible layer on existing inbox/CRM, not a separate portal. Plus: wrong property match, stale Under Offer status, pcm vs per-week rent ambiguity.",
    ],
    [
      "How would you measure success?",
      "Three quantified pillars, see success metrics table below. Headline targets: drive DMCC penalty exposure toward 0% (baseline: up to 10% turnover); contribute to reducing £119m/yr leakage; recover hours/agent/week via ~61% of 179 tasks automated; prevent up to ~15% potential lead loss; lift valuation capture toward the 15.6% rental-to-sales benchmark.",
    ],
  ],
  tr: [
    [
      "Hangi problemi çözüyorsun?",
      "EstateOS, UK emlak sektöründeki yıllık £119m gelir sızıntısını hedefler. Pasif CRM'ler Rightmove, Zoopla, web formu ve şube e-postasından gelen yapılandırılmamış iletişimi işleyemez. EstateOS, her mesajı nitelikli CRM aksiyonuna çeviren proaktif bir Agentic AI Operasyon Katmanıdır, şube başı haftada 5–10 kaçırılan çağrıyı ve valuation randevularının %80'inin ilk dönene gitmesi baskısını azaltır.",
    ],
    [
      "Kullanıcı bu özelliği nasıl kullanır?",
      "Danışman açık uçlu sohbet değil, yapılandırılmış Veri Triyaj Paneli'nde çalışır. Gelen mesajı seçer; AI Action Card'da niyet, lead skoru, eşleşen ilan, güven, eksik alanlar, Compliance Risk Flag, DMCC-güvenli cevap taslağı, CRM notu, follow-up ve ilan aksiyonunu görür; onaylar, düzenler veya reddeder. İnsan onayı zorunludur; onaylanmadan müşteriye hiçbir şey gitmez.",
    ],
    [
      "Hangi verilere ihtiyaç olur?",
      "Gelen kanallar: Rightmove/Zoopla talepleri, web formları, şube gelen kutusu. CRM: ilan statüsü (Under Offer/SSTC), fiyat, NTSELAT Part A/B/C material information (otopark, sel riski, EPC, kira süresi, yapı malzemesi, maden bölgesi). Müşteri geçmişi: önceki iletişim, eksik niteliklendirme, follow-up durumu. AML/KYC kimlik verileri maskelenir ve model eğitiminden izole edilir.",
    ],
    [
      "Teknik olarak nasıl yaklaşırsın?",
      "Yığın: Next.js App Router, TypeScript, server-side API (anahtarlar client dışında). Pipeline: (1) NLP niyet triyajı ve aciliyet skoru (Viewing Inquiry, Valuation Request, Missing Info vb.); (2) RAG, taslak yalnızca doğrulanmış CRM verisiyle, halüsinasyon riskini minimize eder; (3) Legal Guardian, Part B/C'yi CRM ile çapraz sorgular; (4) DMCC 2024 fiyatlandırma motoru: \"(Rent + Deposit + Mandatory Fees incl. VAT)\" formatında toplam, drip pricing'i teknik olarak engeller. Gemini structured JSON + demo için deterministic fallback.",
    ],
    [
      "Yasal uyumluluk katmanı nasıl çalışır?",
      "Her müşteri-facing AI aksiyonu gönderim öncesi Legal Guardian'dan geçer. DMCC 2024 unfair practice, material information, yanıltıcı ihmal ve audit kurallarını uygular. Verifikasyon katmanı Part B/C (EPC, otopark, sel vb.) eksik/eskiyse anında Compliance Risk Flag üretir. Fiyatlandırma motoru zorunlu bedelleri toplayarak uyumsuz teklifi bloke eder. Çıktı: PASS / WARN / FAIL ve alan düzeyinde kanıt.",
    ],
    [
      "Neden haftalık değil event-driven compliance?",
      "Compliance takvim değil aksiyonla tetiklenir: mesaj geldi, action card üretildi, cevap onaylandı, müşteriye gönderim, ilan güncellendi, portal sync, CRM notu, follow-up, valuation opportunity, gün sonu recap. Her event; kural versiyonu, ilan snapshot'ı, AI çıktısı, insan onayı ve final metniyle audit kaydı oluşturur.",
    ],
    [
      "Üründeki AI özellikleri neler?",
      "Niyet çıkarma, lead scoring, müşteri tipi, ilan eşleştirme, Part A/B/C boşluk tespiti, eski müsaitlik kontrolü, DMCC-güvenli cevap, CRM notu, follow-up, alternatif ilanlar, Valuation Opportunity sinyalleri, 48 saat+ yanıtsız e-posta bayrağı (Severe Risk of Losing Instruction), AI inbox önceliklendirme, müşteri simülasyonu, context upload, sabah brief, gün sonu recap, hepsi Legal Guardian ile sarılı.",
    ],
    [
      "En büyük riskler veya edge case'ler neler?",
      "Halüsinasyon (ör. bahçe izni uydurma), RAG + insan onayı ile yönetilir. Açık uçlu sohbet talebi, arayüz triyaj paneline kilitlenerek engellenir. GDPR/AML veri sızıntısı, maskelenme ve AI katmanından izolasyon. Uygulama direnci, ayrı portal yerine mevcut inbox/CRM üzerinde görünmez katman. Ek: yanlış ilan eşleşmesi, Under Offer eski statü, pcm/per-week belirsizliği.",
    ],
    [
      "Başarıyı nasıl ölçersin?",
      "Üç sayısal sütun, aşağıdaki başarı metrikleri tablosuna bakın. Özet hedefler: DMCC ceza maruziyetini %0'a yaklaştırmak (taban: cironun %10'una kadar); £119m/yıl sızıntıya katkıda azaltım; 179 görevden ~%61 otomasyonla danışman başı haftalık saat kazancı; ~%15'e varan potansiyel müşteri kaybını önlemek; valuation yakalamayı %15,6 kira→satış benchmark'ına taşımak.",
    ],
  ],
} as const;

const problemValueRows = {
  en: {
    eyebrow: "problem → value",
    title: "Core problems and quantified value targets",
    intro: "EstateOS Action Copilot addresses operational inefficiency and legal risk that together drive an estimated £119,000,000 in annual UK sector revenue leakage.",
    headers: ["Problem area", "Statistical loss (baseline)", "EstateOS solution & value target"],
    rows: [
      [
        "Compliance risk (DMCC 2024)",
        "Civil penalties up to 10% of global turnover · 33% of live ads missing council tax (Part A) · 25% missing lease length (Part A)",
        "Target: drive penalty exposure toward 0%. DMCC 2024 pricing engine blocks misleading offers; instant Part B/C gaps → Compliance Risk Flag.",
      ],
      [
        "Operational inefficiency (app switching)",
        "566 app switches/agent/day · up to 40% productivity loss · 179 tasks/transaction",
        "Target: automate or accelerate 110 tasks (~61%) per transaction; recover dozens of admin hours/agent/week via one action card.",
      ],
      [
        "Missed leads (ghosting)",
        "5–10 missed business calls/branch/week · 80% of valuation appointments to first responder · £119m/yr sector leakage",
        "Target: flag hot leads unanswered 48h+ as Severe Risk of Losing Instruction; proactive follow-up before instruction is lost.",
      ],
      [
        "Hidden sales opportunities",
        "Rental-to-sales portfolio conversion: 9.8% → 15.6% YoY (+5.8 pp)",
        "Target: surface Valuation Opportunity signals in tenant/buyer threads, even rental enquiries, without generic sales pitches.",
      ],
    ],
  },
  tr: {
    eyebrow: "problem → değer",
    title: "Temel problemler ve sayısal değer hedefleri",
    intro: "EstateOS Action Copilot, operasyonel verimsizlik ve yasal riskten kaynaklanan UK emlak sektöründe tahmini yıllık £119.000.000 gelir sızıntısını hedefler.",
    headers: ["Problem alanı", "İstatistiksel kayıp (taban)", "EstateOS çözümü ve değer hedefi"],
    rows: [
      [
        "Yasal uyum riski (DMCC 2024)",
        "Global cironun %10'una kadar sivil ceza · yayında ilanların %33'ü council tax (Part A) · %25'i lease length (Part A) eksik",
        "Hedef: ceza maruziyetini %0'a yaklaştırmak. DMCC 2024 fiyatlandırma motoru yanıltıcı teklifi bloke eder; eksik Part B/C → Compliance Risk Flag.",
      ],
      [
        "Operasyonel verimsizlik (app switching)",
        "Danışman başı günde 566 geçiş · %40'a kadar verim kaybı · işlem başına 179 görev",
        "Hedef: 110 görevi (~%61) otomatikleştir/hızlandır; tek action card ile danışman başı haftada onlarca idari saat kazandırmak.",
      ],
      [
        "Kaçırılan müşteriler (ghosting)",
        "Şube başı haftada 5–10 kaçırılan çağrı · valuation randevularının %80'i ilk dönene · yıllık £119m sektör sızıntısı",
        "Hedef: 48 saat+ yanıtsız sıcak talepleri Severe Risk of Losing Instruction olarak işaretle; instruction kaybından önce proaktif takip.",
      ],
      [
        "Gizli satış fırsatları",
        "Kira→satış portföy dönüşümü: %9,8 → %15,6 (yıllık +5,8 puan)",
        "Hedef: kiracı/alıcı konuşmalarında, even kiralık taleplerde, Valuation Opportunity sinyali; generic satış pitch olmadan.",
      ],
    ],
  },
} as const;

const technicalLayers = {
  en: {
    eyebrow: "technical architecture",
    title: "How the agentic workflow layer works",
    headers: ["Layer", "Mechanism", "Measurable outcome"],
    rows: [
      ["Intent triage (NLP)", "Inbound message scored for urgency; classified (Viewing Inquiry, Valuation Request, Missing Info Request, etc.) and written to CRM as structured data", "Faster first response vs 80% first-responder benchmark"],
      ["RAG (retrieval-augmented generation)", "Reply drafts grounded only in verified, current CRM listing facts, no speculative property claims", "Hallucination incidents → target 0 with human-in-the-loop gate"],
      ["Verification / Compliance Risk Flag", "Customer questions and listing gaps cross-checked against Part B/C material information in CRM", "Unresolved Part B/C issues tracked; NTSELAT-aligned listing completeness ↑"],
      ["DMCC pricing engine", "Auto-aggregates \"(Rent + Deposit + Mandatory Fees incl. VAT)\"; blocks drip pricing technically", "Non-compliant customer-facing offers blocked before send"],
      ["Event-driven Legal Guardian", "PASS / WARN / FAIL on every approve/send with audit trail (rule version, snapshot, AI output, human sign-off)", "Legal gate block rate; incorrect-information incidents → 0"],
    ],
  },
  tr: {
    eyebrow: "teknik mimari",
    title: "Agentic iş akışı katmanı nasıl çalışır",
    headers: ["Katman", "Mekanizma", "Ölçülebilir çıktı"],
    rows: [
      ["Niyet triyajı (NLP)", "Gelen mesaj aciliyet skoru alır; sınıflandırılır (Viewing Inquiry, Valuation Request, Missing Info vb.) ve CRM'e yapılandırılmış veri olarak yazılır", "Valuation randevularının %80'ine karşı daha hızlı ilk cevap"],
      ["RAG mimarisi", "Cevap taslağı yalnızca doğrulanmış, güncel CRM ilan verisiyle üretilir, spekülatif property iddiası yok", "Halüsinasyon olayları → insan onaylı kapı ile hedef 0"],
      ["Verifikasyon / Compliance Risk Flag", "Müşteri soruları ve ilan boşlukları CRM'deki Part B/C material information ile çapraz sorgulanır", "Çözülmemiş Part B/C sayısı izlenir; NTSELAT uyumlu ilan tamlığı ↑"],
      ["DMCC fiyatlandırma motoru", "\"(Rent + Deposit + Mandatory Fees incl. VAT)\" otomatik toplanır; drip pricing teknik olarak engellenir", "Uyumsuz müşteri teklifleri gönderim öncesi bloke"],
      ["Event-driven Legal Guardian", "Her onay/gönderimde PASS / WARN / FAIL + audit (kural versiyonu, snapshot, AI çıktısı, insan imzası)", "Legal gate block rate; yanlış bilgi olayı → 0"],
    ],
  },
} as const;

const successMetrics = {
  en: {
    eyebrow: "success measurement",
    title: "How success is quantified",
    intro: "ROI, compliance and revenue metrics are tracked directly, aligned to the £119m leakage baseline and DMCC penalty ceiling.",
    headers: ["Pillar", "Key metrics", "Quantified target"],
    rows: [
      [
        "Cost reduction & productivity (ROI)",
        "Manual admin minutes/message · app-switching frequency · hours saved/agent/week · revenue per employee",
        "Recover up to 40% productivity drag; dozens of hours/agent/week from ~61% task automation (110/179); fewer than 566 switches/day proxy",
      ],
      [
        "Legal risk reduction (compliance)",
        "Listings auto-enriched to NTSELAT Part B/C · Compliance Risk Flags raised & resolved · legal gate block rate",
        "Penalty exposure toward 0% (vs up to 10% turnover baseline); flag resolution logged in audit trail",
      ],
      [
        "Revenue & client relationships",
        "48h+ slipped-lead recovery rate · Valuation Opportunity conversion · median first-response time",
        "Prevent up to ~15% potential lead loss; lift valuation capture toward 15.6% benchmark; beat 80% first-responder rule",
      ],
    ],
  },
  tr: {
    eyebrow: "başarı ölçümü",
    title: "Başarı nasıl sayısallaştırılır",
    intro: "ROI, uyumluluk ve gelir metrikleri doğrudan izlenir, £119m sızıntı tabanı ve DMCC ceza tavanıyla hizalı.",
    headers: ["Sütun", "Ana metrikler", "Sayısal hedef"],
    rows: [
      [
        "Maliyet azaltma ve verimlilik (ROI)",
        "Mesaj başına manuel idari dk · uygulama geçiş sıklığı · danışman başı haftalık kazanılan saat · çalışan başına gelir",
        "%40'a varan verim kaybının geri kazanımı; 179 görevden ~%61 (110) otomasyonla haftada onlarca saat; 566 geçiş/gün proxy'sinin düşmesi",
      ],
      [
        "Yasal risk azaltma (compliance)",
        "NTSELAT Part B/C uyumlu otomatik ilan zenginleştirme · Compliance Risk Flag sayısı · legal gate block rate",
        "Ceza maruziyeti %0'a (taban: cironun %10'una kadar); flag çözümü audit trail'de kayıtlı",
      ],
      [
        "Gelir ve müşteri ilişkileri",
        "48 saat+ slipped-lead geri kazanım oranı · Valuation Opportunity dönüşümü · medyan ilk cevap süresi",
        "~%15'e varan potansiyel müşteri kaybını önlemek; valuation yakalamayı %15,6 benchmark'a taşımak; %80 ilk dönen kuralını geçmek",
      ],
    ],
  },
} as const;

const riskStats = {
  en: {
    eyebrow: "market risk baseline",
    title: "DMCC exposure and measurable UK agency losses",
    intro: "Under the Digital Markets, Competition and Consumers Act 2024 (DMCC), monetary losses from misleading omission, drip pricing and incomplete material information sit alongside operational leakage from slow replies and fragmented tools. The figures below are published industry benchmarks used as measurable baselines for EstateOS Action Copilot.",
    headers: ["Risk category", "Published statistic", "Financial / compliance impact"],
    rows: [
      ["DMCC civil penalty ceiling", "Up to 10% of agency global turnover", "Misleading omission or prohibited pricing (e.g. drip pricing) can trigger board-level civil penalties, not fixed fines."],
      ["Part A listing gaps (live ads)", "33% missing council tax · 25% missing lease length", "Even published listings lack basic Part A material information required for fair customer decisions."],
      ["Part B/C omission risk", "100% compliance required on parking, flood, EPC, construction & mining-area fields", "Each missing contextual field is a direct DMCC misleading-omission exposure, not a formatting issue."],
      ["Missed inbound calls", "5–10 business calls per branch per week", "Ghosting and manual handoffs convert directly into lost valuations, viewings and instructions."],
      ["UK sector revenue leakage", "£119,000,000 per year (sector-wide)", "Missed enquiries aggregate into nine-figure annual leakage across UK estate agency."],
      ["App-switching tax", "566 switches per agent per day · up to 40% productivity loss", "Context switching between inbox, CRM, portals and follow-up tools erodes billable capacity."],
      ["Speed-to-lead", "80% of valuation appointments won by first responder", "Response latency is a zero-sum instruction metric; second place rarely converts."],
      ["Rental-to-sales conversion", "9.8% → 15.6% YoY (+5.8 pp)", "Tenant/buyer threads contain measurable seller signals; baseline conversion already trending up."],
      ["End-to-end task load", "179 discrete tasks per transaction · ~61% automatable (110 tasks)", "Administrative drag is quantifiable; automation headroom is the productivity recovery lever."],
    ],
  },
  tr: {
    eyebrow: "pazar risk zemini",
    title: "DMCC kaynaklı parasal risk ve ölçülebilir UK emlak kayıpları",
    intro: "Dijital Pazarlar, Rekabet ve Tüketiciler Yasası 2024 (DMCC) kapsamında yanıltıcı ihmal, drip pricing ve eksik material information kaynaklı parasal kayıplar; geç dönüş ve parçalı araçlardan doğan operasyonel sızıntıyla birleşir. Aşağıdaki rakamlar EstateOS Action Copilot için ölçülebilir taban çizgisi olarak kullanılan sektör verileridir.",
    headers: ["Risk kategorisi", "Yayınlanan istatistik", "Finansal / uyumluluk etkisi"],
    rows: [
      ["DMCC sivil ceza tavanı", "Ajans global cironun %10'una kadar", "Yanıltıcı ihmal veya yasaklı fiyatlandırma (ör. drip pricing) sabit ceza değil, ciro oranlı sivil yaptırımdır."],
      ["Part A ilan boşlukları (yayında)", "%33 council tax eksik · %25 lease length eksik", "Yayındaki ilanların üçte biri / dörtte biri temel Part A material information içermiyor."],
      ["Part B/C ihmal riski", "Otopark, sel, EPC, yapı malzemesi, maden bölgesi ,  alan başına %100 uyum", "Her eksik bağlamsal alan doğrudan DMCC yanıltıcı ihmal riski; biçimlendirme hatası değildir."],
      ["Kaçırılan gelen çağrılar", "Şube başına haftada 5–10 iş çağrısı", "Ghosting ve manuel devirler doğrudan kayıp valuation, viewing ve instruction'a dönüşür."],
      ["UK sektör gelir sızıntısı", "Yılda £119.000.000 (sektör geneli)", "Kaçırılan talepler UK emlak sektöründe dokuz haneli yıllık gelir kaybına birikir."],
      ["Uygulama geçiş maliyeti", "Danışman başı günde 566 geçiş · %40'a kadar verim kaybı", "Inbox, CRM, portal ve takip araçları arası geçiş faturalanabilir kapasiteyi eritir."],
      ["Hızlı dönüş", "Valuation randevularının %80'i ilk dönen ajansa gider", "Cevap gecikmesi sıfır toplamlı bir instruction metriğidir; ikinci sırada dönüşüm nadirdir."],
      ["Kira→satış dönüşümü", "%9,8 → %15,6 (yıllık +5,8 puan)", "Kiracı/alıcı konuşmalarında ölçülebilir satıcı sinyalleri vardır; taban dönüşüm zaten yükseliyor."],
      ["Uçtan uca görev yükü", "İşlem başına 179 ayrı görev · ~%61 otomasyonlanabilir (110 görev)", "İdari yük sayısallaştırılabilir; otomasyon payı verim kazanımının ana kaldıracıdır."],
    ],
  },
} as const;

function DataTable({ headers, rows }: { headers: readonly string[]; rows: readonly (readonly string[])[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left font-body text-sm">
        <thead>
          <tr className="border-b-2 border-foreground/20">
            {headers.map((header) => (
              <th key={header} className="p-3 font-heading text-foreground">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")} className="border-b border-border">
              {row.map((cell, index) => (
                <td key={cell} className={`p-3 align-top leading-6 ${index === 0 ? "font-heading text-foreground" : "text-muted-foreground"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ApproachPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = normaliseLocale(localeParam);
  const dictionary = getDictionary(locale);
  const stats = riskStats[locale];
  const problems = problemValueRows[locale];
  const technical = technicalLayers[locale];
  const success = successMetrics[locale];

  return (
    <div className="space-y-10">
      <header className="surface-card-playful px-5 py-10 md:px-10">
        <p className="eyebrow">{locale === "tr" ? "mini case + compliance architecture" : "case study + compliance architecture"}</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold text-foreground md:text-4xl">{dictionary.approach}</h1>
        <p className="mt-5 max-w-4xl font-body text-base leading-7 text-muted-foreground">
          {locale === "tr"
            ? "EstateOS Action Copilot; yıllık £119m gelir sızıntısı, DMCC 2024 uyum riski ve operasyonel verimsizliğe karşı Agentic AI Operasyon Katmanı, event-driven Legal Guardian ve sayısal başarı metrikleriyle konumlanır."
            : "EstateOS Action Copilot is positioned as an Agentic AI operations layer with event-driven Legal Guardian and quantified success metrics, targeting £119m/yr sector leakage, DMCC 2024 compliance risk and operational inefficiency."}
        </p>
      </header>

      <Panel variant="card" className="p-6 md:p-8">
        <p className="eyebrow">{problems.eyebrow}</p>
        <h2 className="card-title-glow mt-3 text-2xl leading-tight">{problems.title}</h2>
        <p className="mt-4 max-w-5xl font-body text-sm leading-7 text-muted-foreground">{problems.intro}</p>
        <DataTable headers={problems.headers} rows={problems.rows} />
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {sections[locale].map(([title, body], index) => (
          <Panel key={title} variant="card" className="p-6 md:min-h-64">
            <div className="mono-detail">{String(index + 1).padStart(2, "0")}</div>
            <h2 className="card-title-glow mt-4 text-lg leading-snug md:text-xl">{title}</h2>
            <p className="mt-4 font-body text-sm leading-7 text-muted-foreground">{body}</p>
          </Panel>
        ))}
      </div>

      <Panel variant="card" className="p-6 md:p-8">
        <p className="eyebrow">{technical.eyebrow}</p>
        <h2 className="card-title-glow mt-3 text-2xl leading-tight">{technical.title}</h2>
        <DataTable headers={technical.headers} rows={technical.rows} />
      </Panel>

      <Panel variant="card" className="p-6 md:p-8">
        <p className="eyebrow">{stats.eyebrow}</p>
        <h2 className="card-title-glow mt-3 text-2xl leading-tight">{stats.title}</h2>
        <p className="mt-4 max-w-5xl font-body text-sm leading-7 text-muted-foreground">{stats.intro}</p>
        <DataTable headers={stats.headers} rows={stats.rows} />
      </Panel>

      <Panel variant="card" className="p-6 md:p-8">
        <p className="eyebrow">{success.eyebrow}</p>
        <h2 className="card-title-glow mt-3 text-2xl leading-tight">{success.title}</h2>
        <p className="mt-4 max-w-5xl font-body text-sm leading-7 text-muted-foreground">{success.intro}</p>
        <DataTable headers={success.headers} rows={success.rows} />
        <p className="mt-4 font-body text-xs leading-5 text-muted-foreground">
          {locale === "tr"
            ? "Not: Bu demo hukuki garanti vermez; sayısal hedefler, riskli aksiyonları önceden yakalayan, insan onayı isteyen ve audit trail oluşturan kontrol katmanını gösterir."
            : "Note: this demo does not provide a legal guarantee; the quantified targets demonstrate a control layer that catches risky actions early, requires human approval and creates an audit trail."}
        </p>
      </Panel>

      <section
        className="overflow-hidden rounded-xl border-2 border-ink bg-ink px-6 py-12 shadow-[8px_8px_0_0_#E6007E] md:px-12 md:py-16 lg:px-16 lg:py-20"
        aria-label={dictionary.productName}
      >
        <Image
          src="/brand/estateos-logo.png"
          alt="estateos copilot ,  AI action layer for UK estate agents"
          width={866}
          height={288}
          className="mx-auto h-auto w-full max-w-3xl object-contain sm:max-w-4xl md:max-w-5xl lg:max-w-6xl"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1152px"
        />
      </section>
    </div>
  );
}
