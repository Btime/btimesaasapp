import { ArrowLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { initials } from '../lib/format'
import { useNav } from '../nav/nav'
import { IconButton } from './Button'
import { Icon } from './Icon'

/** Estrutura de uma tela: topo fixo, corpo com rolagem e rodapé opcional. */
export function Screen({
  children,
  className,
  tone = 'default',
}: {
  children: ReactNode
  className?: string
  /** `sunken` usa o fundo da página; `surface` usa branco (formulários). */
  tone?: 'default' | 'surface'
}) {
  return <div className={cx('screen', tone === 'surface' && 'screen--surface', className)}>{children}</div>
}

export function TopBar({
  title,
  subtitle,
  onBack,
  backLabel = 'Voltar',
  hideBack,
  actions,
  leading,
  large,
}: {
  title: string
  subtitle?: string
  /** Padrão: volta na pilha de navegação. */
  onBack?: () => void
  backLabel?: string
  hideBack?: boolean
  actions?: ReactNode
  /** Substitui o botão de voltar (ex.: "Pausar"). */
  leading?: ReactNode
  /** Título grande de raiz de aba, sem botão de voltar. */
  large?: boolean
}) {
  const nav = useNav()
  const showBack = !hideBack && !large && (onBack || nav.canGoBack)
  return (
    <header className={cx('topbar', large && 'topbar--large')}>
      <div className="topbar__start">
        {leading ??
          (showBack && <IconButton icon={ArrowLeft} label={backLabel} onClick={onBack ?? nav.back} />)}
      </div>
      <div className="topbar__title">
        <h1 className={large ? 't-h3' : 't-body-strong topbar__heading'}>{title}</h1>
        {subtitle && <p className="t-caption t-muted">{subtitle}</p>}
      </div>
      <div className="topbar__end">{actions}</div>
    </header>
  )
}

export function ScreenBody({
  children,
  className,
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return <div className={cx('screen__body', padded && 'screen__body--padded', className)}>{children}</div>
}

/** Rodapé fixo de ações da tela (uma ação primária dominante). */
export function ActionBar({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="action-bar">
      {note && <div className="action-bar__note t-small">{note}</div>}
      <div className="action-bar__buttons">{children}</div>
    </div>
  )
}

export function Section({
  title,
  action,
  children,
  className,
  id,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section className={cx('section', className)} aria-labelledby={title && id ? id : undefined}>
      {(title || action) && (
        <div className="section__head">
          {title && (
            <h2 id={id} className="t-kicker t-muted">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** Grupo de linhas com fundo de superfície (menus, definições). */
export function RowGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('row-group', className)}>{children}</div>
}

export function ListRow({
  icon,
  glyph,
  label,
  description,
  value,
  onClick,
  chevron = true,
  tone = 'default',
  trailing,
}: {
  icon?: LucideIcon
  glyph?: ReactNode
  label: string
  description?: ReactNode
  /** Valor atual à direita (ex.: "Português"). */
  value?: string
  onClick?: () => void
  chevron?: boolean
  tone?: 'default' | 'danger'
  trailing?: ReactNode
}) {
  const content = (
    <>
      {(icon || glyph) && (
        <span className="row__icon">{icon ? <Icon icon={icon} size={24} /> : glyph}</span>
      )}
      <span className="row__text">
        <span className="t-body-strong">{label}</span>
        {description && <span className="t-small t-muted">{description}</span>}
      </span>
      {value && <span className="row__value t-small t-muted">{value}</span>}
      {trailing}
      {onClick && chevron && <Icon icon={ChevronRight} size={20} className="row__chevron" />}
    </>
  )
  if (!onClick) return <div className={cx('row', `row--${tone}`)}>{content}</div>
  return (
    <button type="button" className={cx('row row--action', `row--${tone}`)} onClick={onClick}>
      {content}
    </button>
  )
}

/** Par rótulo/valor para telas de detalhe. */
export function DefinitionList({ items }: { items: Array<{ term: string; value: ReactNode; icon?: LucideIcon }> }) {
  return (
    <dl className="deflist">
      {items.map((item) => (
        <div key={item.term} className="deflist__item">
          {item.icon && <Icon icon={item.icon} size={20} className="deflist__icon" />}
          <div>
            <dt className="t-caption t-muted">{item.term}</dt>
            <dd className="t-body">{item.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

export function EmptyState({
  icon,
  glyph,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  glyph?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon ? <Icon icon={icon} size={32} /> : glyph}</div>
      <p className="t-body-strong">{title}</p>
      {description && <p className="t-small t-muted empty__desc">{description}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  )
}

export interface TabItem<T extends string> {
  value: T
  label: string
  count?: number
}

/** Abas segmentadas: tablist com foco roving, setas, Home e End. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  idPrefix: string
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  function onKeyDown(e: KeyboardEvent, index: number) {
    let next = index
    if (e.key === 'ArrowRight') next = (index + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    refs.current[next]?.focus()
    onChange(items[next].value)
  }
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((item, i) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.value}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            className={cx('tab', selected && 'is-selected')}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <span>{item.label}</span>
            {item.count !== undefined && <span className="tab__count t-tabular">{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ idPrefix, value, children }: { idPrefix: string; value: string; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`${idPrefix}-panel`} aria-labelledby={`${idPrefix}-tab-${value}`} tabIndex={-1}>
      {children}
    </div>
  )
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <div className="progress__fill" style={{ inlineSize: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Avatar({ name, size = 40, hue }: { name: string; size?: number; hue?: number }) {
  return (
    <span
      className={cx('avatar', hue !== undefined && 'avatar--photo')}
      style={{ inlineSize: size, blockSize: size, fontSize: size * 0.38, ['--avatar-hue' as string]: hue }}
      aria-hidden="true"
    >
      {hue === undefined && initials(name)}
    </span>
  )
}

/** Indicador de etapas para fluxos com várias telas. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="stepper">
      <p className="t-caption t-muted">
        Etapa {current + 1} de {steps.length}
        <span className="stepper__current-inline"> · {steps[current]}</span>
      </p>
      <ol className="stepper__list" aria-label="Etapas">
        {steps.map((step, i) => (
          <li
            key={step}
            className={cx('stepper__step', i < current && 'is-done', i === current && 'is-current')}
            aria-current={i === current ? 'step' : undefined}
          >
            <span className="stepper__bar" aria-hidden="true" />
            <span className="t-caption">
              {step}
              {i < current && <span className="visually-hidden"> (concluída)</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Caixa de mensagem contextual: explicação, sucesso, atenção ou erro. */
export function Callout({
  tone = 'info',
  icon,
  title,
  children,
  action,
}: {
  tone?: 'info' | 'success' | 'warning' | 'error' | 'brand'
  icon?: LucideIcon
  title?: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={cx('callout', `callout--${tone}`)} role={tone === 'error' ? 'alert' : undefined}>
      {icon && <Icon icon={icon} size={20} className="callout__icon" />}
      <div className="callout__body">
        {title && <p className="t-body-strong">{title}</p>}
        {children && <div className="t-small callout__text">{children}</div>}
        {action && <div className="callout__action">{action}</div>}
      </div>
    </div>
  )
}
