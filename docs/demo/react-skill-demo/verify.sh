#!/usr/bin/env bash
set -euo pipefail

BASE="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$BASE/.opencode/skills/react-best-practices"

for file in SKILL.md AGENTS.md INSTALL.md; do
  test -f "$SKILL_DIR/$file" || { echo "FALTA: $SKILL_DIR/$file"; exit 1; }
done
echo "OK: skill instalada en el demo"

for file in AntipatternCard.tsx FixedCard.tsx; do
  test -f "$BASE/src/$file" || { echo "FALTA: $BASE/src/$file"; exit 1; }
done
echo "OK: ejemplos AntipatternCard.tsx y FixedCard.tsx presentes"

test -f "$BASE/prompt.md" || { echo "FALTA: $BASE/prompt.md"; exit 1; }
echo "OK: prompt de prueba presente"
