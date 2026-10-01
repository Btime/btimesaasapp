import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cx } from '../lib/cx'
import { IconButton } from './Button'

/**
 * Sobreposições reais: foco inicial, Escape, foco contido, retorno ao
 * disparador e o resto do app marcado como inert enquanto estão abertas.
 * Renderizam dentro do aparelho (OverlayHost), não no body.
 *
 * Pilha: só a sobreposição do topo é interativa; as de baixo e as que estão
 * saindo ficam inert. Ao trocar uma folha por outra (ex.: diálogo -> folha),
 * a nova herda o alvo de retorno da que saiu.
 */

/** Duração da saída; espelha --motion-exit em app-tokens.css. */
const EXIT_MS = 240

interface OverlayValue {
  host: HTMLElement | null
  setHost: (el: HTMLElement | null) => void
  stack: string[]
  register: (id: string) => void
  unregister: (id: string) => void
  /** Alvo de retorno compartilhado entre sobreposições que se sucedem. */
  returnRef: RefObject<{ target: HTMLElement | null; raf: number }>
}

const OverlayContext = createContext<OverlayValue | null>(null)

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [stack, setStack] = useState<string[]>([])
  const returnRef = useRef({ target: null as HTMLElement | null, raf: 0 })
  const register = useCallback((id: string) => {
    setStack((s) => (s.includes(id) ? s : [...s, id]))
  }, [])
  const unregister = useCallback((id: string) => {
    setStack((s) => s.filter((x) => x !== id))
  }, [])
  const value = useMemo(
    () => ({ host, setHost, stack, register, unregister, returnRef }),
    [host, stack, register, unregister],
  )
  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
}

/** Ponto de montagem das sobreposições, dentro da área do app. */
export function OverlayHost() {
  const ctx = useContext(OverlayContext)
  const ref = useRef<HTMLDivElement>(null)
  const setHost = ctx?.setHost
  useLayoutEffect(() => {
    setHost?.(ref.current)
    return () => setHost?.(null)
  }, [setHost])
  return <div ref={ref} className="overlay-host" />
}

/** Verdadeiro enquanto houver folha ou diálogo aberto (o app fica inert). */
export function useOverlayOpen(): boolean {
  const ctx = useContext(OverlayContext)
  return (ctx?.stack.length ?? 0) > 0
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Paradas reais de Tab: um rádio por grupo, nada inert, oculto ou invisível. */
function tabStops(panel: HTMLElement): HTMLElement[] {
  const all = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest('[inert],[hidden]') && el.getClientRects().length > 0,
  )
  const seenGroups = new Set<string>()
  return all.filter((el) => {
    if (!(el instanceof HTMLInputElement) || el.type !== 'radio' || !el.name) return true
    if (seenGroups.has(el.name)) return false
    const group = all.filter(
      (o): o is HTMLInputElement => o instanceof HTMLInputElement && o.type === 'radio' && o.name === el.name,
    )
    const stop = group.find((o) => o.checked) ?? group[0]
    if (stop === el) {
      seenGroups.add(el.name)
      return true
    }
    return false
  })
}

type InitialFocus = 'first' | 'last-action'

function useModalBehavior(
  open: boolean,
  active: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
  initial: InitialFocus = 'first',
) {
  const ctx = useContext(OverlayContext)
  const id = useId()
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })
  const focusedOnce = useRef(false)
  const register = ctx?.register
  const unregister = ctx?.unregister
  const returnRef = ctx?.returnRef

  // Captura o disparador no instante em que open vira verdadeiro (antes de o foco entrar no painel).
  const trigger = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    if (!open) return
    const a = document.activeElement as HTMLElement | null
    trigger.current = a && a !== document.body && !a.closest('.overlay.is-closing') ? a : null
  }, [open])

  // Registro na pilha e alvo de retorno.
  useEffect(() => {
    if (!active || !register || !unregister || !returnRef) return
    const shared = returnRef.current
    cancelAnimationFrame(shared.raf)
    // Sem disparador próprio (ex.: o foco estava numa sobreposição que está saindo), herda o alvo dela.
    const target = trigger.current ?? shared.target
    shared.target = target
    register(id)
    return () => {
      unregister(id)
      shared.target = target
      // Espera o React tirar o inert do app antes de devolver o foco.
      shared.raf = requestAnimationFrame(() => {
        shared.raf = requestAnimationFrame(() => {
          const el = shared.target
          if (el && el.isConnected && !el.closest('[inert]')) {
            const current = document.activeElement
            if (!current || current === document.body || current.closest('[inert]')) {
              el.focus({ preventScroll: true })
            }
          }
          shared.target = null
        })
      })
    }
  }, [active, id, register, unregister, returnRef])

  // Foco inicial, quando o painel existe de fato no host atual. O rAF só é
  // cancelado ao fechar ou desmontar, não a cada nova renderização.
  const host = ctx?.host
  const focusRaf = useRef(0)
  useLayoutEffect(() => {
    if (!active) {
      focusedOnce.current = false
      cancelAnimationFrame(focusRaf.current)
      return
    }
    if (focusedOnce.current) return
    const panel = panelRef.current
    if (!panel || !host?.contains(panel)) return
    focusedOnce.current = true
    focusRaf.current = requestAnimationFrame(() => {
      const auto = panel.querySelector<HTMLElement>('[data-autofocus]')
      let first: HTMLElement | undefined = auto ?? undefined
      if (!first && initial === 'last-action') {
        const actions = panel.querySelectorAll<HTMLElement>('.dialog__actions button:not([disabled])')
        first = actions[actions.length - 1]
      }
      if (!first) first = tabStops(panel)[0]
      ;(first ?? panel).focus({ preventScroll: true })
    })
  })
  // No StrictMode a montagem roda os efeitos duas vezes: ao limpar, libera o foco inicial para a próxima execução.
  useEffect(
    () => () => {
      cancelAnimationFrame(focusRaf.current)
      focusedOnce.current = false
    },
    [],
  )

  // Antes de entrar na pilha (primeiro quadro), a sobreposição já é tratada como a do topo.
  const isTop = !!ctx && (ctx.stack[ctx.stack.length - 1] === id || !ctx.stack.includes(id))

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      const panel = panelRef.current
      if (!panel) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = tabStops(panel)
      if (items.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement as HTMLElement | null
      const inside = current ? items.includes(current) : false
      if (e.shiftKey && (current === first || current === panel || !inside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (current === last || !inside)) {
        e.preventDefault()
        first.focus()
      }
    },
    [panelRef],
  )

  return { isTop, onKeyDown }
}

/** Mantém o componente montado durante a animação de saída. */
function usePresence(open: boolean, ms = EXIT_MS) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (open) {
      setMounted(true)
      let inner = 0
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setVisible(true))
      })
      return () => {
        cancelAnimationFrame(outer)
        cancelAnimationFrame(inner)
      }
    }
    setVisible(false)
    const t = window.setTimeout(() => setMounted(false), ms)
    return () => window.clearTimeout(t)
  }, [open, ms])
  return { mounted, visible }
}

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  /** Texto de apoio abaixo do título. */
  description?: ReactNode
  /** Rótulo pequeno acima do título (ex.: código da atividade). */
  kicker?: string
  children?: ReactNode
  /** Ações fixas no rodapé da folha. */
  footer?: ReactNode
  /** Ocupa quase toda a altura (listas longas). */
  tall?: boolean
  hideClose?: boolean
}

/** Folha inferior modal. */
export function Sheet({ open, onClose, title, description, kicker, children, footer, tall, hideClose }: SheetProps) {
  const ctx = useContext(OverlayContext)
  const panelRef = useRef<HTMLDivElement>(null)
  const { mounted, visible } = usePresence(open)
  const titleId = useId()
  const descId = useId()
  const { isTop, onKeyDown } = useModalBehavior(open, open && mounted, onClose, panelRef)
  if (!mounted || !ctx?.host) return null
  const interactive = open && isTop
  return createPortal(
    <div className={cx('overlay', visible && 'is-visible', !open && 'is-closing')} inert={!interactive || undefined}>
      <div className="overlay__scrim" onClick={open ? onClose : undefined} aria-hidden="true" />
      <div
        ref={panelRef}
        className={cx('sheet', tall && 'sheet--tall')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <div className="sheet__handle" aria-hidden="true" />
        <header className="sheet__header">
          <div className="sheet__heading">
            {kicker && <p className="t-caption t-muted">{kicker}</p>}
            <h2 id={titleId} className="t-title">
              {title}
            </h2>
            {description && (
              <div id={descId} className="t-small t-muted sheet__description">
                {description}
              </div>
            )}
          </div>
          {!hideClose && <IconButton icon={X} label="Fechar" onClick={onClose} className="sheet__close" />}
        </header>
        {children && <div className="sheet__body">{children}</div>}
        {footer && <footer className="sheet__footer">{footer}</footer>}
      </div>
    </div>,
    ctx.host,
  )
}

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children?: ReactNode
  /**
   * Botões, do mais importante para o menos (empilhados). Em tom danger ou
   * warning, o foco inicial vai para o último (o menos arriscado), a menos
   * que um botão tenha data-autofocus.
   */
  actions: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'danger' | 'warning'
}

/** Diálogo central de confirmação (alertdialog). */
export function Dialog({ open, onClose, title, children, actions, icon, tone = 'default' }: DialogProps) {
  const ctx = useContext(OverlayContext)
  const panelRef = useRef<HTMLDivElement>(null)
  const { mounted, visible } = usePresence(open)
  const titleId = useId()
  const descId = useId()
  const { isTop, onKeyDown } = useModalBehavior(
    open,
    open && mounted,
    onClose,
    panelRef,
    tone === 'default' ? 'first' : 'last-action',
  )
  if (!mounted || !ctx?.host) return null
  const interactive = open && isTop
  return createPortal(
    <div
      className={cx('overlay overlay--center', visible && 'is-visible', !open && 'is-closing')}
      inert={!interactive || undefined}
    >
      <div className="overlay__scrim" onClick={open ? onClose : undefined} aria-hidden="true" />
      <div
        ref={panelRef}
        className={cx('dialog', `dialog--${tone}`)}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        {icon && <div className="dialog__icon">{icon}</div>}
        <h2 id={titleId} className="t-title">
          {title}
        </h2>
        {children && (
          <div id={descId} className="dialog__body t-body">
            {children}
          </div>
        )}
        <div className="dialog__actions">{actions}</div>
      </div>
    </div>,
    ctx.host,
  )
}
