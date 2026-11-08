# DeepSec

Configuración del escáner de seguridad [vercel-labs/deepsec](https://github.com/vercel-labs/deepsec) para este proyecto. El archivo `deepsec.config.ts` está en `src/`; ejecuta los comandos desde esta carpeta para que DeepSec lo descubra. El proyecto configurado apunta a `..`, que contiene frontend, backend y configuración del repositorio.

## Preparación de bajo riesgo

Requiere Node.js/npm y una CLI local de Codex disponible. Primero crea el scaffold sin iniciar sesión, instalar dependencias ni ejecutar análisis con IA:

```sh
npx deepsec init --scaffold-only
```

Revisa los archivos generados en `src/.deepsec/`. Cuando quieras instalar el harness y correr el análisis, sigue el `README.md` que DeepSec genere ahí y su guía de [inicio](https://github.com/vercel-labs/deepsec/blob/main/docs/getting-started.md). Para usar la suscripción local de Codex, la opción soportada es `npx deepsec init --model-auth local`. No configures la ruta de IA con las credenciales de MySQL ni guardes secretos del backend en el workspace DeepSec.

## Ciclo de análisis

Desde `src/.deepsec/`, una vez completado el setup interactivo:

```sh
pnpm deepsec status
pnpm deepsec scan
pnpm deepsec process
pnpm deepsec revalidate
pnpm deepsec export --format md-dir --out ./findings
```

`scan` ejecuta patrones locales. `process` y `revalidate` usan un agente/modelo y pueden consumir créditos. Revisa `.deepsec/.gitignore` y la configuración antes de versionar resultados; no publiques tokens ni informes que contengan datos sensibles.
