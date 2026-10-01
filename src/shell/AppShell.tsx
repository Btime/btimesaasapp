import { BatteryFull, Signal, Wifi } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { Icon } from '../components/Icon'
import { ProgressBar } from '../components/layout'
import { OverlayHost, useOverlayOpen } from '../components/overlay'
import { Toaster } from '../components/Toaster'
import { cx } from '../lib/cx'
import { plural } from '../lib/format'
import { useResolvedTheme } from '../lib/theme'
import { useNav } from '../nav/nav'
import { isTabRoute, type Route } from '../nav/routes'
import { UpdateDialog } from '../screens/profile/UpdateDialog'
import { useStore, useToast } from '../store/store'
import { BottomNav } from './BottomNav'
import { SCREENS } from './screens'

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(t)
  }, [])
  return (
    <span className="t-tabular">
      {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

/** Barra de status simulada; só aparece dentro da moldura do aparelho. */
function StatusBar({ dark }: { dark: boolean }) {
  return (
    <div className={cx('status-bar', dark && 'status-bar--dark')} aria-hidden="true">
      <Clock />
      <span className="status-bar__icons">
        <Icon icon={Signal} size={16} />
        <Icon icon={Wifi} size={16} />
        <Icon icon={BatteryFull} size={20} />
      </span>
    </div>
  )
}

/**
 * Foco entre telas: ao abrir uma tela, o foco vai para o título dela (o leitor
 * de tela anuncia onde a pessoa está); ao voltar, retorna ao elemento que
 * abriu a tela. Não rouba o foco do painel do protótipo nem de folhas abertas.
 */
function useScreenFocus(container: React.RefObject<HTMLElement | null>, overlayOpen: boolean) {
  const nav = useNav()
  const lastFocus = useRef(new Map<string, HTMLElement>())
  const firstRun = useRef(true)
  /** Troca de tela que aconteceu com uma folha ainda saindo: o foco é aplicado quando ela sair. */
  const pending = useRef<{ key: string; direction: string } | null>(null)

  const applyFocus = useCallback(
    (topKey: string, direction: string) => {
      const app = container.current?.closest('.app')
      const layer = container.current?.querySelector<HTMLElement>(`.screen-layer[data-key="${topKey}"]`)
      if (!layer) return
      if (direction === 'back') {
        const saved = lastFocus.current.get(topKey)
        if (saved && saved.isConnected && layer.contains(saved)) {
          saved.focus({ preventScroll: true })
          return
        }
      }
      // Em troca de aba pelo menu inferior, o foco fica no menu.
      const now = document.activeElement
      if (direction === 'tab' && now && now !== document.body && app?.contains(now) && !now.closest('[inert]')) return
      const heading = layer.querySelector<HTMLElement>('h1')
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: true })
      }
    },
    [container],
  )

  useEffect(() => {
    const el = container.current
    if (!el) return
    function onFocusIn(e: FocusEvent) {
      const layer = (e.target as HTMLElement).closest<HTMLElement>('.screen-layer')
      const key = layer?.dataset.key
      if (key) lastFocus.current.set(key, e.target as HTMLElement)
    }
    el.addEventListener('focusin', onFocusIn)
    return () => el.removeEventListener('focusin', onFocusIn)
  }, [container])

  const keysSig = nav.keys.join('|')
  useLayoutEffect(() => {
    // Guarda o foco da camada que acabou de ficar por baixo (antes de o inert tirar o foco dela).
    const act = document.activeElement as HTMLElement | null
    const actLayer = act?.closest<HTMLElement>('.screen-layer')?.dataset.key
    if (act && actLayer && actLayer !== nav.keys[nav.keys.length - 1]) lastFocus.current.set(actLayer, act)
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    // Esquece camadas que saíram da pilha.
    for (const k of Array.from(lastFocus.current.keys())) if (!nav.keys.includes(k)) lastFocus.current.delete(k)
    const app = container.current?.closest('.app')
    const active = document.activeElement
    if (active && active !== document.body && app && !app.contains(active)) return
    const topKey = nav.keys[nav.keys.length - 1]
    const direction = nav.direction
    if (overlayOpen) {
      // A tela mudou a partir de uma folha/diálogo: espera a sobreposição sair.
      pending.current = { key: topKey, direction }
      return
    }
    const raf = requestAnimationFrame(() => applyFocus(topKey, direction))
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysSig])

  // Quando a sobreposição sai, aplica o foco pendente da troca de tela.
  useEffect(() => {
    if (overlayOpen || !pending.current) return
    const { key, direction } = pending.current
    if (!nav.keys.includes(key)) {
      pending.current = null
      return
    }
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        // Só agora o pedido sai da fila: se uma renderização cancelar os quadros, ele é refeito.
        pending.current = null
        const now = document.activeElement
        // Se o retorno de foco da sobreposição já pôs o foco num elemento válido da tela nova, mantém.
        const layer = container.current?.querySelector(`.screen-layer[data-key="${key}"]`)
        if (now && now !== document.body && layer?.contains(now)) return
        applyFocus(key, direction)
      })
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [overlayOpen, nav.keys, applyFocus, container])
}

/** Avisa a falha de sincronização em qualquer tela, não só na Início. */
function useSyncOutcome() {
  const { state } = useStore()
  const { showToast } = useToast()
  const nav = useNav()
  const prev = useRef(state.sync.status)
  const navRef = useRef(nav)
  useLayoutEffect(() => {
    navRef.current = nav
  })
  useEffect(() => {
    const before = prev.current
    prev.current = state.sync.status
    if (before === 'syncing' && state.sync.status === 'error') {
      const failed = state.sync.entities.filter((e) => e.status === 'error').length
      showToast({
        tone: 'error',
        message: `A sincronização falhou em ${plural(failed, 'item', 'itens')}.`,
        action:
          navRef.current.current.name === 'sync'
            ? undefined
            : {
                label: 'Ver erro',
                // Decide na hora do toque: se a pessoa já abriu Sincronização, não empilha outra.
                onAction: () => {
                  if (navRef.current.current.name !== 'sync') navRef.current.push({ name: 'sync' })
                },
              },
      })
    }
  }, [state.sync.status, state.sync.entities, showToast])
}


/** Elementos fixos na base que o aviso nunca pode cobrir. */
const BOTTOM_UI =
  '.screen-layer.is-top .action-bar, .screen-layer.is-top .act-done__footer, .screen-layer.is-top .prof-composer, ' +
  '.screen-layer.is-top .acts-fab, .bottom-nav, .overlay:not(.is-closing) .sheet__footer'

/**
 * Mede o que está na base da tela atual e posiciona os avisos acima disso
 * (--toast-offset no .app). Acompanha mudanças de altura (nota na barra,
 * botões empilhados em telas estreitas, folhas que abrem).
 */
function useToastOffset(appRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const app = appRef.current
    if (!app) return
    let raf = 0
    const measure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const box = app.getBoundingClientRect()
        let covered = 0
        app.querySelectorAll<HTMLElement>(BOTTOM_UI).forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.height === 0) return
          covered = Math.max(covered, box.bottom - r.top)
        })
        app.style.setProperty('--toast-offset', `${Math.round(covered + 16)}px`)
      })
    }
    const resize = new ResizeObserver(measure)
    const watch = () => {
      resize.disconnect()
      resize.observe(app)
      app.querySelectorAll<HTMLElement>(BOTTOM_UI).forEach((el) => resize.observe(el))
      measure()
    }
    const mutations = new MutationObserver(watch)
    mutations.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    watch()
    return () => {
      cancelAnimationFrame(raf)
      resize.disconnect()
      mutations.disconnect()
    }
  }, [appRef])
}

export function AppShell({ framed }: { framed: boolean }) {
  const nav = useNav()
  const { state } = useStore()
  const overlayOpen = useOverlayOpen()
  const theme = useResolvedTheme()
  const screensRef = useRef<HTMLElement>(null)
  const appRef = useRef<HTMLDivElement>(null)
  const showNav = isTabRoute(nav.current)
  const darkTop = nav.current.name === 'home' || nav.current.name === 'scan'
  const syncing = state.sync.status === 'syncing'

  useScreenFocus(screensRef, overlayOpen)
  useToastOffset(appRef)
  useSyncOutcome()

  // Cor da barra do navegador acompanha o topo da tela atual.
  useEffect(() => {
    if (framed) return
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) return
    const css = getComputedStyle(document.documentElement)
    meta.content = (darkTop ? css.getPropertyValue('--header-bg') : css.getPropertyValue('--surface')).trim()
  }, [darkTop, framed, theme])

  return (
    <div
      ref={appRef}
      className={cx('app', framed && 'app--framed', showNav && 'app--with-nav')}
      data-direction={nav.direction}
    >
      {framed ? (
        <StatusBar dark={darkTop || theme === 'dark'} />
      ) : (
        <div className={cx('safe-top', darkTop && 'safe-top--dark')} aria-hidden="true" />
      )}
      {syncing && nav.current.name !== 'home' && (
        <div className="app__syncbar">
          <ProgressBar value={state.sync.progress} label="Sincronizando" />
        </div>
      )}
      <div className="app__main" inert={overlayOpen || undefined}>
        <main ref={screensRef} className="app__screens">
          {nav.stack.map((route, i) => {
            const Component = SCREENS[route.name] as ComponentType<{ route: Route }>
            const top = i === nav.stack.length - 1
            const key = nav.keys[i]
            return (
              <div
                key={key}
                data-key={key}
                className={cx('screen-layer', top && 'is-top', top && i > 0 && 'is-pushed')}
                inert={!top || undefined}
                aria-hidden={!top || undefined}
              >
                <Component route={route} />
              </div>
            )
          })}
        </main>
        {showNav && <BottomNav />}
      </div>
      <OverlayHost />
      <Toaster />
      <UpdateDialog />
    </div>
  )
}
