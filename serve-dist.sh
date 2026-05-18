#!/bin/sh
set -eu

cd "$(dirname "$0")"
export PATH="$PWD/.tools/node/bin:$PATH"
export PORT="${PORT:-4322}"

while lsof -i "tcp:$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

exec npm run serve:dist
