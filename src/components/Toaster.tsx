import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { cx } from '../lib/cx'
import { useToast } from '../store/store'
import { Icon } from './Icon'

/**
 * Avisos curtos e não bloqueantes. Só a mensagem fica na região aria-live;
 * os botões ficam fora dela. O tempo pausa com ponteiro ou foco no aviso, e,
 * se o aviso sair com o foco dentro, o foco volta para onde estava antes.
 */
export function Toaster() {
  const { toasts, dismissToast, pauseToast, resumeToast } = useToast()
  const lastOutside = useRef<HTMLElement | null>(null)
  const root = useRef<HTMLDivElement>(null)

  // Lembra o último foco fora dos avisos, para devolver se o aviso sumir.
  useLayoutEffect(() => {
    function onFocusIn(e: FocusEvent) {
      const el = e.target as HTMLElement
      if (!root.current?.contains(el)) lastOutside.current = el
    }
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }, [])

  function dismiss(id: string) {
    const hadFocus = root.current?.contains(document.activeElement)
    dismissToast(id)
    if (hadFocus) {
      requestAnimationFrame(() => {
        const back = lastOutside.current
        if (back?.isConnected && !back.closest('[inert]')) back.focus({ preventScroll: true })
      })
    }
  }

  return (
    <div ref={root} className="toaster">
      <div className="visually-hidden" role="status" aria-live="polite">
        {toasts.map((t) => (
          <p key={t.id}>{t.message}</p>
        ))}
      </div>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx('toast', t.tone && `toast--${t.tone}`)}
          onPointerEnter={() => pauseToast(t.id)}
          onPointerLeave={() => resumeToast(t.id)}
          onFocus={() => pauseToast(t.id)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resumeToast(t.id)
          }}
        >
          {t.tone === 'success' && <Icon icon={CircleCheck} size={20} className="toast__icon" />}
          {t.tone === 'error' && <Icon icon={CircleAlert} size={20} className="toast__icon" />}
          <p className="t-small toast__msg" aria-hidden="true">
            {t.message}
          </p>
          {t.action && (
            <button
              type="button"
              className="toast__action t-label"
              onClick={() => {
                t.action?.onAction()
                dismissToast(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
          <button type="button" className="toast__close" aria-label="Fechar aviso" onClick={() => dismiss(t.id)}>
            <Icon icon={X} size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}
