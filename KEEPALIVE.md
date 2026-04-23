# Keep-Alive — Berry Stock App en Render

Render Free Tier pausa los servicios web tras **15 minutos de inactividad**.
Este proyecto usa dos capas complementarias para evitarlo.

---

## Cómo funciona

### Capa 1 — Endpoint `/api/ping`

`src/app/api/ping/route.ts`

Devuelve un JSON con el estado del servidor:

```json
{ "status": "ok", "timestamp": "2026-04-22T12:00:00.000Z", "uptime": 3600 }
```

Este endpoint es el destino tanto del self-ping interno como del cron externo.

---

### Capa 2 — Self-ping interno

`src/instrumentation.ts`

Cuando el servidor arranca, registra un `setInterval` que llama a `/api/ping`
cada **10 minutos** desde el propio proceso de Node.js.

En consola vas a ver:
- `✅ Self-ping OK` → todo en orden
- `⚠️ Self-ping failed` → algo salió mal (el log incluye el motivo)

**¿Por qué 10 minutos?** Render pausa a los 15 min. Con pings cada 10 min
hay margen suficiente incluso si alguno falla.

---

### Por qué las dos capas juntas

| Situación | Capa 1 (cron externo) | Capa 2 (self-ping) |
|-----------|----------------------|---------------------|
| Servidor frío, sin tráfico | ✅ Lo despierta | — (no corre hasta despertar) |
| Servidor activo entre pings del cron | — | ✅ Lo mantiene vivo |
| cron externo cae / se pausa | — | ✅ Sigue manteniendo vivo |
| Self-ping falla (reinicio del proceso) | ✅ Reactiva el ciclo | — |

Juntas garantizan que el servidor **nunca llegue a los 15 minutos sin actividad**.

---

## Configuración

### Variable de entorno requerida (Render)

En el dashboard de Render, ir a **Environment → Add environment variable**:

| Variable | Valor |
|----------|-------|
| `APP_URL` | `https://<tu-servicio>.onrender.com` |

Sin esta variable el self-ping se desactiva (lo indica en el log de arranque).

---

## Configurar cron-job.org (paso a paso)

1. Crear cuenta en [cron-job.org](https://cron-job.org) (es gratis)
2. Click en **CREATE CRONJOB**
3. Completar:
   - **Title:** `Berry Stock — Keep Alive`
   - **URL:** `https://<tu-servicio>.onrender.com/api/ping`
   - **Schedule:** cada 10 minutos → seleccionar **Every 10 minutes**
   - **Request method:** `GET`
4. Click en **CREATE** y asegurarse que el estado quede **Enabled**
5. Verificar en la pestaña **History** que aparezcan respuestas `200 OK`

---

## Restricciones

- No agrega dependencias nuevas (usa `fetch` nativo de Node 18+)
- No modifica ninguna lógica de negocio existente
- Respeta el estilo ESM (`import`/`export`) del proyecto
