**EstateOS Action Copilot**, UK emlak danışmanlarının gün içinde aldığı müşteri mesajlarını analiz eden, ilgili ilan ve CRM verileriyle eşleştiren, eksik veya riskli ilan bilgilerini tespit eden ve danışmana onaylanabilir cevap, CRM notu, follow-up görevi ve günlük briefing raporu üreten AI destekli bir web uygulamasıdır.

Bu ürünün amacı bir emlak danışmanını tamamen otomatikleştirmek değil; danışmanın günlük operasyonel yükünü azaltmak, lead takibini kaçırmasını engellemek ve müşteriye daha hızlı, doğru ve güvenli dönüş yapmasını sağlamaktır.

Ürün, gelen her müşteri mesajını şu soruya cevap veren bir **AI Action Card**'a dönüştürür:

> Bu müşteri ne istiyor, hangi ilanla ilgili, hangi bilgi eksik, hangi cevap güvenle gönderilebilir ve danışmanın bir sonraki aksiyonu ne olmalı?

---

## 2. Case Bağlamı

Iceberg Digital tarafından verilen mini case şu problemi ele alıyor:

> Bir UK emlak danışmanının gün içinde gelen müşteri mesajlarını yanıtladığını, ilan bilgilerini güncellediğini ve potansiyel müşterileri takip ettiğini düşün. Bu kişinin işini kolaylaştıracak küçük ama faydalı bir AI özelliği tasarla.

Bu case kapsamında ürünün cevaplaması gereken ana sorular şunlar:

1. Hangi problemi çözüyorsun?
2. Kullanıcı bu özelliği nasıl kullanır?
3. Hangi verilere ihtiyaç olur?
4. Teknik olarak nasıl yaklaşırsın?
5. En büyük riskler veya edge case’ler neler?
6. Başarıyı nasıl ölçersin?
7. AI araçlarını süreçte nasıl kullandın?

**EstateOS Action Copilot**, bu isterlerin tamamını doğrudan karşılayacak şekilde tasarlanmıştır.

---

## 3. Problem Tanımı

Bir UK emlak danışmanı gün içinde farklı kanallardan birçok müşteri mesajı alır:

- Rightmove lead mesajları
- Zoopla lead mesajları
- Web form talepleri
- E-posta mesajları
- WhatsApp / SMS konuşmaları
- Telefon görüşmesi sonrası manuel notlar

Bu mesajlar çoğu zaman basit gibi görünür, fakat her biri danışmanın birden fazla küçük operasyonel işlem yapmasını gerektirir.

Örnek müşteri mesajı:

> Hi, is the 2-bed flat in Colchester still available? Can I view it this Saturday? Also, is parking included?

Bu mesajı yanıtlamak için emlak danışmanının yapması gerekenler:

1. Mesajı okumak
2. Müşterinin niyetini anlamak
3. İlgili ilanı bulmak
4. İlanın hâlâ müsait olup olmadığını kontrol etmek
5. Cumartesi viewing slotu olup olmadığını kontrol etmek
6. Parking bilgisinin ilanda olup olmadığını kontrol etmek
7. Eksik bilgi varsa property manager / landlord / seller tarafına sormak
8. Müşteriye profesyonel bir cevap yazmak
9. CRM’e not düşmek
10. Follow-up görevi oluşturmak
11. Lead’in sıcaklığını güncellemek

Bu işlerin her biri küçük görünür; fakat gün içinde onlarca mesaj geldiğinde ciddi zaman kaybına, geç dönüşlere, eksik CRM kayıtlarına ve kaçan fırsatlara dönüşür.

---

## 4. Çözülen Ana Problem

EstateOS Action Copilot’un çözmek istediği temel problem şudur:

> UK emlak danışmanları müşteri mesajları, ilan bilgileri ve follow-up görevleri arasında sürekli bağlam değiştiriyor. Bu durum yavaş cevaplara, eksik CRM kayıtlarına, unutulan lead’lere ve yanlış/eksik ilan bilgisiyle verilen cevaplara yol açıyor.

Ürün bu problemi üç ana seviyede çözer:

### 4.1. Mesajı Anlama

AI, gelen müşteri mesajını analiz eder ve şu alanları çıkarır:

- Müşteri tipi: buyer, tenant, seller, landlord, unknown
- Niyet: viewing request, valuation request, availability question, price question, parking question
- İlgili lokasyon
- İlgili ilan referansı
- Bütçe
- Oda sayısı
- Aciliyet
- Lead sıcaklığı
- Cevap verebilmek için gereken bilgiler

### 4.2. İlan ve CRM ile Eşleştirme

Sistem, mesajdaki bilgileri Supabase veritabanındaki CRM ve property/listing kayıtlarıyla eşleştirir.

Örneğin:

- Müşteri Colchester’daki 2-bed flat’i soruyorsa, sistem ilgili property kaydını bulur.
- Müşteri daha önce yazmışsa mevcut lead kaydıyla eşleşir.
- İlanda parking, EPC, council tax, availability gibi bilgiler kontrol edilir.

### 4.3. Aksiyona Dönüştürme

Sistem yalnızca analiz yapmaz; emlak danışmanına net bir aksiyon kartı üretir:

- Suggested reply
- Suggested CRM note
- Suggested follow-up task
- Missing listing fields
- Risk flags
- Lead temperature
- Recommended next action

---

## 5. Ürün Vizyonu

EstateOS Action Copilot bir chatbot değildir.

Daha doğru tanımı şudur:

> EstateOS Action Copilot, emlak danışmanının gelen kutusunda çalışan, her müşteri mesajını doğrulanmış bir sonraki aksiyona dönüştüren AI destekli bir operasyon asistanıdır.

Bu ayrım çok önemlidir.

Basit chatbot yaklaşımı sadece cevap yazmaya odaklanır. Fakat emlak danışmanının asıl ihtiyacı yalnızca cevap yazmak değildir. Danışmanın ihtiyacı şudur:

- Bu müşteri ciddi mi?
- Hangi ilanla ilgileniyor?
- Bu ilana dair eksik bilgi var mı?
- Hangi bilgiyi kesin biliyoruz?
- Hangi bilgi doğrulanmalı?
- CRM’e ne işlenmeli?
- Bu lead ne zaman takip edilmeli?
- Gün içinde öncelik sırası ne olmalı?

EstateOS Action Copilot bu sorulara cevap verir.

---

## 6. Ana Değer Önerisi

### İngilizce Değer Önerisi

> EstateOS Action Copilot turns every incoming customer message into a verified next-best-action card for estate agents.

### Türkçe Değer Önerisi

> EstateOS Action Copilot, gelen her müşteri mesajını emlak danışmanı için doğrulanmış bir sonraki aksiyon kartına dönüştürür.

---

## 7. Ürün Kapsamı

Bu ürün bir full CRM replacement değildir. Mini case kapsamında küçük, anlaşılır ve çalışır bir AI özelliği olarak tasarlanmıştır.

### MVP’de Olacaklar

- Web tabanlı demo uygulaması
- Vercel üzerinden deploy edilebilir yapı
- Supabase veritabanı
- Gemini API ile AI analizi
- TypeScript tabanlı sade AI workflow
- Türkçe / İngilizce arayüz desteği
- Dark mode / light mode desteği
- Demo inbox
- Demo property/listing kayıtları
- Mesaj analiz sistemi
- AI Action Card üretimi
- Missing listing information detection
- Suggested reply
- Suggested CRM note
- Suggested follow-up task
- Risk flags
- Morning Brief
- End-of-Day Recap
- Mini case yaklaşım sayfası

### MVP’de Olmayacaklar

- Tam kapsamlı CRM
- Gerçek Rightmove / Zoopla entegrasyonu
- Gerçek e-posta gönderimi
- Gerçek WhatsApp entegrasyonu
- Multi-user agency management
- Calendar booking automation
- Voice call automation
- LangGraph veya karmaşık agent framework
- Full analytics platform
- Payment / subscription sistemi

---

## 8. Hedef Kullanıcı

### Ana Kullanıcı

UK’de çalışan estate agent veya letting agent.

### Kullanıcının Günlük İhtiyaçları

- Gelen lead’lere hızlı dönüş yapmak
- Müşteri taleplerini doğru anlamak
- Uygun property/listing ile eşleştirme yapmak
- CRM notlarını güncel tutmak
- Follow-up kaçırmamak
- İlan bilgilerinin eksik veya eski olup olmadığını görmek
- Gün başında neye odaklanacağını bilmek
- Gün sonunda nelerin tamamlandığını ve nelerin kaldığını görmek

### Kullanıcının Ağrı Noktaları

- Çok fazla mesaj
- Çok fazla manuel kontrol
- CRM güncellemelerinin unutulması
- Müşteriye geç dönüş
- Benzer ilanlar arasında karışıklık
- Eksik ilan bilgisi
- Yanlış bilgi verme riski
- Follow-up takibinin dağınık olması
- Gün içinde önceliklerin belirsizleşmesi

---

## 9. Ana Kullanıcı Deneyimi

Ürün, kullanıcıyı karmaşık ekranlara boğmadan tek bir operasyon panelinde çalışır.

Ana demo ekranı üç temel bölüme ayrılır:

```text
---------------------------------------------------------------
| Inbox List        | Message Detail         | AI Action Card  |
---------------------------------------------------------------
| Sarah M.          | Full message content   | Intent          |
| James R.          |                        | Lead score      |
| Priya K.          |                        | Matched listing |
| Ahmed B.          |                        | Missing info    |
| Emma W.           |                        | Suggested reply |
|                   |                        | CRM note        |
|                   |                        | Follow-up task  |
---------------------------------------------------------------
````

---

## 10. Temel Kullanıcı Akışı

### 10.1. Kullanıcı Dashboard’a Girer

Dashboard’un üst kısmında Daily Briefing alanı yer alır.

Kullanıcı iki briefing seçeneği görür:

* Generate Morning Brief
* Generate End-of-Day Recap

Bu alan, danışmanın günü yönetmesine yardımcı olur.

---

### 10.2. Kullanıcı Inbox’tan Bir Mesaj Seçer

Sol tarafta demo müşteri mesajları listelenir.

Örnek mesajlar:

```text
Sarah M.
Subject: Viewing request for Colchester flat
Message: Hi, is the 2-bed flat in Colchester still available? Can I view it this Saturday? Also, is parking included?

James R.
Subject: Valuation request
Message: Hi, I’m thinking about selling my 3-bed house in Essex. Could someone give me an estimated valuation?

Priya K.
Subject: Rental search
Message: I’m looking for a 1-bed flat near Bristol city centre. My budget is around £1,350 pcm. Do you have anything available?
```

---

### 10.3. Kullanıcı Mesaj Detayını Görür

Ortadaki panelde seçilen mesajın tam içeriği, müşteri bilgileri ve varsa ilgili property bilgisi gösterilir.

Örnek:

```text
Lead: Sarah Mitchell
Channel: Website Form
Received: Today, 09:42
Status: New
Property reference: 2-bed Flat in Colchester

Message:
Hi, is the 2-bed flat in Colchester still available?
Can I view it this Saturday?
Also, is parking included?
```

---

### 10.4. Kullanıcı AI Analizini Çalıştırır

Kullanıcı şu butona basar:

```text
[Generate AI Action Card]
```

Sistem Gemini API’yi kullanarak mesajı analiz eder.

Arka planda şu adımlar çalışır:

1. Mesajdan intent çıkarılır
2. Müşteri tipi belirlenir
3. Lead sıcaklığı tahmin edilir
4. İlgili property eşleştirilir
5. Property bilgilerinde eksik alanlar kontrol edilir
6. Risk flag’leri oluşturulur
7. Cevap taslağı üretilir
8. CRM notu önerilir
9. Follow-up görevi önerilir

---

### 10.5. Kullanıcı AI Action Card Görür

AI Action Card şu bilgileri içerir:

```text
Intent:
Viewing request + availability question + parking question

Lead temperature:
Hot

Matched property:
2-bed Flat in Colchester

Confidence:
86%

Missing information:
Parking information is missing from the listing.

Risk flags:
- Parking information missing
- Availability was last updated 36 hours ago

Suggested reply:
Hi Sarah, thanks for your message. The flat is currently showing as available and I can check Saturday viewing options for you. I’m also confirming the parking details so I can give you accurate information. I’ll come back to you shortly with the available times.

Suggested CRM note:
Sarah asked about Saturday viewing and parking for the 2-bed flat in Colchester.

Suggested follow-up:
Confirm parking details and available Saturday viewing slots today.

Suggested listing action:
Update the parking information field after verification.
```

---

### 10.6. Kullanıcı Aksiyon Alır

Action Card üzerinde şu butonlar bulunur:

```text
[Approve Reply]
[Edit Reply]
[Create Follow-up]
[Mark Listing Info Missing]
[Regenerate]
```

MVP’de bu butonlar gerçek e-posta gönderimi yapmayabilir. Ancak ürün mantığını göstermek için state güncellemesi yapabilir:

* Reply approved
* Follow-up created
* Listing flagged
* CRM note saved

Bu sayede demo statik bir arayüz gibi değil, kullanılabilir bir ürün gibi görünür.

---

## 11. AI Action Card Detayları

AI Action Card ürünün kalbidir.

### Action Card İçeriği

| Alan             | Açıklama                                 |
| ---------------- | ---------------------------------------- |
| Intent           | Müşterinin ne istediği                   |
| Customer Type    | Buyer, tenant, seller, landlord, unknown |
| Lead Temperature | Cold, warm, hot                          |
| Matched Property | İlgili property/listing                  |
| Confidence       | Eşleşme güven skoru                      |
| Missing Fields   | Eksik property/listing bilgileri         |
| Risk Flags       | Yanlış/eksik bilgi riski                 |
| Suggested Reply  | Müşteriye gönderilebilir cevap taslağı   |
| CRM Note         | CRM’e işlenebilecek kısa not             |
| Follow-up Task   | Sonraki takip görevi                     |
| Listing Action   | İlan güncelleme önerisi                  |
| Approval State   | Onaylandı, düzenlendi, bekliyor vb.      |

---

## 12. Daily Briefing Özelliği

EstateOS Action Copilot yalnızca tek tek mesajları analiz etmez. Aynı zamanda estate agent’ın gününü yönetmesine yardımcı olan hafif bir AI briefing katmanı sunar.

Bu özellik iki parçadan oluşur:

1. Morning Brief
2. End-of-Day Recap

Bu özellik ana ürünün kapsamını büyütmeden, ürünün değerini artırır.

---

## 13. Morning Brief

### Amaç

Estate agent’ın güne başlarken neye odaklanması gerektiğini göstermektir.

### Kullanılan Veriler

* Açık lead’ler
* Hot lead’ler
* Gecikmiş follow-up’lar
* Eksik listing bilgileri
* Cevap bekleyen müşteri mesajları
* Availability bilgisi eski olan ilanlar
* Henüz onaylanmamış AI Action Card’lar

### Örnek Morning Brief

```text
Good morning, Alex.

You have 12 active leads today.
3 of them are high-priority.
4 follow-ups are due before noon.
2 listings have missing information.
1 property has stale availability data.

Recommended focus:
1. Reply to Sarah M. about Saturday viewing for the Colchester flat.
2. Confirm parking information for the Colchester listing.
3. Follow up with James R. about his valuation request.
4. Update the Bristol listing because EPC information is missing.

Main risk:
The Colchester flat is receiving interest, but parking information is missing and availability was last updated 36 hours ago.
```

### Türkçe Arayüz Karşılığı

```text
Günaydın Alex.

Bugün 12 aktif lead var.
3 tanesi yüksek öncelikli.
4 follow-up öğleden önce tamamlanmalı.
2 ilanda eksik bilgi bulunuyor.
1 ilanın availability bilgisi güncel olmayabilir.

Önerilen odak:
1. Sarah M.’ye Colchester ilanı için Cumartesi viewing hakkında dönüş yap.
2. Colchester ilanındaki parking bilgisini doğrula.
3. James R. ile valuation talebi için follow-up yap.
4. Bristol ilanında eksik EPC bilgisini güncelle.

Ana risk:
Colchester ilanı ilgi görüyor, fakat parking bilgisi eksik ve availability bilgisi 36 saat önce güncellenmiş.
```

---

## 14. End-of-Day Recap

### Amaç

Gün sonunda estate agent’a gün içinde nelerin tamamlandığını, nelerin kaldığını ve yarın neye odaklanması gerektiğini göstermektir.

### Kullanılan Veriler

* İşlenen mesajlar
* Onaylanan AI Action Card’lar
* Oluşturulan follow-up görevleri
* Tamamlanan follow-up’lar
* Hâlâ eksik listing bilgileri
* Cevapsız kalan hot lead’ler
* Gün sonunda açık kalan riskler

### Örnek End-of-Day Recap

```text
End-of-day recap

Today:
- 18 messages were processed.
- 11 AI action cards were approved.
- 5 viewing requests were identified.
- 3 follow-ups were completed.
- 2 listing issues were resolved.

Still needs attention:
- Sarah M. is waiting for parking confirmation.
- Bristol listing still has missing EPC information.
- 2 warm leads did not receive a follow-up today.

Suggested plan for tomorrow:
1. Start with unresolved hot leads.
2. Verify missing listing fields.
3. Re-engage warm leads from today.
```

### Türkçe Arayüz Karşılığı

```text
Gün sonu özeti

Bugün:
- 18 mesaj işlendi.
- 11 AI aksiyon kartı onaylandı.
- 5 viewing talebi tespit edildi.
- 3 follow-up tamamlandı.
- 2 ilan problemi çözüldü.

Hâlâ dikkat gerektirenler:
- Sarah M. parking doğrulaması bekliyor.
- Bristol ilanında EPC bilgisi hâlâ eksik.
- 2 warm lead bugün takip edilmedi.

Yarın için önerilen plan:
1. Çözülmemiş hot lead’lerle başla.
2. Eksik ilan alanlarını doğrula.
3. Bugünden kalan warm lead’leri yeniden aktive et.
```

---

## 15. Neden Daily Briefing Önemli?

Estate agent’ın problemi yalnızca tek tek mesajlara cevap vermek değildir.

Asıl problem şudur:

> Gün içinde çok fazla küçük aksiyon oluşur ve danışman hangi lead’in, hangi ilanın veya hangi follow-up’ın daha önemli olduğunu kaçırabilir.

Daily Briefing bu noktada ürünü daha güçlü hâle getirir.

Bu özellik sayesinde ürün:

* Sadece reply generator olmaktan çıkar
* Estate agent’ın gününü yöneten bir operasyon asistanına dönüşür
* Iceberg Digital’in AI Operating System vizyonuna daha yakın konumlanır
* Mini case’e farklı ve akılda kalıcı bir değer katar

---

## 16. Teknik Yaklaşım

Bu projede LangGraph veya karmaşık agent framework kullanılmayacaktır.

Bunun yerine sade, okunabilir ve güçlü bir TypeScript tabanlı AI workflow kurulacaktır.

### Temel Teknoloji Stack’i

```text
Frontend:
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
lucide-react

Backend:
Next.js Route Handlers
Server Actions

Database:
Supabase PostgreSQL

AI:
Gemini API

Deployment:
Vercel

i18n:
TR / EN dictionary-based localization

Theme:
Dark mode / light mode
```

---

## 17. Neden LangGraph Kullanılmıyor?

Bu mini case’in amacı karmaşık bir AI infrastructure göstermek değildir.

Amaç şudur:

* Problemi doğru anlamak
* Küçük ama kullanılabilir ürün çıkarmak
* AI’ı doğru noktada kullanmak
* Gereksiz karmaşıklıktan kaçınmak
* Basit ama sağlam mimari kurmak

LangGraph gibi framework’ler daha büyük, stateful ve çok adımlı production agent sistemlerinde değerlidir. Ancak bu case için TypeScript içinde açık ve kontrol edilebilir bir pipeline yeterlidir.

Bu tercih bilinçlidir:

> Over-engineering yerine, kullanıcının gerçek iş akışına odaklanan sade ve deploy edilebilir bir AI product prototype.

---

## 18. AI Workflow

### Genel Akış

```text
1. Incoming message selected
2. Message sent to AI analysis endpoint
3. Gemini extracts structured intent
4. Supabase property and lead data retrieved
5. Missing listing information detected
6. Risk flags generated
7. Gemini creates suggested reply and action summary
8. AI Action Card saved to Supabase
9. UI displays the result
```

---

## 19. AI Agent Pipeline

```ts
export async function analyzeEstateMessage(input: {
  messageId: string;
  content: string;
}) {
  const extracted = await extractIntentWithGemini(input.content);

  const lead = await findLeadByMessage(input.messageId);

  const candidateProperties = await findCandidateProperties({
    location: extracted.location,
    bedrooms: extracted.bedrooms,
    propertyReference: extracted.propertyReference,
  });

  const matchedProperty = selectBestPropertyMatch({
    extracted,
    candidateProperties,
  });

  const missingFields = detectMissingFields({
    requiredFields: extracted.requiredFields,
    property: matchedProperty,
  });

  const riskFlags = buildRiskFlags({
    extracted,
    property: matchedProperty,
    missingFields,
  });

  const actionCard = await generateActionCardWithGemini({
    originalMessage: input.content,
    lead,
    extracted,
    matchedProperty,
    missingFields,
    riskFlags,
  });

  await saveActionCard(actionCard);

  return actionCard;
}
```

---

## 20. Gemini Structured Output

Gemini’den serbest metin almak yerine mümkün olduğunca structured JSON output alınacaktır.

Bu yaklaşım, uygulamanın AI cevabını daha güvenli kullanmasını sağlar.

### Intent Extraction Output Örneği

```json
{
  "customerType": "tenant",
  "intents": [
    "viewing_request",
    "availability_question",
    "parking_question"
  ],
  "propertyReference": "2-bed flat in Colchester",
  "location": "Colchester",
  "bedrooms": 2,
  "budget": {
    "amount": null,
    "period": "unknown"
  },
  "requiredFields": [
    "availability_status",
    "viewing_slots",
    "parking_info"
  ],
  "urgency": "high",
  "leadTemperature": "hot"
}
```

---

## 21. Prompting Yaklaşımı

AI promptları çok uzun ve kontrolsüz olmayacaktır.

Promptlar üç ana amaçla kullanılacaktır:

1. Intent extraction
2. Action card generation
3. Daily briefing generation

### Intent Extraction Prompt Mantığı

Modelden şunlar istenir:

* Müşteri mesajını analiz et
* Sadece JSON dön
* Emin olmadığın alanları null veya unknown yap
* Property bilgisi uydurma
* Müşteri intentlerini ayrıştır
* Required fields listesini çıkar

### Action Card Prompt Mantığı

Modelden şunlar istenir:

* Sadece verilen CRM ve property context’i kullan
* Eksik bilgi varsa uydurma
* Müşteriye gönderilebilir profesyonel cevap taslağı yaz
* Eksik bilgi durumunda dikkatli dil kullan
* CRM notu öner
* Follow-up görevi öner
* Listing update aksiyonu öner

### Daily Briefing Prompt Mantığı

Modelden şunlar istenir:

* Günlük operasyon context’ini analiz et
* Hot lead’leri öne çıkar
* Eksik ilan bilgilerini listele
* Gecikmiş follow-up’ları belirt
* Net ve uygulanabilir öncelik listesi üret
* Gereksiz uzun yazma
* Estate agent’ın sabah/gün sonu ihtiyacına uygun konuş

---

## 22. Guardrail Kuralları

Ürünün güvenilir görünmesini sağlayacak en önemli bölüm guardrail katmanıdır.

### 22.1. Veri Yoksa Uydurma

Eğer müşteri parking soruyorsa ve property kaydında parking bilgisi yoksa AI şu tarz bir cevap vermemelidir:

```text
Yes, parking is included.
```

Bunun yerine şöyle demelidir:

```text
I’m also confirming the parking details so I can give you accurate information.
```

### 22.2. Availability Eskiyse Kesin Konuşma

Eğer availability bilgisi 24 saatten eskiyse sistem risk flag üretir.

```text
Risk flag:
Availability was last updated 36 hours ago.
```

AI müşteriye kesin olarak “available” demek yerine şu dili kullanır:

```text
The flat is currently showing as available.
```

### 22.3. Düşük Confidence Durumunda Human Review

Eğer property match confidence düşükse sistem müşteri cevabı üretmek yerine agent’a seçim yaptırır.

```text
Multiple possible property matches found. Please select the correct property before generating a customer reply.
```

### 22.4. Eksik Material Information

EPC, council tax, tenure, parking, service charge gibi alanlar eksikse sistem bunları listing issue olarak gösterir.

### 22.5. Human-in-the-loop

Müşteriye gidecek hiçbir mesaj MVP’de otomatik gönderilmez.

AI sadece taslak üretir.

Son karar estate agent’tadır.

---

## 23. Supabase Veri Modeli

### 23.1. properties

```sql
create table properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  address text,
  property_type text not null,
  bedrooms int,
  bathrooms int,
  price_pcm int,
  price_pw int,
  sale_price int,
  availability_status text not null,
  epc_rating text,
  council_tax_band text,
  tenure text,
  parking_info text,
  service_charge text,
  ground_rent text,
  listing_url text,
  last_updated_at timestamptz default now(),
  created_at timestamptz default now()
);
```

### 23.2. leads

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  lead_type text,
  status text default 'new',
  temperature text default 'cold',
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 23.3. messages

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  channel text not null,
  subject text,
  content text not null,
  received_at timestamptz default now(),
  status text default 'unprocessed'
);
```

### 23.4. ai_action_cards

```sql
create table ai_action_cards (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references messages(id) on delete cascade,
  intent jsonb,
  customer_type text,
  lead_temperature text,
  matched_property_id uuid references properties(id) on delete set null,
  confidence numeric,
  missing_fields jsonb,
  risk_flags jsonb,
  suggested_reply text,
  suggested_crm_note text,
  suggested_follow_up text,
  suggested_listing_action text,
  approval_status text default 'pending',
  created_at timestamptz default now()
);
```

### 23.5. briefings

```sql
create table briefings (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  summary text not null,
  priorities jsonb,
  risks jsonb,
  recommended_actions jsonb,
  generated_at timestamptz default now()
);
```

---

## 24. Demo Data

### Property 1

```text
Title:
2-bed Flat in Colchester

Location:
Colchester

Type:
Flat

Bedrooms:
2

Bathrooms:
1

Price:
£1,800 pcm

Availability:
Available

EPC:
B

Council Tax:
C

Parking:
Missing

Last Updated:
36 hours ago
```

### Property 2

```text
Title:
Studio near Manchester Piccadilly

Location:
Manchester

Type:
Studio

Bedrooms:
0

Bathrooms:
1

Price:
£1,150 pcm

Availability:
Available

EPC:
C

Council Tax:
B

Parking:
No parking

Last Updated:
3 hours ago
```

### Property 3

```text
Title:
3-bed House in Essex

Location:
Essex

Type:
House

Bedrooms:
3

Bathrooms:
2

Sale Price:
£385,000

Availability:
Available

Tenure:
Freehold

Parking:
Driveway

Last Updated:
8 hours ago
```

### Property 4

```text
Title:
1-bed Flat in Bristol City Centre

Location:
Bristol

Type:
Flat

Bedrooms:
1

Bathrooms:
1

Price:
£1,350 pcm

Availability:
Under offer

EPC:
Missing

Council Tax:
B

Parking:
Street parking

Last Updated:
18 hours ago
```

---

## 25. Demo Mesajları

### Message 1: Viewing + Availability + Parking

```text
Hi, is the 2-bed flat in Colchester still available?
Can I view it this Saturday?
Also, is parking included?
```

Beklenen AI sonucu:

* Intent: viewing_request, availability_question, parking_question
* Lead temperature: hot
* Matched property: 2-bed Flat in Colchester
* Missing field: parking_info
* Risk flag: availability_may_be_stale
* Suggested reply: dikkatli ve doğrulama içeren cevap
* Follow-up: parking ve Saturday viewing slot doğrulaması

---

### Message 2: Valuation Request

```text
Hi, I’m thinking about selling my 3-bed house in Essex. Could someone give me an estimated valuation or book a call with me?
```

Beklenen AI sonucu:

* Intent: valuation_request
* Customer type: seller
* Lead temperature: hot
* Suggested reply: valuation call ayarlama
* Follow-up: call scheduling
* CRM note: potential seller lead

---

### Message 3: Rental Search

```text
Hi, I’m looking for a 1-bed flat near Bristol city centre. My budget is around £1,350 pcm. Do you have anything available?
```

Beklenen AI sonucu:

* Intent: rental_search
* Customer type: tenant
* Location: Bristol
* Budget: 1350 pcm
* Matched property: Bristol flat
* Risk flag: property_under_offer
* Suggested reply: mevcut property under offer olduğu için alternatif sunma veya takip etme

---

### Message 4: Pricing Ambiguity

```text
My budget is about 500. Do you have any flats near Manchester?
```

Beklenen AI sonucu:

* Intent: rental_search
* Budget amount: 500
* Budget period: unknown
* Risk flag: pcm_pw_ambiguity
* Suggested reply: bütçenin weekly mi monthly mi olduğunu nazikçe sorma

---

## 26. Sayfa Yapısı

### 26.1. Landing Page

URL:

```text
/en
/tr
```

Amaç:

Ürünün ne olduğunu tek ekranda anlatmak.

İçerik:

```text
EstateOS Action Copilot

A lightweight AI assistant for UK estate agents that turns customer messages into verified next-best-action cards.

[Open Demo]
[Read Approach]
```

Kartlar:

```text
Understand Messages
Extract customer intent, urgency and property references.

Check Listings
Detect missing, stale or risky property information.

Prepare Actions
Generate reply drafts, CRM notes and follow-up tasks.

Daily Briefing
Summarise priorities at the start and end of the day.
```

---

### 26.2. Demo Dashboard

URL:

```text
/en/demo
/tr/demo
```

Ana ürün ekranı.

Bölümler:

* Daily Briefing panel
* Inbox list
* Message detail
* AI Action Card
* Property context
* Action buttons

---

### 26.3. Properties Page

URL:

```text
/en/properties
/tr/properties
```

Demo property kayıtlarını gösterir.

Her property için:

* Title
* Location
* Price
* Availability
* EPC
* Council Tax
* Parking
* Last updated
* Completeness status

---

### 26.4. Approach Page

URL:

```text
/en/approach
/tr/approach
```

Mini case’in dokümantasyon sayfası.

İçerik:

* Problem
* Proposed solution
* User flow
* Data needed
* Technical approach
* Risks
* Success metrics
* AI tools used
* Future improvements

---

## 27. Tasarım Dili

Ürün sade, premium ve operasyonel bir SaaS dashboard hissi vermelidir.

### Genel Stil

```text
Clean
Calm
Trustworthy
Operational
Minimal
Sharp
Readable
Enterprise-ready
```

### Kaçınılması Gerekenler

```text
Aşırı parlak AI moru
Oyunlaştırılmış UI
Gereksiz animasyon
Çok fazla gradient
Aşırı karmaşık dashboard
Chatbot hissi
Fazla teknik ekran
```

### İlham

```text
Linear
Attio
Raycast
Notion
Modern CRM dashboards
```

---

## 28. Light Mode Renkleri

```text
Background: #F8FAFC
Surface: #FFFFFF
Elevated Surface: #F1F5F9
Text Primary: #0F172A
Text Secondary: #64748B
Border: #E2E8F0
Primary: #0EA5E9
Primary Dark: #0284C7
Success: #16A34A
Warning: #F59E0B
Risk: #EF4444
```

---

## 29. Dark Mode Renkleri

```text
Background: #020617
Surface: #0F172A
Elevated Surface: #111827
Text Primary: #F8FAFC
Text Secondary: #94A3B8
Border: #1E293B
Primary: #38BDF8
Success: #22C55E
Warning: #FBBF24
Risk: #F87171
```

---

## 30. UI Bileşenleri

### Ana Bileşenler

```text
AppShell
Navbar
Sidebar
LanguageSwitcher
ThemeToggle
DailyBriefingPanel
InboxList
MessageDetailPanel
AIActionCard
PropertyContextCard
RiskBadge
IntentBadge
LeadTemperatureBadge
MetricCard
PropertyCard
ApproachSection
```

### Action Card UI Öncelikleri

* Kart çok kalabalık görünmemeli
* Intent ve riskler badge olarak gösterilmeli
* Suggested reply okunabilir bir text area gibi gösterilmeli
* Missing info ayrı renkle vurgulanmalı
* Follow-up action net olmalı
* En önemli aksiyon butonu görsel olarak öne çıkmalı

---

## 31. Dil Desteği

Ürün Türkçe ve İngilizce arayüz desteğine sahip olacaktır.

### Neden?

Mini case UK bağlamında olduğu için müşteri mesajları ve AI output İngilizce kalabilir. Ancak ürün geliştirici ve sunum tarafında Türkçe/İngilizce destek göstermesi profesyonel görünür.

### Yapı

```text
app/
  [locale]/
    page.tsx
    demo/
      page.tsx
    properties/
      page.tsx
    approach/
      page.tsx
```

### Dictionary Dosyaları

```text
src/i18n/dictionaries/en.ts
src/i18n/dictionaries/tr.ts
src/i18n/get-dictionary.ts
```

### Örnek Dictionary

```ts
export const en = {
  productName: "EstateOS Action Copilot",
  openDemo: "Open Demo",
  generateActionCard: "Generate AI Action Card",
  morningBrief: "Morning Brief",
  endOfDayRecap: "End-of-Day Recap",
};

export const tr = {
  productName: "EstateOS Action Copilot",
  openDemo: "Demoyu Aç",
  generateActionCard: "AI Aksiyon Kartı Oluştur",
  morningBrief: "Sabah Özeti",
  endOfDayRecap: "Gün Sonu Özeti",
};
```

---

## 32. Repo Yapısı

```text
estateos-action-copilot/
  app/
    [locale]/
      layout.tsx
      page.tsx
      demo/
        page.tsx
      properties/
        page.tsx
      approach/
        page.tsx
    api/
      analyze-message/
        route.ts
      briefing/
        route.ts

  components/
    app-shell.tsx
    navbar.tsx
    theme-toggle.tsx
    language-switcher.tsx
    daily-briefing-panel.tsx
    inbox-list.tsx
    message-detail-panel.tsx
    ai-action-card.tsx
    property-context-card.tsx
    property-card.tsx
    risk-badge.tsx
    intent-badge.tsx
    metric-card.tsx

  src/
    ai/
      gemini-client.ts
      prompts.ts
      schemas.ts
      estate-agent.ts
      daily-briefing.ts
      guardrails.ts

    db/
      supabase-client.ts
      supabase-server.ts
      queries.ts
      seed.ts

    i18n/
      dictionaries/
        en.ts
        tr.ts
      get-dictionary.ts

    types/
      index.ts

    utils/
      dates.ts
      confidence.ts
      formatting.ts

  supabase/
    schema.sql
    seed.sql

  public/
    screenshots/

  README.md
  .env.example
  package.json
  tailwind.config.ts
  next.config.ts
```

---

## 33. API Routes

### 33.1. Analyze Message

```text
POST /api/analyze-message
```

Request:

```json
{
  "messageId": "msg_123",
  "locale": "en"
}
```

Response:

```json
{
  "intent": ["viewing_request", "availability_question", "parking_question"],
  "customerType": "tenant",
  "leadTemperature": "hot",
  "matchedProperty": {
    "id": "property_123",
    "title": "2-bed Flat in Colchester"
  },
  "confidence": 0.86,
  "missingFields": ["parking_info"],
  "riskFlags": ["parking_info_missing", "availability_may_be_stale"],
  "suggestedReply": "Hi Sarah, thanks for your message...",
  "suggestedCrmNote": "Sarah asked about Saturday viewing and parking...",
  "suggestedFollowUp": "Confirm parking details and Saturday viewing slots today.",
  "suggestedListingAction": "Update parking information after verification."
}
```

---

### 33.2. Generate Briefing

```text
POST /api/briefing
```

Request:

```json
{
  "type": "morning",
  "locale": "en"
}
```

Response:

```json
{
  "title": "Morning Brief",
  "summary": "You have 3 hot leads, 4 follow-ups due and 2 listings with missing information.",
  "priorities": [
    "Reply to Sarah M. about Saturday viewing",
    "Confirm parking information for Colchester flat",
    "Follow up with James R. about valuation"
  ],
  "risks": [
    "Parking information missing",
    "Availability data older than 24 hours"
  ],
  "recommendedActions": [
    "Start with Sarah M. because she has high intent",
    "Update missing listing information before sending final details"
  ]
}
```

---

## 34. Başarı Metrikleri

Başarı yalnızca “AI cevap üretti mi?” üzerinden ölçülmemelidir.

### 34.1. Operasyonel Metrikler

* Ortalama ilk cevap süresi
* Mesaj başına harcanan manuel süre
* Günlük işlenen lead sayısı
* Oluşturulan follow-up sayısı
* Tamamlanan follow-up oranı

### 34.2. Kullanım Metrikleri

* AI Action Card generation count
* AI draft approval rate
* AI draft edit distance
* Regenerate rate
* Dismiss rate

### 34.3. Ticari Metrikler

* Viewing booking conversion rate
* Valuation appointment conversion rate
* Hot lead response rate
* Re-engaged lead count

### 34.4. Kalite ve Güvenlik Metrikleri

* Incorrect information incident count
* Missing listing info detection accuracy
* Agent usefulness score
* Customer satisfaction score
* Risk flag precision

### MVP İçin En Kritik 3 Metrik

```text
1. First response time reduction
2. AI draft acceptance rate
3. Follow-up completion rate
```

---

## 35. En Büyük Riskler ve Edge Case’ler

### 35.1. AI Halüsinasyonu

AI property datasında olmayan bilgileri uydurabilir.

Çözüm:

* Supabase data source of truth olarak kullanılır
* AI sadece verilen context ile cevap üretir
* Eksik alanlar açıkça missing info olarak gösterilir

---

### 35.2. Yanlış Property Eşleşmesi

Müşteri benzer özellikteki birden fazla ilandan bahsediyor olabilir.

Çözüm:

* Match confidence gösterilir
* Düşük confidence durumunda customer reply kilitlenir
* Agent’tan property seçmesi istenir

---

### 35.3. Eski Availability Bilgisi

İlan CRM’de available görünebilir fakat aslında değişmiş olabilir.

Çözüm:

* `last_updated_at` kontrol edilir
* 24 saatten eski bilgi risk flag olarak gösterilir
* Cevapta “currently showing as available” gibi dikkatli dil kullanılır

---

### 35.4. Eksik Listing Bilgisi

Parking, EPC, council tax, tenure veya service charge gibi bilgiler eksik olabilir.

Çözüm:

* Missing listing fields tespit edilir
* Suggested listing action üretilir
* AI eksik bilgiyi uydurmaz

---

### 35.5. UK Pricing Ambiguity

UK’de kira fiyatları pcm veya pw olabilir.

Örnek:

```text
My budget is 500.
```

Bu 500 pcm mi, 500 pw mi belirsizdir.

Çözüm:

* Budget period unknown olarak işaretlenir
* AI açıklık isteyen cevap taslağı üretir

---

### 35.6. Over-Automation Riski

Müşteriye tamamen otomatik cevap vermek güven riski oluşturabilir.

Çözüm:

* Human-in-the-loop
* Approve/Edit workflow
* MVP’de otomatik gönderim yok

---

### 35.7. GDPR ve Veri Gizliliği

Müşteri mesajları kişisel veri içerebilir.

Çözüm:

* Gereksiz PII AI promptlarına gönderilmez
* API key client tarafına sızdırılmaz
* Server-side AI route kullanılır
* Supabase RLS production aşamasında uygulanabilir

---

## 36. Security ve Deployment Notları

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

### Önemli Kurallar

* `GEMINI_API_KEY` client tarafında kullanılmaz
* `SUPABASE_SERVICE_ROLE_KEY` client tarafında kullanılmaz
* AI analizleri server route içinde çalışır
* Public client sadece anon key kullanır
* Production deploy Vercel üzerinde yapılır

---

## 37. AI Araçlarını Nasıl Kullandım?

Bu bölüm Iceberg Digital’in mailindeki özel beklentiye doğrudan cevap verir.

### İngilizce Versiyon

I used AI tools as a thinking and prototyping assistant, not as a replacement for my own judgement.

First, I used AI to break down the daily workflow of a UK estate agent and identify repetitive tasks around incoming messages, listing updates and follow-ups. Then I compared several possible feature ideas based on impact, feasibility, risk and relevance to Iceberg Digital’s AI-driven operating system direction.

After selecting the EstateOS Action Copilot concept, I used AI to refine the user flow, identify edge cases, generate initial pseudo-code and structure the technical approach. I reviewed and adjusted the outputs myself, especially around human approval, hallucination risk, stale property data, missing listing information and CRM data quality.

I intentionally avoided over-engineering. Instead of using a complex agent framework, I designed a simple TypeScript-based AI workflow powered by Gemini, Supabase and human-in-the-loop approval.

### Türkçe Versiyon

AI araçlarını kendi düşüncemi ikame etmek için değil, analiz ve prototipleme sürecini hızlandıran bir yardımcı olarak kullandım.

İlk olarak bir UK emlak danışmanının günlük iş akışını; gelen müşteri mesajları, ilan güncellemeleri ve follow-up süreçleri üzerinden parçalara ayırmak için AI’dan destek aldım. Ardından farklı özellik fikirlerini etki, uygulanabilirlik, risk ve Iceberg Digital’in AI odaklı operasyon sistemi yaklaşımına uygunluk açısından karşılaştırdım.

EstateOS Action Copilot fikrini seçtikten sonra kullanıcı akışını, edge case’leri, pseudo-code yapısını ve teknik mimariyi netleştirmek için AI kullandım. Ancak özellikle human approval, hallucination riski, eski property verisi, eksik ilan bilgisi ve CRM veri kalitesi gibi alanları kendi değerlendirmemle yeniden düzenledim.

Bilerek over-engineering’den kaçındım. Karmaşık bir agent framework kullanmak yerine Gemini, Supabase ve TypeScript tabanlı sade bir AI workflow tasarladım.

---

## 38. Ürünün Mini Case İsterlerini Karşılama Şekli

| Mini Case İsteri                      | EstateOS Action Copilot Karşılığı                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| Hangi problemi çözüyorsun?            | Estate agent’ın gelen mesaj, listing kontrolü ve follow-up karmaşasını çözüyor              |
| Kullanıcı bu özelliği nasıl kullanır? | Inbox içinden mesaj seçer, AI Action Card üretir, reply/CRM/follow-up aksiyonlarını onaylar |
| Hangi verilere ihtiyaç olur?          | Messages, leads, properties, listing fields, follow-up state, briefing context              |
| Teknik olarak nasıl yaklaşırsın?      | Next.js, Supabase, Gemini, TypeScript AI workflow, structured output, guardrails            |
| Riskler ve edge case’ler              | Hallucination, stale data, wrong match, missing listing info, pricing ambiguity, GDPR       |
| Başarıyı nasıl ölçersin?              | Response time, draft acceptance, follow-up completion, conversion, risk detection           |
| AI araçlarını nasıl kullandın?        | Problem analizi, fikir karşılaştırma, edge case üretimi, teknik yapılandırma, ürün rafinesi |

---

## 39. Future Improvements

MVP sonrasında şu özellikler eklenebilir:

* Gerçek email inbox entegrasyonu
* Rightmove / Zoopla lead entegrasyonu
* Calendar booking entegrasyonu
* Otomatik sabah briefing email’i
* Otomatik gün sonu recap email’i
* Team dashboard
* Branch manager view
* Lead scoring history
* Weekly performance summary
* CRM write-back entegrasyonu
* Agent tone-of-voice training
* Notification sistemi
* RLS ve multi-tenant agency support

---

## 40. Final Ürün Pozisyonu

EstateOS Action Copilot küçük ama gerçek bir üründür.

Bu ürün:

* AI chatbot değildir
* Full CRM değildir
* Gereksiz karmaşık agent sistemi değildir
* Sadece UI mockup değildir

Bu ürün:

* Gelen müşteri mesajını anlar
* İlgili property/listing verisiyle eşleştirir
* Eksik veya riskli ilan bilgisini yakalar
* Müşteriye cevap taslağı üretir
* CRM notu ve follow-up görevi önerir
* Sabah ve gün sonunda operasyonel briefing sağlar
* Estate agent’ın günlük iş akışına doğrudan dokunur

Ana fikir:

> EstateOS Action Copilot, UK emlak danışmanının inbox, listing ve follow-up karmaşasını tek bir AI destekli aksiyon katmanında birleştirir.

```
```
