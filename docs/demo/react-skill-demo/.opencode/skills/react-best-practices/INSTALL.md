# Instalación y demo — React Best Practices (React + Vite)

Esta guía instala la skill `react-best-practices` en OpenCode y en otros agentes. La skill son dos archivos:

- `SKILL.md` — índice de activación (frontmatter + reglas + patrones).
- `AGENTS.md` — guía completa con el detalle de cada regla.

## 1. Requisitos

- OpenCode (u otro agente que lea `SKILL.md`/`AGENTS.md`).
- Los archivos de `specs/skills/Frontend/`.
- Para verificar el frontend: Node.js y `npm`.

## 2. Instalación global en OpenCode (recomendada)

```bash
mkdir -p ~/.config/opencode/skills/react-best-practices
cp specs/skills/Frontend/SKILL.md ~/.config/opencode/skills/react-best-practices/SKILL.md
cp specs/skills/Frontend/AGENTS.md ~/.config/opencode/skills/react-best-practices/AGENTS.md
cp specs/skills/Frontend/INSTALL.md ~/.config/opencode/skills/react-best-practices/INSTALL.md
```

Reinicia OpenCode. La skill queda disponible en todos los proyectos del usuario.

**Verificación:**

```bash
ls -la ~/.config/opencode/skills/react-best-practices
head -5 ~/.config/opencode/skills/react-best-practices/SKILL.md
```

Debe mostrar el frontmatter con `name: react-best-practices`.

## 3. Instalación local al proyecto

Úsala si quieres versionar la skill junto con el repositorio:

```bash
mkdir -p .opencode/skills/react-best-practices
cp specs/skills/Frontend/SKILL.md .opencode/skills/react-best-practices/SKILL.md
cp specs/skills/Frontend/AGENTS.md .opencode/skills/react-best-practices/AGENTS.md
cp specs/skills/Frontend/INSTALL.md .opencode/skills/react-best-practices/INSTALL.md
```

Añade `.opencode/skills/` al control de versiones si el equipo debe compartirla.

## 4. Instalación en otros agentes

| Agente | Dónde va | Nota |
| --- | --- | --- |
| OpenCode | `~/.config/opencode/skills/<name>/SKILL.md` o `.opencode/skills/<name>/SKILL.md` | Global o por proyecto |
| Claude Code | `.claude/skills/<name>/SKILL.md` | Misma estructura de frontmatter |
| Cursor | `.cursor/rules/react-best-practices.mdc` o `AGENTS.md` en la raíz | Cursor lee reglas de proyecto |
| Codex / agentes genéricos | `AGENTS.md` en la raíz del repo | Referencia `SKILL.md` para el índice |
| ChatGPT / LLM manual | Adjunta `SKILL.md` y `AGENTS.md` | Pídele leer el índice primero |

Para agentes que solo leen `AGENTS.md`, coloca un archivo raíz que apunte a la guía:

```markdown
# AGENTS.md

Para tareas de frontend, lee `specs/skills/Frontend/SKILL.md` y después
`specs/skills/Frontend/AGENTS.md`. Aplica la adaptación React + Vite.
```

## 5. Demo reproducible (60 segundos)

Crea un proyecto de prueba, instala la skill y comprueba la estructura:

```bash
DEMO=/tmp/opencode/react-skill-demo
rm -rf "$DEMO"
mkdir -p "$DEMO/.opencode/skills/react-best-practices"

cp specs/skills/Frontend/SKILL.md "$DEMO/.opencode/skills/react-best-practices/SKILL.md"
cp specs/skills/Frontend/AGENTS.md "$DEMO/.opencode/skills/react-best-practices/AGENTS.md"
cp specs/skills/Frontend/INSTALL.md "$DEMO/.opencode/skills/react-best-practices/INSTALL.md"

find "$DEMO" -type f -printf '%P\n'
```

Salida esperada:

```text
.opencode/skills/react-best-practices/SKILL.md
.opencode/skills/react-best-practices/AGENTS.md
.opencode/skills/react-best-practices/INSTALL.md
```

Abre el demo con OpenCode y prueba:

```bash
cd "$DEMO"
opencode
```

Prompt de prueba:

```text
Usa la skill react-best-practices.
Revisa este componente React: hace fetch en useEffect, no cancela la petición
y usa el índice del array como key. Dime qué reglas incumple y cómo corregirlo.
```

El agente debe:

1. Cargar `SKILL.md`.
2. Consultar en `AGENTS.md` las reglas de efectos, fetch y keys.
3. Responder con el antipatrón, la corrección y el checklist.

## 6. Cómo se activa

La skill se descubre por el `description` del frontmatter. También puedes invocarla explícitamente:

```text
usa la skill react-best-practices
```

o pedir una tarea que coincida:

```text
revisa este componente React y aplica las best practices del proyecto
```

## 7. Desinstalación

```bash
rm -rf ~/.config/opencode/skills/react-best-practices
# o, si es local:
rm -rf .opencode/skills/react-best-practices
```

## 8. Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| La skill no aparece | Ruta incorrecta o falta reiniciar | Verifica `SKILL.md` y reinicia OpenCode |
| El agente no la usa | `description` poco claro | Invócala explícitamente por nombre |
| Se cargan reglas de Next.js | El agente leyó `AGENTS.md` sin la sección 0 | Pídele leer primero la sección 0 (adaptación React + Vite) |
| El contexto se llena | Se cargó todo `AGENTS.md` | Usa `SKILL.md` como índice y consulta solo la regla necesaria |
| Hay conflicto con el `AGENTS.md` raíz | Dos fuentes de reglas | Deja en la raíz solo el puntero a `specs/skills/Frontend/` |

## 9. Estructura final

```text
specs/skills/Frontend/
├── AGENTS.md    # guía completa adaptada (Vercel + React/Vite)
├── SKILL.md     # índice y activación de la skill
└── INSTALL.md   # esta guía
```

## 10. Presentación

La explicación visual de 3 diapositivas está en:

- `docs/presentaciones/react-best-practices-3-diapositivas.pptx`
- `docs/presentaciones/react-best-practices-3-diapositivas.pdf`

Contenido: qué son `AGENTS.md` y `SKILL.md`, cómo se instalan y qué Best Practices y patrones de diseño aplican en esta SPA.
