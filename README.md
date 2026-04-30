# Nevvmedia Yönetim Paneli

Nevvmedia ajansı için **müşteri (CRM)**, **görev/talep takibi**, **fatura/teklif/sözleşme** yönetimi ve **dosya** depolaması içeren modern, mobil-uyumlu, Türkçe self-hosted yönetim sistemi.

## Özellikler

### Faz 1 — MVP (mevcut sürüm)

- 🔐 **Kimlik doğrulama**: NextAuth.js v5 + bcrypt, 2 rol (Yönetici / Çalışan)
- 👥 **Müşteri / Marka Yönetimi**: tam CRM kayıtları (iletişim, vergi, sektör, durum)
- 🧑‍🤝‍🧑 **Çoklu atama**: bir çalışan birden çok müşteriye atanabilir, çalışan yalnızca atandıklarını görür
- 📋 **Görev / Talep takibi**: Kanban + liste görünümü, sürükle-bırak ile durum değiştirme
- 💬 **Görev yorumları**: ekip içi tartışma
- 📄 **Teklif yönetimi**: durum akışı (Taslak → Gönderildi → Kabul/Red)
- ✍️ **Sözleşme kayıt sistemi**: dosya bağlama, tarih ve tutar takibi
- 🧾 **Fatura takibi**: dönem/tutar/durum, toplam-tahsil-bekleyen-geciken özetleri
- 📎 **Dosya yükleme**: müşteri bazlı veya görev bazlı, KVKK uyumlu indirme
- 📊 **Dashboard**: hızlı bakış kartları, yaklaşan görevler, son aktiviteler
- 📱 **Mobil uyumlu** modern arayüz (Tailwind v4 + shadcn/ui)
- 🇹🇷 Türkçe, TL para birimi
- 🐳 **Coolify-uyumlu** Docker Compose

### Faz 2 — Yol Haritası
- Satış hunisi (Lead → Prospect → Active → Lost) detay raporları
- Aylık/yıllık raporlar ve grafikler
- Müşteri dosyası export (PDF özet)

### Faz 3 — Yol Haritası
- **Evolution API** üzerinden WhatsApp bildirimleri
  - Vade yaklaşan fatura uyarısı
  - Görev atama bildirimi
  - Yeni teklif oluşturma bildirimi
- Otomatik hatırlatma cron'u

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Web | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui (Radix) |
| ORM | Prisma 6 |
| Veritabanı | PostgreSQL 16 |
| Kimlik doğrulama | NextAuth.js v5 (Auth.js) — Credentials + JWT |
| Form & doğrulama | react-hook-form + Zod |
| İkonlar | lucide-react |
| Bildirim | sonner (toast) |
| Deploy | Docker Compose / Coolify |

## Hızlı Başlangıç (Geliştirme)

### Gereksinimler

- Node.js 22+ (Node 20 de çalışır)
- PostgreSQL 14+ (Docker ile kurmak en kolay yol)
- npm 10+

### 1. Bağımlılıkları kurun

```bash
npm install
```

### 2. PostgreSQL'i ayağa kaldırın (Docker varsa)

```bash
docker run --name nevvmedia-pg \
  -e POSTGRES_USER=nevvmedia \
  -e POSTGRES_PASSWORD=nevvmedia_dev \
  -e POSTGRES_DB=nevvmedia_yonetim \
  -p 5432:5432 -d postgres:16-alpine
```

### 3. `.env` dosyasını oluşturun

`.env.example` dosyasını `.env` olarak kopyalayın. **AUTH_SECRET** için güçlü bir rastgele değer üretin:

```bash
# Linux / macOS
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 4. Veritabanı şemasını uygulayın

```bash
npx prisma migrate dev --name init
```

### 5. İlk yönetici hesabını oluşturun

```bash
npm run db:seed
```

> Varsayılan: `info@nevvmedia.com` / `Nevvmedia2026!`
> İsterseniz `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` ortam değişkenleri ile özelleştirin.

### 6. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) → giriş sayfasına yönlendirir.

## Üretim — Coolify Deploy

### Yöntem 1: Docker Compose ile (kendi PostgreSQL'i içerir)

1. Coolify'da yeni **Resource → Docker Compose** seçin
2. Repository'yi bağlayın, branch: `main`
3. **Environment variables** sekmesinde aşağıdaki değişkenleri tanımlayın:

   ```
   DB_PASSWORD=guclu-bir-parola
   AUTH_SECRET=<openssl rand -base64 32 ile uretin>
   NEXTAUTH_URL=https://panel.nevvmedia.com
   APP_URL=https://panel.nevvmedia.com
   APP_NAME=Nevvmedia Yönetim
   SEED_ADMIN_EMAIL=info@nevvmedia.com
   SEED_ADMIN_PASSWORD=ilk-girisle-degistirin
   SEED_ADMIN_NAME=Nevvmedia Yönetici
   MAX_UPLOAD_SIZE_MB=25
   ```

4. **Domain** kısmında alt alanı (`panel.nevvmedia.com`) belirleyin → Coolify SSL'i otomatik halleder.
5. **Persistent storage**: `uploads` ve `pgdata` adlı volume'lar otomatik oluşturulur.
6. **Deploy** edin.

İlk deploy bittiğinde uygulama:
- `migrate deploy` ile şemayı otomatik uygular
- Seed ile admin hesabını otomatik oluşturur
- `panel.nevvmedia.com` üzerinden çalışır

### Yöntem 2: Dockerfile + ayrı yönetilen PostgreSQL

1. Coolify'da **Resource → Application → Dockerfile** ekleyin
2. Coolify'ın kendi **PostgreSQL** servisini ekleyin (`Resource → Database → PostgreSQL`)
3. Aynı stack'in environment variables'ında `DATABASE_URL` olarak Coolify'ın verdiği iç bağlantı URL'sini girin
4. Yöntem 1'deki diğer değişkenleri ekleyin

### Persistent volume ayarı (Coolify)

`Application → Storages → Add Storage`:

| Mount path | Volume |
|---|---|
| `/data/uploads` | `nevvmedia-uploads` |

Bu sayede yüklenen dosyalar yeniden deploylar arasında korunur.

## Evolution API (WhatsApp) — Faz 3 Hazırlığı

`.env` dosyanıza:

```
EVOLUTION_API_URL=https://evolution.nevvmedia.com
EVOLUTION_API_KEY=<api-key>
EVOLUTION_INSTANCE=<instance-adi>
```

Bu değerler ayarlandığında **Ayarlar** sayfasında "Yapılandırıldı" olarak görünür. Faz 3'te otomatik bildirim gönderimi entegre edilecek.

## Klasör Yapısı

```
src/
├── app/
│   ├── (app)/                  # Korumalı sayfalar
│   │   ├── layout.tsx          # AppShell wrapper (auth + sidebar)
│   │   ├── dashboard/
│   │   ├── musteriler/
│   │   ├── gorevler/
│   │   ├── faturalar/
│   │   ├── teklifler/
│   │   ├── sozlesmeler/
│   │   ├── kullanicilar/       # Sadece admin
│   │   ├── ayarlar/            # Sadece admin
│   │   └── profil/
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth handlers
│   │   └── dosyalar/[id]/      # Yetkilendirilmiş dosya indirme
│   ├── giris/                  # Login sayfası
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # / → /dashboard yönlendirme
├── auth.ts                     # NextAuth setup
├── auth.config.ts              # Auth ortak konfigürasyonu (proxy için)
├── proxy.ts                    # Route koruması (Next 16: middleware → proxy)
├── components/
│   ├── auth/                   # Login form
│   ├── common/                 # PageHeader, EmptyState
│   ├── customers/              # Müşteri formu, badge, atama, aksiyonlar
│   ├── tasks/                  # Kanban, liste, form, yorumlar
│   ├── invoices/               # Fatura listesi + form
│   ├── quotes/                 # Teklif listesi + form
│   ├── contracts/              # Sözleşme listesi + form
│   ├── files/                  # Yükleyici + liste
│   ├── users/                  # Kullanıcı formu + profil formu
│   ├── dashboard/              # Stat kartı
│   ├── layout/                 # Sidebar, topbar, AppShell
│   └── ui/                     # shadcn/ui bileşenleri
├── lib/
│   ├── actions/                # Server actions (her domain için)
│   ├── validations/            # Zod şemaları
│   ├── prisma.ts               # Prisma client singleton
│   ├── password.ts             # bcrypt yardımcıları
│   ├── auth-helpers.ts         # requireUser/Admin
│   ├── nav.ts                  # Sidebar navigation
│   └── utils.ts                # cn, formatTRY, formatDate, getInitials
└── types/
    └── next-auth.d.ts          # Session tipi genişletmeleri

prisma/
├── schema.prisma
└── seed.ts
```

## Komutlar

```bash
npm run dev            # Geliştirme sunucusu
npm run build          # Üretim build (Prisma generate + Next build)
npm run start          # Üretim sunucusu
npm run db:migrate     # Migration oluştur ve uygula (geliştirme)
npm run db:deploy      # Üretimde migration uygula
npm run db:push        # Şemayı migration'sız uygula (hızlı prototip)
npm run db:seed        # Admin kullanıcı oluştur
npm run db:studio      # Prisma Studio (görsel DB editörü)
```

## Güvenlik Notları

- `AUTH_SECRET` mutlaka 32+ karakter rastgele olsun ve git'e işlenmesin
- İlk admin şifresini ilk girişten sonra değiştirin
- Üretimde `NEXTAUTH_URL` HTTPS olmalı
- Dosya indirmeleri yetkilendirilmiştir (`/api/dosyalar/[id]`); sadece admin veya atanmış çalışan erişebilir
- Şifreler bcrypt (12 round) ile hash'lenir
- KVKK: çalışan bilgisayar başı izleme bilinçli olarak yapılmamıştır

## Lisans

Özel — Nevvmedia için geliştirilmiştir.
