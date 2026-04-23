export async function register() {
  // Solo corre en el runtime de Node.js (servidor), no en Edge
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const appUrl = process.env.APP_URL
  if (!appUrl) {
    console.warn('[keepalive] APP_URL no configurada — self-ping desactivado')
    return
  }

  const pingUrl = `${appUrl}/api/ping`
  const INTERVAL_MS = 10 * 60 * 1000 // 10 minutos

  async function selfPing() {
    try {
      const res = await fetch(pingUrl, { cache: 'no-store' })
      if (res.ok) {
        console.log('✅ Self-ping OK')
      } else {
        console.warn(`⚠️ Self-ping failed — HTTP ${res.status}`)
      }
    } catch (err) {
      console.warn('⚠️ Self-ping failed —', err)
    }
  }

  setInterval(selfPing, INTERVAL_MS)
  console.log(`[keepalive] Self-ping activado → ${pingUrl} cada ${INTERVAL_MS / 60_000} min`)
}
