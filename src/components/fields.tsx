import { Check, CircleAlert, Search, X } from 'lucide-react'
import {
  useId,
  useRef,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { cx } from '../lib/cx'
import { Icon } from './Icon'

interface FieldShellProps {
  id: string
  label: string
  required?: boolean
  help?: ReactNode
  error?: string
  children: ReactNode
  /** Esconde visualmente o rótulo (continua acessível). */
  hideLabel?: boolean
}

function FieldShell({ id, label, required, help, error, children, hideLabel }: FieldShellProps) {
  return (
    <div className={cx('field', error && 'field--error')}>
      <label htmlFor={id} className={cx('field__label t-label', hideLabel && 'visually-hidden')}>
        {label}
        {required ? <span className="field__req"> (obrigatório)</span> : null}
      </label>
      {help && (
        <p id={`${id}-help`} className="field__help t-small">
          {help}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="field__error t-small" role="alert">
          <Icon icon={CircleAlert} size={16} />
          {error}
        </p>
      )}
    </div>
  )
}

function describedBy(id: string, help?: ReactNode, error?: string) {
  return [help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
}

export function TextField({
  label,
  required,
  help,
  error,
  hideLabel,
  className,
  id: idProp,
  ...input
}: Omit<ComponentPropsWithRef<'input'>, 'required'> & {
  label: string
  required?: boolean
  help?: ReactNode
  error?: string
  hideLabel?: boolean
}) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <FieldShell id={id} label={label} required={required} help={help} error={error} hideLabel={hideLabel}>
      <input
        id={id}
        className={cx('input', className)}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, help, error)}
        {...input}
      />
    </FieldShell>
  )
}

export function TextArea({
  label,
  required,
  help,
  error,
  className,
  id: idProp,
  rows = 4,
  ...input
}: Omit<ComponentPropsWithRef<'textarea'>, 'required'> & {
  label: string
  required?: boolean
  help?: ReactNode
  error?: string
}) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <FieldShell id={id} label={label} required={required} help={help} error={error}>
      <textarea
        id={id}
        rows={rows}
        className={cx('input input--area', className)}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, help, error)}
        {...input}
      />
    </FieldShell>
  )
}

export function SearchField({
  value,
  onChange,
  label = 'Buscar',
  placeholder = 'Buscar',
  autoFocus,
  ref,
  id: idProp,
  onKeyDown,
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  autoFocus?: boolean
  ref?: Ref<HTMLInputElement>
  id?: string
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}) {
  const auto = useId()
  const id = idProp ?? auto
  const inner = useRef<HTMLInputElement | null>(null)
  function setRef(el: HTMLInputElement | null) {
    inner.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) (ref as { current: HTMLInputElement | null }).current = el
  }
  return (
    <div className="search">
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <Icon icon={Search} size={20} className="search__icon" />
      <input
        ref={setRef}
        id={id}
        type="search"
        className="input search__input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        data-autofocus={autoFocus || undefined}
        enterKeyHint="search"
        onKeyDown={onKeyDown}
      />
      {value && (
        <button
          type="button"
          className="search__clear"
          aria-label="Limpar busca"
          onClick={() => {
            onChange('')
            inner.current?.focus()
          }}
        >
          <Icon icon={X} size={20} />
        </button>
      )}
    </div>
  )
}

export interface ChoiceOption {
  value: string
  label: string
  description?: string
  /** Conteúdo à esquerda (avatar, ícone). */
  leading?: ReactNode
  disabled?: boolean
  /** Idioma do rótulo, quando diferente do app (ex.: 'en'). */
  lang?: string
}

/**
 * Lista de escolha única (radio). Cada linha tem alvo de 56 px, estado
 * selecionado com forma (marcador preenchido + check) além da cor.
 */
export function ChoiceList({
  name,
  legend,
  hideLegend,
  options,
  value,
  onChange,
  error,
  required,
  help,
  id,
  autoFocusSelected,
}: {
  name: string
  legend: string
  hideLegend?: boolean
  options: ChoiceOption[]
  value: string | null | undefined
  onChange: (value: string) => void
  error?: string
  required?: boolean
  /** Texto de ajuda abaixo da legenda. */
  help?: ReactNode
  /** id aplicado à parada de Tab do grupo (opção marcada ou a primeira habilitada), para focar por código. */
  id?: string
  /** Dentro de uma folha, o foco inicial vai para a opção marcada. */
  autoFocusSelected?: boolean
}) {
  const errId = useId()
  const helpId = useId()
  const describe = [help ? helpId : null, error ? errId : null].filter(Boolean).join(' ') || undefined
  const stopValue = options.find((o) => o.value === value && !o.disabled)?.value ?? options.find((o) => !o.disabled)?.value
  return (
    <fieldset className={cx('choice-list', error && 'choice-list--error')} aria-describedby={describe}>
      <legend className={cx('choice-list__legend t-label', hideLegend && 'visually-hidden')}>
        {legend}
        {required ? <span className="field__req"> (obrigatório)</span> : null}
      </legend>
      {help && (
        <p id={helpId} className="field__help choice-list__help t-small">
          {help}
        </p>
      )}
      {error && (
        <p id={errId} className="field__error choice-list__error t-small" role="alert">
          <Icon icon={CircleAlert} size={16} />
          {error}
        </p>
      )}
      <div className="choice-list__items">
        {options.map((opt) => {
          const selected = opt.value === value
          const isStop = opt.value === stopValue
          return (
            <label key={opt.value} className={cx('choice', selected && 'is-selected', opt.disabled && 'is-disabled')}>
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                disabled={opt.disabled}
                onChange={() => onChange(opt.value)}
                className="choice__input"
                id={isStop ? id : undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={describe}
                data-autofocus={autoFocusSelected && isStop && value ? true : undefined}
              />
              {opt.leading && <span className="choice__leading">{opt.leading}</span>}
              <span className="choice__text">
                <span className="t-body-strong" lang={opt.lang}>
                  {opt.label}
                </span>
                {opt.description && <span className="t-small t-muted">{opt.description}</span>}
              </span>
              <span className="choice__mark" aria-hidden="true">
                {selected && <Icon icon={Check} size={16} />}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Interruptor acessível (checkbox com role switch). */
export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className={cx('switch-row', disabled && 'is-disabled')}>
      <label htmlFor={id} className="switch-row__text">
        <span className="t-body-strong">{label}</span>
        {description && <span className="t-small t-muted">{description}</span>}
      </label>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  )
}
