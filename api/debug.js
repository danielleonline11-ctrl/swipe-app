export default function handler(req, res) {
  const idRaw = process.env.APPLE_ID || ''
  const pwRaw = process.env.APPLE_APP_PASSWORD || ''
  const idTrim = idRaw.trim()
  const pwTrim = pwRaw.trim()
  res.status(200).json({
    ok: true,
    version: 'v0.2',
    env: {
      APPLE_ID: idRaw ? `${idTrim.slice(0, 3)}…@${idTrim.split('@')[1] || '?'}` : null,
      APPLE_ID_chars: { raw: idRaw.length, trimmed: idTrim.length, hasWhitespace: idRaw.length !== idTrim.length },
      APPLE_APP_PASSWORD: pwRaw ? `••• (${pwTrim.length} chars trimmed, ${pwRaw.length} chars raw)` : null,
      APPLE_APP_PASSWORD_chars: { raw: pwRaw.length, trimmed: pwTrim.length, hasWhitespace: pwRaw.length !== pwTrim.length, hasDashes: pwTrim.includes('-') },
    },
    node: process.version,
    region: process.env.VERCEL_REGION || 'unknown',
    deployedAt: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
  })
}
