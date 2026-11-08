# Demo — skill `react-best-practices`

Esta carpeta reproduce la instalación de la skill de React + Vite dentro de un proyecto de ejemplo. Sirve para ver la estructura final, probar la activación y comparar un componente con antipatrones contra su versión corregida.

> **Fuente de verdad:** `specs/skills/Frontend/`. La copia de `docs/demo/react-skill-demo/.opencode/skills/react-best-practices/` es solo una demostración.

## 1. Estructura

```text
docs/demo/
├── README.md
└── react-skill-demo/
    ├── .opencode/
    │   └── skills/
    │       └── react-best-practices/
    │           ├── SKILL.md    # índice de activación
    │           ├── AGENTS.md   # guía completa
    │           └── INSTALL.md  # instalación
    ├── src/
    │   ├── AntipatternCard.tsx # ejemplo con malas prácticas
    │   └── FixedCard.tsx       # versión corregida
    ├── prompt.md               # prompt de prueba
    └── verify.sh               # verificación de la estructura
```

Los archivos de `src/` son ejemplos de código para revisión; no forman una aplicación ejecutable.

## 2. Cómo se instala

La skill ya está instalada en la ruta local del demo:

```text
react-skill-demo/.opencode/skills/react-best-practices/
```

Para instalarla globalmente en OpenCode:

```bash
mkdir -p ~/.config/opencode/skills/react-best-practices
cp specs/skills/Frontend/SKILL.md ~/.config/opencode/skills/react-best-practices/
cp specs/skills/Frontend/AGENTS.md ~/.config/opencode/skills/react-best-practices/
cp specs/skills/Frontend/INSTALL.md ~/.config/opencode/skills/react-best-practices/
```

Reinicia OpenCode y abre esta carpeta:

```bash
cd docs/demo/react-skill-demo
opencode
```

## 3. Cómo se usa

La skill se descubre por el `description` de `SKILL.md`. También puedes invocarla explícitamente:

```text
usa la skill react-best-practices
```

Prompt de prueba (también está en `prompt.md`):

```text
Usa la skill react-best-practices.
Revisa src/AntipatternCard.tsx contra src/FixedCard.tsx.
Dime qué reglas incumple, qué patrón aplica y cómo lo corregirías.
```

## 4. Qué debe encontrar el agente

`AntipatternCard.tsx` tiene estos problemas:

| Antipatrón | Regla que incumple |
| --- | --- |
| `fetch` en `useEffect` sin `AbortController` | Cancelar o ignorar respuestas tardías |
| Sin estados de loading, error ni vacío | Errores y estados vacíos explícitos |
| `count` guardado en estado y sincronizado con un efecto | Estado derivado en render, no en efectos |
| `key={index}` | Key estable en listas |
| `input` sin `label` | Accesibilidad por defecto |

`FixedCard.tsx` muestra la corrección: `AbortController`, estados explícitos, `useMemo` para el filtro, `key={item.id}` y `label` asociado.

## 5. Verificación

```bash
bash docs/demo/react-skill-demo/verify.sh
```

Salida esperada:

```text
OK: skill instalada en el demo
OK: ejemplos AntipatternCard.tsx y FixedCard.tsx presentes
OK: prompt de prueba presente
```

## 6. Relación con el proyecto

- `SKILL.md` = índice de activación y prioridades.
- `AGENTS.md` = guía completa con la adaptación Next.js → React + Vite y los patrones del proyecto.
- `INSTALL.md` = instalación global, local y para otros agentes.
- `docs/presentaciones/react-best-practices-3-diapositivas.pptx` = explicación visual de 3 diapositivas.

La skill se aplica al frontend real del portal: `src/api/http.ts`, `src/components/*`, `src/styles/global.css` y `src/utils/validation.ts`.
