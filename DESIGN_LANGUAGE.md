# 🧊 Iceberg Digital — Tasarım Dili Analizi
> **Kaynak:** https://iceberg-digital.co.uk/  
> **Analiz Tarihi:** 16 Mayıs 2026

---

## 1. Genel Tasarım Felsefesi

Iceberg Digital, **"AI-native SaaS"** estetiğini benimseyen, kurumsal ama dinamik bir tasarım dili kullanmaktadır. Tasarımın genel ruhu şöyle özetlenebilir:

- **Dual-mode kontrast:** Siyah bölümler (`#000000`) ile açık gri bölümler (`#F0F0F5` tonları) düzenli olarak birbirini takip eder. Bu "zebra" geçişi hem ritim hem de dikkat yönetimi sağlar.
- **Tek vurgu rengi:** Tüm site boyunca yalnızca **bir** accent renk kullanılır — parlak magenta/pembe. Bu kural hiç bozulmaz.
- **Büyük, cesur tipografi:** Başlıklar son derece iri ve kalın yazılır; metin hiyerarşisi güçlüdür.
- **Ferahlık (whitespace):** Bölümler arası büyük boşluklar sayfaya nefes aldırır.
- **Pill-shape butonlar:** Tüm butonlar tam yuvarlak kenarlıdır (pill/capsule form).

---

## 2. Renk Paleti

### 2.1 Ana Renkler

| Rol | Renk | Değer |
|-----|------|-------|
| **Primary Accent** (Butonlar, vurgular, chatbot) | Magenta / Hot Pink | `#E6007E` |
| **Background — Koyu** (Hero dark, siyah bölümler) | Tam Siyah | `#000000` |
| **Background — Açık** (İçerik bölümleri) | Çok açık gri-mavi | `#EEEEF3` / `#F0F0F5` |
| **Background — Kart** (Özellik kartları) | Hafif gri beyaz | `#F5F5F5` |
| **Background — Açık Bölüm** (Bazı section'lar) | Saf beyaz | `#FFFFFF` |
| **Metin — Koyu arka plan üzeri** | Beyaz | `#FFFFFF` |
| **Metin — Açık arka plan üzeri (Başlık)** | Tam siyah | `#000000` |
| **Metin — Açık arka plan üzeri (Body)** | Koyu gri | `#1A1A1A` / `#222222` |

### 2.2 Accent Gradient (Hero bölüm büyük başlık)

Hero bölümünde büyük başlık metni (örn. "Singularity.") bir **pembe → mor gradient** ile render edilir:
```
background: linear-gradient(to right, #E6007E, #9B59B6);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### 2.3 Renk Kullanım Kuralları

- Butonlar **her zaman** `#E6007E` (magenta) zemin üzerine beyaz yazı
- "Book a call" gibi ikincil CTA'lar beyaz zemin + siyah yazı + siyah border (outline pill button)
- "Watch it now" gibi bazı bağlamsal butonlar beyaz/şeffaf zemin + siyah yazı
- Footer tamamen siyah (`#000000`) zemin üzerine beyaz metin
- Siyah section'larda beyaz metin; açık section'larda siyah metin

---

## 3. Tipografi

### 3.1 Font Ailesi

```
font-family: 'Montserrat', sans-serif;
```

Tüm site boyunca **yalnızca Montserrat** kullanılır. Başka bir font ailesi yoktur.

### 3.2 Başlık Hiyerarşisi

| Element | Weight | Boyut (tahmini) | Özellik |
|---------|--------|-----------------|---------|
| **H1 / Hero Başlık** | ExtraBold (800) | ~56–72px | Merkez hizalı, çok satırlı |
| **H2 / Bölüm Başlığı** | Bold (700) | ~42–52px | Sol hizalı veya merkez |
| **H3 / Alt Başlık (Kart başlıkları)** | Bold (700) | ~22–28px | Sol hizalı |
| **Nav Linkleri** | Medium (500) | ~15–16px | Normal tracking |
| **Body Text** | Regular (400) | ~16–18px | Uzun paragraflar, merkez veya sol |
| **Button Text** | Bold (700) | ~14–15px | Uppercase yok, title case |
| **Caption/Small** | Regular (400) | ~13–14px | Logo altı tagline |

### 3.3 Tipografik Özellikler

- **Letter-spacing:** Genel olarak normal; başlıklarda negatif letter-spacing (`-0.02em`) uygulanıyor gibi görünüyor
- **Line-height:** Başlıklarda ~1.1–1.2; body'de ~1.6–1.7
- **Text-align:** Hero başlık merkez hizalı; feature section'lar sol hizalı; body paragraflar bazı bölümlerde merkez
- **Text Transform:** Butonlarda `capitalize` (ilk harf büyük, title case) — kesinlikle `uppercase` yok

---

## 4. Layout & Grid Sistemi

### 4.1 Genel Container

```css
max-width: ~1280px;
margin: 0 auto;
padding: 0 40px; /* yanlardan gutter */
```

### 4.2 Bölüm Yapısı

Site aşağıdaki tekrarlayan yapıyı kullanır:

```
[Siyah Section] → [Açık Gri Section] → [Siyah Section] → [Açık Gri Section] → ...
```

Her bölüm genellikle:
- Tam viewport genişliği (full-bleed background)
- Dikey padding: ~`80px 0` ile `120px 0` arasında

### 4.3 Grid Düzenleri

| Düzen | Kullanıldığı Yer |
|-------|-----------------|
| **Tekli sütun (centred)** | Hero, bölüm başlıkları, CTA'lar |
| **2 sütun (50/50 split)** | Sol metin + Sağ görsel (Ecosystem, case study bölümleri) |
| **3 sütun (equal)** | Özellik kartları (feature cards) bölümü |
| **Full-width centred list** | FAQ (accordion) bölümü |

### 4.4 Spacing Sistemi (Tahmini )
 
```
4px  — Çok küçük boşluklar
8px  — İkon-metin arası
16px — Satır arası, küçük padding
24px — Kart içi padding
32px — Orta padding
48px — Bölüm iç padding (küçük)
80px — Bölümler arası dikey boşluk
120px — Büyük bölümler arası
```

---

## 5. Navigasyon (Header)

### 5.1 Yapı

```
[Logo] ←————————— NAV ITEMS ——————————→ [Book a Call CTA]
```

Navigasyon barı sayfanın üstünde **yüzen / floating** bir kapsayıcı içinde yer alır:

```css
background: #000000;
border-radius: 24px–32px; /* Pill-shaped container */
padding: 16px 32px;
margin: 16px auto; /* Sayfa kenarlarından içeride */
max-width: ~1200px;
```

### 5.2 Logo

- Metin tabanlı logo: **"iceberg"** (küçük harf, beyaz) + **"digital"** (küçük, gri tonlu) + pembe nokta/vurgu
- Altında küçük tagline: *"The AI Operating System for Estate Agency"* (~12px, gri/beyaz)

### 5.3 Nav Linkleri

- Renk: Beyaz (`#FFFFFF`)
- Weight: Medium (500)
- Hover: Muhtemelen opacity değişimi veya pembe alt çizgi
- "Resources" linkinde dropdown (`▾` oku ile)

### 5.4 CTA Butonu (Nav)

```css
/* "Book a call" — Outline/Ghost Style */
background: #FFFFFF;
color: #000000;
border: 2px solid #FFFFFF;
border-radius: 100px; /* Full pill */
padding: 10px 24px;
font-weight: 700;
```

---

## 6. Buton Sistemi

Sitede **3 farklı buton varyantı** kullanılır:

### Variant 1: Primary (Magenta Filled)
```css
background: #E6007E;
color: #FFFFFF;
border: none;
border-radius: 100px;    /* Full pill */
padding: 16px 32px;
font-family: 'Montserrat', sans-serif;
font-weight: 700;
font-size: 15px;
cursor: pointer;
```
> **Örnekler:** "Find Out More", "Book your free discovery call", "Get the Ebook", "Iceberg AI: Ask Us Anything"

### Variant 2: Secondary / Ghost (Beyaz Outline)
```css
background: #FFFFFF;
color: #000000;
border: 2px solid #000000; /* veya siyah zemin üzerinde beyaz border */
border-radius: 100px;
padding: 12px 28px;
font-weight: 700;
font-size: 14px;
```
> **Örnekler:** "Watch it now", "Read it now", "Book a call" (nav'daki)

### Variant 3: Floating CTA Widget
```css
/* Sağ alt köşede sabit duran chatbot CTA */
background: #E6007E;
color: #FFFFFF;
border-radius: 100px;
padding: 12px 20px;
position: fixed;
bottom: 24px;
right: 80px;
font-weight: 700;
font-size: 13px;
box-shadow: 0 4px 20px rgba(230, 0, 126, 0.4);
```

---

## 7. Kart Tasarımı (Feature Cards)

3 sütunlu özellik kartları şu stile sahiptir:

```css
background: #F5F5F5; /* veya beyaz */
border-radius: 16px–20px;
padding: 32px 28px;
border: none; /* kenarlık yok */
box-shadow: none; /* gölge yok — flat card */
```

- Başlık: Bold, ~22px, siyah
- Body: Regular, ~15–16px, koyu gri
- Kart içinde herhangi bir görsel/ikon YOK — saf metin kartları
- Kartlar arası gap: ~24px

---

## 8. Accordion (FAQ) Bölümü

```css
/* Her accordion item */
background: #F5F5F5;
border-radius: 16px;
padding: 28px 32px;
margin-bottom: 12px;
cursor: pointer;
```

- Soldaki `+` ikonu siyah, hafif bold
- Metin: Bold, ~16px, siyah
- Expand olduğunda `+` → `-` dönüşümü
- İçerik genişliği: ~800px, merkez hizalı

---

## 9. Görsel Kullanımı

### 9.1 Hero Section Görseli

- Hero'nun alt kısmında **full-width** bir 3D/cinematic render yerleşir
- AI robotu, insan figürü, galaktik/nebula arka planı
- Magenta/pembe ışık efektleri ile zenginleştirilmiş
- Görsel stil: **Dark cinematic, fotorealistik AI render**

### 9.2 Ecosystem Görseli

- 3D istifleme kuleleri (Lifesycle, Predict, Neuron, Uzair)
- Arka plan: Beyaz/açık + teknik çizim (blueprint) overlay
- Magenta renkli beyin ikonu en tepede

### 9.3 Case Study Görseli

- Gerçek fotoğraf (müşteri ekibi)
- Aspect ratio: ~16:10
- Border-radius: ~16px
- Çerçeve/overlay YOK — doğal fotoğraf

### 9.4 Video Kartları

```css
background: #000000;
border-radius: 16px–20px;
aspect-ratio: 16/9;
overflow: hidden;
```

---

## 10. Karanlık (Dark) Bölümler

Siyah arka planlı bölümlerin tipik yapısı:

```
[Koyu bölüm başlığı: pembe gradient metin]
[Alt metin: beyaz, regular weight]
[CTA: magenta filled buton] + [Ghost buton: beyaz border]
```

Bazı siyah bölümlerde sol/sağ kenarlardan soluk **mavi/mor ışık hızması (glow)** efekti bulunur:
```css
/* Kenar efekti */
box-shadow: inset -200px 0 300px rgba(100, 50, 200, 0.15),
            inset  200px 0 300px rgba(100, 50, 200, 0.15);
```

---

## 11. Animasyon & Geçişler

| Animasyon | Detay |
|-----------|-------|
| **Scroll-based entrance** | Bölümler kaydırıldıkça fade-in + slight translateY yukarı kayma |
| **Buton hover** | Background rengi koyulaşır (~10%), hafif scale transform (`scale(1.02)`) |
| **Nav hover** | Opacity veya renk geçişi, 200ms ease |
| **Accordion open/close** | Height animasyonu, ~300ms ease |
| **Floating CTA** | Muhtemelen pulsing/breathing glow efekti |
| **Hero görsel** | Sayfa ilk yüklendiğinde fade-in veya parallax kaydırma |

---

## 12. Footer

```css
background: #000000;
color: #FFFFFF;
padding: 60px 40px;
```

Footer yapısı:
- **Üst satır:** Logo + bağlantı sütunları (Ürünler, Şirket, Kaynaklar, İletişim)
- **Alt satır:** Copyright, Privacy Policy, Terms of Use
- Font: Montserrat, regular, ~14px, beyaz/gri
- Link rengi: Beyaz/açık gri, hover'da daha parlak

---

## 13. Floating UI Elementleri

### Chatbot Widget
```
Sağ alt: [Iceberg AI: Ask Us Anything] → Magenta pill button
Yanında: Siyah yuvarlak ikon (chat bubble)
```

---

## 14. CSS Değişkenleri (Önerilen Token Sistemi)

Tasarımdan çıkarılacak CSS token önerileri:

```css
:root {
  /* Renkler */
  --color-accent:       #E6007E;
  --color-accent-dark:  #C4006A; /* hover state */
  --color-black:        #000000;
  --color-white:        #FFFFFF;
  --color-bg-light:     #EEEEF3;
  --color-bg-card:      #F5F5F5;
  --color-text-dark:    #1A1A1A;
  --color-text-muted:   #666666;

  /* Tipografi */
  --font-primary:       'Montserrat', sans-serif;
  --font-weight-regular: 400;
  --font-weight-medium:  500;
  --font-weight-bold:    700;
  --font-weight-extrabold: 800;

  /* Border Radius */
  --radius-pill:        100px;
  --radius-card:        16px;
  --radius-nav:         28px;

  /* Spacing */
  --spacing-xs:   8px;
  --spacing-sm:   16px;
  --spacing-md:   24px;
  --spacing-lg:   48px;
  --spacing-xl:   80px;
  --spacing-2xl:  120px;

  /* Container */
  --container-max-width: 1280px;
  --container-padding:   40px;
}
```

---

## 15. Bölüm Sırası (Sayfa Yapısı)

```
1. [KOYU]  Floating Nav Bar (siyah, pill-shaped)
2. [AÇIK]  Hero: Büyük başlık + body + CTA butonu
3. [KOYU]  Keynote/Video tanıtım bölümü (3D AI görseli)
4. [AÇIK]  "Estate Agency is Still Being Run Like 2005" (metin + video kart)
5. [AÇIK]  "Not Software. An Operating System." (metin + video kart)
6. [AÇIK]  "The Singularity." (büyük gradient başlık + 2 CTA)
7. [AÇIK]  3 Feature Card (AI Prospecting, Marketing, CRM)
8. [AÇIK]  Ecosystem görseli (sol metin + sağ 3D görsel)
9. [KOYU]  Müşteri videoları (3'lü grid)
10.[AÇIK]  Case Study (sol metin + sağ fotoğraf)
11.[KOYU]  İkinci video/tanıtım bölümü
12.[AÇIK]  "Find Out How Lifesycle Increases Revenue" + eBook CTA
13.[KOYU]  İçerik/makale bloğu (siyah arka plan)
14.[AÇIK]  "What Comes After CRM?" makale CTA
15.[AÇIK]  FAQ Accordion
16.[KOYU]  Footer
```

---

## 16. Tasarım Dili Özeti

| Özellik | Değer |
|---------|-------|
| **Genel Ton** | Premium, AI-native, kurumsal ama cesur |
| **Renk Felsefesi** | Siyah + açık gri zemin, TEK magenta accent |
| **Font** | Montserrat (tek font) |
| **Buton Formu** | Full pill (100px border-radius) |
| **Kart Formu** | 16–20px border-radius, flat (gölgesiz) |
| **Nav Formu** | Floating pill container |
| **Animasyon** | Scroll-triggered fade-in, subtle hover |
| **Görsel Dili** | Cinematic 3D AI render + gerçek fotoğraf |
| **Boşluk Felsefesi** | Çok ferah, bol whitespace |
| **İçerik Yapısı** | Koyu–açık zebra section geçişi |
