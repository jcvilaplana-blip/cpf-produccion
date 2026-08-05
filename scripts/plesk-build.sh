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
# Este es un hosting compartido: 8 núcleos, pero la memoria libre ronda los
# 2 GB y no hay swap alguno. Sin limitar la paralelización, la fase de
# recolección de páginas se queda sin memoria y el build muere con un error
# engañoso sobre `pages-manifest.json`. Se puede subir con NEXT_BUILD_CPUS si
# algún día la máquina va más holgada.
export NEXT_BUILD_CPUS="${NEXT_BUILD_CPUS:-2}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
echo "    (limitado a $NEXT_BUILD_CPUS procesos por memoria disponible)"
node_modules/.bin/next build

echo "==> Build completado."
echo "    Reinicia Passenger SOLO si esto ha terminado bien:  touch tmp/restart.txt"
