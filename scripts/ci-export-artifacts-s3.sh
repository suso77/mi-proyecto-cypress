#!/usr/bin/env bash
# scripts/ci-export-artifacts-s3.sh
set -euo pipefail

SRC="${1:-auditorias}"
if [ ! -d "$SRC" ]; then
  echo "❌ Directorio no encontrado: $SRC"
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "❌ Falta AWS CLI (aws). Instálalo o usa la action oficial."
  exit 1
fi

if [ -z "${PUBLIC_BASE_URL:-}" ]; then
  echo "⚠️  PUBLIC_BASE_URL no está definido. Sube igualmente; enlaces locales file:// seguirán en el CSV."
fi

# Espera que PUBLIC_BASE_URL sea algo como https://cdn.miempresa.com
# y que el bucket esté mapeado para servir /auditorias/
# Ejemplo: s3://mi-bucket/auditorias/
BUCKET_PATH="${S3_BUCKET_PATH:-s3://mi-bucket/auditorias/}"

echo "🚀 Subiendo artifacts a: ${BUCKET_PATH}"
aws s3 sync "$SRC" "$BUCKET_PATH" --acl public-read --delete

echo "✅ Artifacts publicados en S3."
echo "ℹ️  Asegúrate de que PUBLIC_BASE_URL apunte a la misma ruta pública del bucket."
