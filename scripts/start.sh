#!/bin/sh
set -e

# Prisma & tsx tüm transitive bağımlılıklarıyla _init/node_modules altında.
# Buradan çalıştırılan node, _init/node_modules'ü flat olarak resolve eder.
PRISMA_BIN="./_init/node_modules/prisma/build/index.js"
TSX_BIN="./_init/node_modules/tsx/dist/cli.mjs"

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
# tsx ile seed.ts çalıştırırken hem tsx kendi modüllerini, hem seed.ts'in
# import'ları (PrismaClient, bcryptjs) için _init/node_modules'e gerek var.
NODE_PATH=/app/_init/node_modules node "$TSX_BIN" prisma/seed.ts || {
  echo "[!] Seed başarısız oldu, devam ediliyor..."
}

echo "==> Uygulama başlatılıyor (port ${PORT:-3000})"
exec node server.js
