#!/bin/bash
# Build de producción para Plesk.
#
# El shell de Plesk resuelve `node` a la versión del sistema (v18 en el servidor
# de desarrollo) aunque el proyecto pida otra, así que aquí seleccionamos la
# correcta explícitamente antes de compilar. Si no, el build puede fallar de
# formas difíciles de diagnosticar, o peor: terminar y dejar la app rota.
set -e

REQUIRED_MAJOR="$(tr -d '[:space:]' < .node-version 2>/dev/null | cut -d. -f1)"
REQUIRED_MAJOR="${REQUIRED_MAJOR:-22}"

# Plesk instala cada versión en /opt/plesk/node/<major>/bin
current_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$current_major" -lt "$REQUIRED_MAJOR" ]; then
  for candidate in /opt/plesk/node/*/bin; do
    [ -x "$candidate/node" ] || continue
    candidate_major="$("$candidate/node" -p 'process.versions.node.split(".")[0]')"
    if [ "$candidate_major" -ge "$REQUIRED_MAJOR" ]; then
      export PATH="$candidate:$PATH"
      echo "==> Usando Node $("$candidate/node" -v) de $candidate"
      break
    fi
  done
fi

echo "==> Comprobaciones previas..."
node scripts/preflight.mjs

echo "==> Compilando (next build)..."
node_modules/.bin/next build

echo "==> Build completado."
echo "    Reinicia Passenger SOLO si esto ha terminado bien:  touch tmp/restart.txt"
