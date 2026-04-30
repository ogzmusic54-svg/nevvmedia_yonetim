#!/bin/sh
set -e

PRISMA_BIN="./node_modules/prisma/build/index.js"
TSX_BIN="./node_modules/tsx/dist/cli.mjs"

if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  echo "==> Veritabanı migrasyonları uygulanıyor..."
  node "$PRISMA_BIN" migrate deploy || {
    echo "[!] Migrate başarısız. DATABASE_URL doğru mu?"
    exit 1
  }
else
  echo "==> Migration klasörü boş — şema doğrudan veritabanına push ediliyor..."
  node "$PRISMA_BIN" db push --skip-generate --accept-data-loss || {
    echo "[!] Şema push başarısız. DATABASE_URL doğru mu?"
    exit 1
  }
fi

echo "==> Seed (varsa admin oluşturuluyor)..."
node "$TSX_BIN" prisma/seed.ts || {
  echo "[!] Seed başarısız oldu, devam ediliyor..."
}

echo "==> Uygulama başlatılıyor (port ${PORT:-3000})"
exec node server.js
