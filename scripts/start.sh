#!/bin/sh
set -e

echo "==> Veritabanı migrasyonları uygulanıyor..."
node ./node_modules/prisma/build/index.js migrate deploy || {
  echo "[!] Migrate başarısız oldu. DATABASE_URL doğru mu?"
  exit 1
}

echo "==> Seed (varsa admin oluşturuluyor)..."
node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts || {
  echo "[!] Seed başarısız oldu, devam ediliyor..."
}

echo "==> Uygulama başlatılıyor (port ${PORT:-3000})"
exec node server.js
