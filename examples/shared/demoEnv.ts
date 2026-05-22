const TIANDITU_TOKEN_PLACEHOLDER = 'YOUR_TIANDITU_TOKEN_HERE'

/** *********************天地图Token配置*********************/
export function getDemoTiandituToken(env: Record<string, unknown> = (import.meta as any).env): string | undefined {
  const token = typeof env.VITE_TIANDITU_TOKEN === 'string' ? env.VITE_TIANDITU_TOKEN.trim() : ''

  if (!token || token === TIANDITU_TOKEN_PLACEHOLDER) {
    return undefined
  }

  return token
}

