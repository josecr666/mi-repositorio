#!/usr/bin/env bash
#
# publicar-en-canalseguro.sh
# ---------------------------------------------------------------
# Copia el prototipo CanalSeguro (ubicado en la carpeta canalseguro/
# de este repositorio) al repositorio dedicado josecr666/canalseguro
# y lo publica en su rama principal.
#
# Uso:
#   bash publicar-en-canalseguro.sh
#
# Requisitos: git configurado con acceso de escritura a
# https://github.com/josecr666/canalseguro
# ---------------------------------------------------------------
set -euo pipefail

ORIGEN_REPO="https://github.com/josecr666/mi-repositorio"
ORIGEN_RAMA="claude/project-creation-repo-link-MridX"
DESTINO_REPO="https://github.com/josecr666/canalseguro"
TMP="$(mktemp -d)"

echo "==> Clonando el repositorio de destino (canalseguro)..."
git clone "$DESTINO_REPO" "$TMP/canalseguro"

echo "==> Obteniendo el proyecto desde mi-repositorio ($ORIGEN_RAMA)..."
git clone --depth 1 -b "$ORIGEN_RAMA" "$ORIGEN_REPO" "$TMP/origen"

echo "==> Copiando los archivos del prototipo..."
cp -r "$TMP/origen/canalseguro/." "$TMP/canalseguro/"

cd "$TMP/canalseguro"
git add .
if git diff --cached --quiet; then
  echo "==> No hay cambios que publicar (el contenido ya está actualizado)."
else
  git commit -m "feat: prototipo SPA CanalSeguro (canal de denuncia anónima)"
  git push origin HEAD
  echo "==> ¡Publicado en $DESTINO_REPO!"
fi

echo ""
echo "Último paso (una sola vez): activa GitHub Pages"
echo "  Settings -> Pages -> Deploy from a branch -> rama 'main', carpeta '/ (root)'"
echo "El sitio quedará en: https://josecr666.github.io/canalseguro/"

rm -rf "$TMP"
