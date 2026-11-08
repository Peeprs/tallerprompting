# Prompt de prueba

Copia y pega esto en OpenCode desde `docs/demo/react-skill-demo/`:

```text
Usa la skill react-best-practices.
Revisa src/AntipatternCard.tsx contra src/FixedCard.tsx.
Dime qué reglas incumple, qué patrón aplica y cómo lo corregirías.
```

## Respuesta esperada (resumen)

1. `fetch` en `useEffect` sin `AbortController` → puede actualizar estado después de desmontar.
2. No hay estados de loading, error ni vacío.
3. `count` se deriva de `items` y `query`; no debe vivir en `useState` ni sincronizarse con un efecto.
4. `key={index}` → usar `key={item.id}`.
5. El `input` no tiene `label` asociado.

La corrección está en `src/FixedCard.tsx`.
