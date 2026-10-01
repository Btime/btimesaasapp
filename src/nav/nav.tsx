import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { isTabRoute, type Route, type TabName } from './routes'

export type NavDirection = 'push' | 'back' | 'tab' | 'replace'

interface NavValue {
  stack: Route[]
  /** Chave estável de cada camada (muda em push, replace, goTab e reset). */
  keys: string[]
  current: Route
  tab: TabName
  direction: NavDirection
  canGoBack: boolean
  /** Abre uma tela por cima da atual. */
  push: (route: Route) => void
  /** Volta uma tela. */
  back: () => void
  /** Troca a tela atual sem empilhar. */
  replace: (route: Route) => void
  /** Vai para a raiz de uma aba (zera a pilha). Aceita parâmetros da aba. */
  goTab: (route: Route) => void
  /** Define a pilha inteira (ex.: concluir e cair em Finalizadas). */
  reset: (stack: Route[]) => void
}

interface Entry {
  route: Route
  key: string
}

const NavContext = createContext<NavValue | null>(null)

function tabOf(route: Route): TabName {
  if (route.name === 'activities') return 'activities'
  if (route.name === 'profile') return 'profile'
  return 'home'
}

export function NavProvider({ children, initial }: { children: ReactNode; initial?: Route[] }) {
  const seq = useRef(0)
  const entry = useCallback((route: Route): Entry => {
    seq.current += 1
    return { route, key: `k${seq.current}` }
  }, [])
  const [entries, setEntries] = useState<Entry[]>(() =>
    (initial ?? [{ name: 'home' } as Route]).map((route, i) => ({ route, key: `i${i}` })),
  )
  const [direction, setDirection] = useState<NavDirection>('tab')

  const push = useCallback(
    (route: Route) => {
      setDirection('push')
      setEntries((s) => [...s, entry(route)])
    },
    [entry],
  )

  const back = useCallback(() => {
    setDirection('back')
    setEntries((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }, [])

  const replace = useCallback(
    (route: Route) => {
      setDirection('replace')
      setEntries((s) => [...s.slice(0, -1), entry(route)])
    },
    [entry],
  )

  const goTab = useCallback(
    (route: Route) => {
      setDirection('tab')
      setEntries([entry(isTabRoute(route) ? route : { name: 'home' })])
    },
    [entry],
  )

  const reset = useCallback(
    (next: Route[]) => {
      setDirection('tab')
      setEntries((next.length ? next : [{ name: 'home' } as Route]).map(entry))
    },
    [entry],
  )

  const value = useMemo<NavValue>(() => {
    const stack = entries.map((e) => e.route)
    const current = stack[stack.length - 1]
    return {
      stack,
      keys: entries.map((e) => e.key),
      current,
      tab: tabOf(stack[0]),
      direction,
      canGoBack: stack.length > 1,
      push,
      back,
      replace,
      goTab,
      reset,
    }
  }, [entries, direction, push, back, replace, goTab, reset])

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav(): NavValue {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav precisa de NavProvider')
  return ctx
}
