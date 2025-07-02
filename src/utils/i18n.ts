type Lang = 'zh' | 'en'

export function getLang(): Lang {
  const env = (process.env.VIBECLI_LANG || process.env.LANG || 'zh').toLowerCase()
  return env.startsWith('en') ? 'en' : 'zh'
}

export function t(zh: string, en?: string): string {
  const lang = getLang()
  if (lang === 'en') {
    return en ?? zh
  }
  return zh
} 