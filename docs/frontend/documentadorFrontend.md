---
name: documentador-frontend
description: Guía la documentación y organización profesional del frontend React + TypeScript + Vite, incluida la arquitectura por dominios y sus prácticas de mantenimiento.
version: 1.1.0
language: es
---

# Guía de estructuras de proyectos en React

Este repositorio sirve como guía práctica para entender distintas formas de estructurar un proyecto en **React** con enfoque profesional, escalable y alineado con buenas prácticas empresariales.

## Objetivo

Aquí se documentan **4 opciones de estructura** para proyectos React:

1. **Por tipo de archivo**
2. **Por feature o dominio**
3. **Por capas**
4. **Híbrida enterprise**

Además, se incluyen:

- propuestas de nombres para cada proyecto
- pasos para crearlos desde cero
- recomendaciones de uso
- mejores prácticas y estándares empresariales

---

## Stack recomendado

Para todos los ejemplos se recomienda usar:

- **React**
- **TypeScript**
- **Vite**
- **ESLint**
- **Prettier**

Dependiendo del caso, también:

- **React Router DOM**
- **TanStack Query**
- **Zod**
- **Axios**
- **Zustand**

---

## Requisitos previos

Antes de crear cualquiera de los proyectos, instala y verifica:

```bash
node -v
npm -v
```

Opcionalmente, si usarás control de versiones:

```bash
git --version
```

---

## Propuesta de nombres para los proyectos

### Opción 1: estructura por tipo de archivo
- `react-structure-by-type`
- Alternativa en español: `react-por-tipos`

### Opción 2: estructura por feature o dominio
- `react-feature-based-app`
- Alternativa en español: `react-por-features`

### Opción 3: estructura por capas
- `react-layered-architecture`
- Alternativa en español: `react-por-capas`

### Opción 4: estructura híbrida enterprise
- `react-enterprise-starter`
- Alternativa en español: `react-enterprise-base`

### Convención sugerida si quieres orden visual
- `react-01-by-type`
- `react-02-feature-based`
- `react-03-layered`
- `react-04-enterprise`

---

# 1. Opción: estructura por tipo de archivo

## Descripción

Esta estructura organiza el proyecto por carpetas globales según el tipo de archivo:

- `components`
- `pages`
- `hooks`
- `services`
- `utils`
- `styles`

Es buena para:
- aprendizaje
- demos
- MVPs
- proyectos pequeños

No es la mejor opción para sistemas grandes porque distribuye la lógica de una misma funcionalidad en muchas carpetas globales.

## Nombre sugerido del proyecto

```text
react-structure-by-type
```

## Paso a paso para crearlo

### Paso 1: crear el proyecto

```bash
npm create vite@latest react-structure-by-type
```

Selecciona:
- **Framework:** React
- **Variant:** TypeScript

### Paso 2: entrar al proyecto

```bash
cd react-structure-by-type
```

### Paso 3: instalar dependencias

```bash
npm install
```

### Paso 4: ejecutar el proyecto

```bash
npm run dev
```

### Paso 5: limpiar la plantilla inicial

Reemplaza el contenido de `src/App.tsx` por:

```tsx
function App() {
  return <h1>React Structure By Type</h1>;
}

export default App;
```

### Paso 6: crear la estructura de carpetas

```bash
mkdir src/assets src/components src/hooks src/pages src/services src/styles src/utils src/types
```

## Estructura sugerida

```text
src/
  assets/
  components/
  hooks/
  pages/
  services/
  styles/
  utils/
  types/
```

## Ventajas

- fácil de entender
- rápida de crear
- ideal para iniciar

## Desventajas

- escala mal
- favorece acoplamiento entre carpetas globales
- se vuelve difícil de mantener en equipos grandes

---

# 2. Opción: estructura por feature o dominio

## Descripción

Esta estructura organiza el proyecto por funcionalidades del negocio. Es una de las más recomendadas en entornos empresariales.

Cada feature contiene sus propios archivos relacionados:
- API
- componentes
- hooks
- modelos
- páginas

Es buena para:
- aplicaciones medianas o grandes
- productos con varias áreas funcionales
- equipos con varios desarrolladores

## Nombre sugerido del proyecto

```text
react-feature-based-app
```

## Paso a paso para crearlo

### Paso 1: crear el proyecto

```bash
npm create vite@latest react-feature-based-app
```

Selecciona:
- **Framework:** React
- **Variant:** TypeScript

### Paso 2: entrar al proyecto

```bash
cd react-feature-based-app
```

### Paso 3: instalar dependencias base

```bash
npm install
```

### Paso 4: instalar dependencias recomendadas

```bash
npm install react-router-dom @tanstack/react-query zod axios
```

### Paso 5: ejecutar el proyecto

```bash
npm run dev
```

### Paso 6: crear estructura base

```bash
mkdir src/app src/shared src/features
mkdir src/app/providers src/app/router src/app/styles
mkdir src/shared/components src/shared/hooks src/shared/lib src/shared/types src/shared/constants src/shared/assets
mkdir src/features/auth src/features/users
mkdir src/features/auth/api src/features/auth/components src/features/auth/hooks src/features/auth/model src/features/auth/pages
mkdir src/features/users/api src/features/users/components src/features/users/hooks src/features/users/model src/features/users/pages
```

## Estructura sugerida

```text
src/
  app/
    providers/
    router/
    styles/
  shared/
    components/
    hooks/
    lib/
    types/
    constants/
    assets/
  features/
    auth/
      api/
      components/
      hooks/
      model/
      pages/
    users/
      api/
      components/
      hooks/
      model/
      pages/
```

## Ventajas

- agrupa el código por dominio
- mejora la mantenibilidad
- escala mejor
- facilita el trabajo por squads o equipos

## Desventajas

- requiere disciplina arquitectónica
- hay que definir bien qué va en `shared` y qué se queda en cada feature

---

# 3. Opción: estructura por capas

## Descripción

Esta arquitectura separa el proyecto por responsabilidades técnicas:

- `presentation`: UI y vistas
- `domain`: reglas de negocio y casos de uso
- `infrastructure`: acceso a datos, APIs y repositorios
- `shared`: utilidades comunes
- `app`: bootstrap y configuración global

Es buena para:
- sistemas complejos
- mucha lógica de negocio
- proyectos que exigen alto desacoplamiento
- aplicaciones con varias integraciones

## Nombre sugerido del proyecto

```text
react-layered-architecture
```

## Paso a paso para crearlo

### Paso 1: crear el proyecto

```bash
npm create vite@latest react-layered-architecture
```

Selecciona:
- **Framework:** React
- **Variant:** TypeScript

### Paso 2: entrar al proyecto

```bash
cd react-layered-architecture
```

### Paso 3: instalar dependencias

```bash
npm install
npm install react-router-dom zod axios
```

### Paso 4: ejecutar el proyecto

```bash
npm run dev
```

### Paso 5: crear la estructura por capas

```bash
mkdir src/app src/presentation src/domain src/infrastructure src/shared
mkdir src/domain/auth src/domain/auth/models src/domain/auth/use-cases
mkdir src/infrastructure/auth src/infrastructure/auth/api src/infrastructure/auth/repositories
mkdir src/presentation/auth src/presentation/auth/pages src/presentation/auth/components src/presentation/auth/hooks
```

## Estructura sugerida

```text
src/
  app/
  presentation/
    auth/
      pages/
      components/
      hooks/
  domain/
    auth/
      models/
      use-cases/
  infrastructure/
    auth/
      api/
      repositories/
  shared/
```

## Ventajas

- excelente separación de responsabilidades
- facilita testing
- reduce acoplamiento
- soporta bien cambios de backend o integraciones

## Desventajas

- puede parecer compleja para proyectos pequeños
- necesita experiencia técnica para mantenerse bien

---

# 4. Opción: estructura híbrida enterprise

## Descripción

Esta es la opción más recomendable para muchos proyectos empresariales modernos porque combina:

- organización por features
- una capa `shared` reutilizable
- una capa `app` para configuración global

Da un buen balance entre:
- simplicidad
- escalabilidad
- mantenibilidad
- claridad para equipos

## Nombre sugerido del proyecto

```text
react-enterprise-starter
```

## Paso a paso para crearlo

### Paso 1: crear el proyecto

```bash
npm create vite@latest react-enterprise-starter
```

Selecciona:
- **Framework:** React
- **Variant:** TypeScript

### Paso 2: entrar al proyecto

```bash
cd react-enterprise-starter
```

### Paso 3: instalar dependencias

```bash
npm install
npm install react-router-dom @tanstack/react-query zod axios
```

Opcional:

```bash
npm install zustand
```

### Paso 4: ejecutar el proyecto

```bash
npm run dev
```

### Paso 5: crear estructura enterprise

```bash
mkdir src/app src/shared src/features
mkdir src/app/providers src/app/router src/app/store src/app/layouts
mkdir src/shared/ui src/shared/hooks src/shared/lib src/shared/types src/shared/constants src/shared/config src/shared/styles src/shared/assets
mkdir src/features/auth src/features/users src/features/dashboard
mkdir src/features/auth/api src/features/auth/components src/features/auth/hooks src/features/auth/model src/features/auth/pages
mkdir src/features/users/api src/features/users/components src/features/users/hooks src/features/users/model src/features/users/pages
mkdir src/features/dashboard/api src/features/dashboard/components src/features/dashboard/hooks src/features/dashboard/model src/features/dashboard/pages
```

## Estructura sugerida

```text
src/
  app/
    providers/
    router/
    store/
    layouts/
  shared/
    ui/
    hooks/
    lib/
    types/
    constants/
    config/
    styles/
    assets/
  features/
    auth/
      api/
      components/
      hooks/
      model/
      pages/
    users/
      api/
      components/
      hooks/
      model/
      pages/
    dashboard/
      api/
      components/
      hooks/
      model/
      pages/
```

## Ventajas

- muy buen balance entre orden y flexibilidad
- clara para equipos de desarrollo
- facilita crecimiento progresivo
- muy cercana a estándares reales de empresa

## Desventajas

- si no hay reglas claras, `shared` puede crecer demasiado
- requiere convenciones de equipo desde el inicio

---

# Mejores prácticas y estándares empresariales

## 1. Usar TypeScript en modo estricto

Se recomienda:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Beneficios:
- menos errores en producción
- contratos más claros
- mejor mantenibilidad

---

## 2. Separar UI, lógica y acceso a datos

Evita componentes que hagan todo al mismo tiempo:
- renderizado
- fetch de datos
- validación
- reglas de negocio

Mejor separar en:
- componentes presentacionales
- hooks
- capa API
- modelos y esquemas

---

## 3. Diseñar por dominio

Piensa en funcionalidades como:
- auth
- users
- orders
- dashboard
- billing

No solo en carpetas genéricas como `components` o `utils`.

---

## 4. Mantener `shared` bajo control

Regla recomendada:
- si algo se usa solo en una feature, debe quedarse en esa feature
- si se reutiliza entre varias áreas, entonces sí puede vivir en `shared`

---

## 5. Usar alias de imports

Ejemplo sugerido:

```text
@/app
@/shared
@/features
```

Esto evita rutas relativas largas y mejora los refactors.

---

## 6. Manejo de estado

Recomendación general:
- estado local para UI y formularios
- TanStack Query para server state
- Zustand, Context o Redux Toolkit solo si realmente hace falta estado global

---

## 7. Validar datos de entrada y salida

Usa librerías como:
- Zod
- Yup
- Valibot

Especialmente útil para:
- formularios
- contratos con APIs
- validaciones de datos remotos

---

## 8. Testing por niveles

Se recomienda cubrir:
- unit tests para utilidades y lógica
- tests de componentes para UI crítica
- integration tests para flujos
- E2E para recorridos de negocio importantes

---

## 9. Calidad automática

Configura desde el inicio:
- ESLint
- Prettier
- Husky
- lint-staged
- CI

---

## 10. Performance

Buenas prácticas:
- code splitting por rutas
- lazy loading
- virtualización de listas grandes
- memoización con criterio
- evitar rerenders innecesarios

---

## 11. Seguridad frontend

Buenas prácticas mínimas:
- no guardar secretos en el frontend
- manejar correctamente variables de entorno
- no confiar la autorización solo al frontend
- proteger rutas solo como apoyo visual, no como control real de seguridad

---

# Recomendación final

Si estás aprendiendo, crea los proyectos en este orden:

1. `react-structure-by-type`
2. `react-feature-based-app`
3. `react-layered-architecture`
4. `react-enterprise-starter`

Así avanzas desde lo más simple hacia una estructura más cercana a un entorno profesional real.

Si tu objetivo es construir un proyecto serio desde el inicio, la mejor opción general suele ser:

```text
react-enterprise-starter
```

porque ofrece el mejor equilibrio entre:
- facilidad de comprensión
- escalabilidad
- mantenibilidad
- estándares empresariales

---

# Paso extra recomendado para todos los proyectos

## Inicializar Git

```bash
git init
git add .
git commit -m "Initial React project setup"
```

## Instalar herramientas de calidad

```bash
npm install -D eslint prettier
```

Opcionalmente:

```bash
npm install -D husky lint-staged @types/node
```

---

# Conclusión

No existe una única estructura perfecta para todos los casos.

La mejor estructura depende de:
- tamaño del proyecto
- complejidad funcional
- tamaño del equipo
- tiempo de vida esperado del producto

Como referencia rápida:

- **Por tipo**: simple y educativa
- **Por feature**: muy buena para crecer
- **Por capas**: ideal para lógica compleja
- **Híbrida enterprise**: la mejor opción general para proyectos profesionales

## Contrato de observabilidad para el documentador de Frontend

Este documento es una guía de estructuras; el contrato operativo del proyecto vive en `TRACING.md`. Al documentar un cambio de frontend:

1. Registrar la tarea con `node scripts/agent-trace.mjs start --agent frontend-doc --task <TASK> --workflow <WF>` y conservar el `trace_id`.
2. Identificar y reportar, con rutas reales: componentes, páginas, hooks, clientes API, tipos/DTOs, configuración de Vite, variables de entorno y pruebas afectadas.
3. Emitir `docs.impact.detected` con `--attr components=... --attr endpoints=... --attr services=... --attr dtos=... --attr configs=... --attr docs_to_update=...`.
4. Incluir el `trace_id` de la tarea y el `X-Trace-Id` de la respuesta HTTP cuando se haya validado un flujo real.
5. Cerrar con `agent.task.completed` y evidencia verificable (`npm run build`, prueba de navegador, archivo o diff). Sin evidencia, el estado es `partial` o `failed`.
6. No documentar componentes o contratos que no se hayan inspeccionado; no incluir secretos, cookies, tokens ni datos personales en la documentación ni en los eventos.
