# Nevvmedia Yönetim Paneli — Claude Code Notları

Bu dosya yeni Claude Code oturumlarında otomatik yüklenir. Projeye buradan devam edilir.

## Proje nedir

Nevvmedia ajansı için **müşteri (CRM) + görev/talep + fatura/teklif/sözleşme + dosya yönetimi** paneli. Türkçe arayüz, mobil uyumlu, self-hosted. **Faz 1 MVP tamamlandı ve canlıda çalışıyor.**

- **Canlı:** https://panel.nevvmedia.com (Coolify üzerinde, kullanıcının kendi VPS'i)
- **Repo:** https://github.com/ogzmusic54-svg/nevvmedia_yonetim
- **Sahibi:** Nevvmedia (info@nevvmedia.com)

## Teknoloji yığını (sabit)

- **Next.js 16** (App Router) + **TypeScript 5** + **Tailwind v4** + **shadcn/ui** (new-york / slate)
- **Prisma 6** + **PostgreSQL 16** (Prisma 7'ye geçilmedi — Auth.js adapter uyumsuzluğu)
- **NextAuth.js v5 beta** — credentials + JWT (no adapter, M2M yok)
- **bcryptjs** (12 round)
- **Docker Compose** → Coolify deploy
- **Next.js 16 değişikliği:** `middleware.ts` yerine `src/proxy.ts` kullanılıyor

## Kritik dosyalar

| Dosya | Görevi |
|---|---|
| `prisma/schema.prisma` | Tüm veri modeli (User, Customer, Task, Invoice, Quote, Contract, File, ActivityLog) |
| `src/auth.ts` + `src/auth.config.ts` | NextAuth setup (config'i Edge için ayrı) |
| `src/proxy.ts` | Route koruma (eski middleware) |
| `src/lib/actions/` | Tüm server actions (her domain için ayrı dosya) |
| `src/lib/validations/` | Zod şemaları |
| `src/components/layout/app-shell.tsx` | Sidebar + topbar wrapper |
| `Dockerfile` + `scripts/start.sh` | Multi-stage build, açılışta `prisma db push` + seed |
| `docker-compose.yml` | Coolify-uyumlu (service: `nevvmedia-app`, `nevvmedia-postgres`) |

## Mimarinin kritik kuralları

1. **Roller:** SADECE `ADMIN` ve `EMPLOYEE`. Ara rol eklemek istersen kullanıcıya sor.
2. **Yetki:** Çalışan sadece kendisine atanmış müşterileri görür (`CustomerAssignment` üzerinden). `requireUser()` / `requireAdmin()` helper'ı `src/lib/auth-helpers.ts` içinde.
3. **Para birimi:** Sadece TL (`formatTRY` `src/lib/utils.ts`).
4. **Çalışan bilgisayar başı izleme:** KASITLI olarak yapılmadı (KVKK). Eklemek istemezsek bile kullanıcı isterse uyar.
5. **Activity log:** Her server action sonunda `prisma.activityLog.create()` ile kayıt at — dashboard'da gösteriliyor.
6. **Dosya indirme yetkisi:** `/api/dosyalar/[id]/route.ts` — admin veya atanmış çalışan kontrolü var.

## Komutlar

```bash
npm run dev            # Geliştirme (lokal Postgres lazım)
npm run build          # Build kontrolü
npm run db:migrate     # Migration üret + uygula (lokalde)
npm run db:seed        # Admin oluştur
npm run db:studio      # Prisma Studio
```

## Deploy akışı (kullanıcı için)

1. Lokal değişiklik yap
2. `git add . && git commit -m "..." && git push`
3. Coolify'da **Redeploy** butonuna bas
4. Açılışta `start.sh` otomatik:
   - Migration varsa `migrate deploy`, yoksa `db push --skip-generate`
   - Seed (admin yoksa oluşturur)
   - `node server.js` (Next.js standalone)

**Önemli:** Schema'yı değiştirdikten sonra LOKALDE migration üretmek istersek `npx prisma migrate dev --name <isim>` çalıştır. Bu `prisma/migrations/` altına dosya ekler. Push edince Coolify `migrate deploy` ile uygular. Migration olmadan `db push` da işe yarıyor ama veri kaybı riski var (production'da migration daha güvenli).

## Yapılmayan / Yol haritası

### Faz 2 (henüz başlanmadı)
- Satış hunisi raporları (Lead → Prospect → Active → Lost dağılımı, dönüşüm oranı)
- Aylık/yıllık fatura, görev, müşteri grafikleri (Recharts veya benzeri)
- Müşteri özet PDF export (puppeteer veya react-pdf)

### Faz 3 (henüz başlanmadı)
- **Evolution API WhatsApp entegrasyonu** — kullanıcının kendi self-hosted Evolution API'si var
  - Vade yaklaşan fatura uyarısı (cron)
  - Görev atama bildirimi (gerçek zamanlı)
  - Yeni teklif/sözleşme bildirimi
- Cron için `node-cron` veya Coolify'ın scheduled tasks özelliği
- Env: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` (Ayarlar sayfasında durum gözüküyor)
- Evolution API endpoint: `POST /message/sendText/{instance}` body: `{ number, text }`

### Bilinen iyileştirmeler (low priority)
- E-posta bildirimleri eklenmedi — kullanıcı WhatsApp'a karar verdi, e-posta gerek yok
- Repo şu an public — istenirse Coolify'a Deploy Key kurup tekrar private'a alınabilir
- DB_PASSWORD `change_me_in_env` varsayılanında — değiştirmek için postgres volume sıfırlanmalı, sonra DB_PASSWORD env'i güncellenip redeploy

## Yeni özellik eklerken pattern

1. **Şema:** `prisma/schema.prisma`'ya model/alan ekle
2. **Lokalde** `npx prisma migrate dev --name <ad>` (migration dosyası üretsin)
3. **Validation:** `src/lib/validations/<domain>.ts` (Zod)
4. **Server action:** `src/lib/actions/<domain>.ts` (`assertSession`/`assertAdmin` ile başla, sonunda `revalidatePath`)
5. **UI:** `src/components/<domain>/...` (form-dialog, list/kanban, badge)
6. **Sayfa:** `src/app/(app)/<rota>/page.tsx` (server component, prisma sorgusu try/catch içinde)
7. **Activity log:** action içinde `prisma.activityLog.create()`
8. **Sidebar nav:** gerekirse `src/lib/nav.ts`'e ekle

## Stil ve dil kuralları

- Tüm UI metni **Türkçe**, KOD (değişken/fonksiyon/component adları) **İngilizce**
- shadcn/ui bileşenlerini direkt kullan, üzerine yeni primitive yazma
- `cn()` helper'ını her className birleştirmesinde kullan
- Tarih: `formatDate` / `formatDateTime`, para: `formatTRY` (`src/lib/utils.ts`)
- Toast: `sonner`'dan `toast.success/error` (zaten root layout'ta toaster var)
