import { Camera, CircleAlert, FileImage, X } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { cx } from '../lib/cx'
import { makeId } from '../store/store'
import type { MediaItem } from '../store/types'
import { Icon } from './Icon'

/**
 * Anexo de fotos. No protótipo a câmera é simulada: "Adicionar foto" passa
 * por "Comprimindo" e gera uma miniatura. Estados: vazio, processando,
 * preenchido, erro (obrigatório) e desabilitado. O foco nunca se perde:
 * ao remover, vai para a foto vizinha (ou para "Adicionar foto").
 */
export function MediaField({
  label,
  help,
  required,
  value,
  onChange,
  error,
  disabled,
  max = 6,
  id: idProp,
}: {
  label: string
  help?: string
  required?: boolean
  value: MediaItem[]
  onChange: (items: MediaItem[]) => void
  error?: string
  disabled?: boolean
  max?: number
  /** id do botão "Adicionar foto", para focar por código. */
  id?: string
}) {
  const id = useId()
  const [busy, setBusy] = useState(false)
  const timer = useRef<number | null>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const listRef = useRef<HTMLUListElement>(null)
  const pendingFocus = useRef<{ kind: 'remove'; index: number } | { kind: 'add' } | { kind: 'last' } | null>(null)
  useLayoutEffect(() => {
    valueRef.current = value
    onChangeRef.current = onChange
  })
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  // Aplica o foco pendente depois que a lista renderiza.
  useLayoutEffect(() => {
    const p = pendingFocus.current
    if (!p || !listRef.current) return
    pendingFocus.current = null
    const removes = listRef.current.querySelectorAll<HTMLButtonElement>('.media-thumb__remove')
    const add = listRef.current.querySelector<HTMLButtonElement>('.media-add')
    if (p.kind === 'remove') (removes[Math.min(p.index, removes.length - 1)] ?? add)?.focus()
    else if (p.kind === 'last') removes[removes.length - 1]?.focus()
    else add?.focus()
  }, [value])

  function nextName(items: MediaItem[]): string {
    const nums = items.map((m) => Number(/(\d+)$/.exec(m.name)?.[1] ?? 0))
    return `Foto ${Math.max(0, ...nums) + 1}`
  }

  function add() {
    if (busy || disabled) return
    setBusy(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      const current = valueRef.current
      const n = current.length + 1
      const next = [...current, { id: makeId('foto'), hue: 250 + ((n * 37) % 80), name: nextName(current) }]
      // Se o botão de adicionar vai sumir (chegou ao máximo), o foco vai para a foto nova.
      const addFocused = document.activeElement?.classList.contains('media-add')
      if (addFocused && next.length >= max) pendingFocus.current = { kind: 'last' }
      onChangeRef.current(next)
      setBusy(false)
    }, 900)
  }

  function remove(index: number) {
    pendingFocus.current = { kind: 'remove', index }
    onChange(value.filter((_, i) => i !== index))
  }

  const helpId = help ? `${id}-help` : undefined
  const errId = error ? `${id}-error` : undefined
  const describe = [helpId, errId].filter(Boolean).join(' ') || undefined

  return (
    <div
      className={cx('media-field', error && 'media-field--error')}
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={describe}
    >
      <p id={`${id}-label`} className="field__label t-label">
        {label}
        {required ? <span className="field__req"> (obrigatório)</span> : null}
      </p>
      {help && (
        <p id={helpId} className="field__help t-small">
          {help}
        </p>
      )}
      <ul ref={listRef} className="media-field__grid">
        {value.map((item, index) => (
          <li key={item.id} className="media-thumb" style={{ ['--thumb-hue' as string]: item.hue }}>
            <Icon icon={FileImage} size={24} className="media-thumb__icon" />
            <span className="visually-hidden">{item.name}</span>
            {!disabled && (
              <button
                type="button"
                className="media-thumb__remove"
                aria-label={`Remover ${item.name}`}
                disabled={busy}
                onClick={() => remove(index)}
              >
                <Icon icon={X} size={16} />
              </button>
            )}
          </li>
        ))}
        {value.length < max && !disabled && (
          <li>
            <button
              type="button"
              id={idProp}
              className={cx('media-add', busy && 'is-busy')}
              onClick={add}
              aria-busy={busy || undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={describe}
            >
              {busy ? <span className="spinner" aria-hidden="true" /> : <Icon icon={Camera} size={24} />}
              <span className="t-caption">{busy ? 'Comprimindo' : 'Adicionar foto'}</span>
            </button>
          </li>
        )}
      </ul>
      <p className="visually-hidden" aria-live="polite">
        {busy
          ? `${label}: processando foto`
          : `${label}: ${value.length} ${value.length === 1 ? 'foto anexada' : 'fotos anexadas'}`}
      </p>
      {error && (
        <p id={errId} className="field__error t-small" role="alert">
          <Icon icon={CircleAlert} size={16} />
          {error}
        </p>
      )}
    </div>
  )
}
