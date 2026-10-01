import { useEffect, useState } from 'react'
import { useStore } from '../store/store'

const query = '(prefers-color-scheme: dark)'

/** Tema efetivo ("system" segue o aparelho) aplicado em <html data-theme>. */
export function useResolvedTheme(): 'light' | 'dark' {
  const { state } = useStore()
  const pref = state.prototype.theme
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return pref === 'system' ? (systemDark ? 'dark' : 'light') : pref
}

export function ThemeSync() {
  const theme = useResolvedTheme()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  return null
}
