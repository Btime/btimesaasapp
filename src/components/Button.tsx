import type { LucideIcon } from 'lucide-react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cx } from '../lib/cx'
import { Icon } from './Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'danger-tertiary' | 'on-dark'

interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  block?: boolean
  loading?: boolean
  /** Rótulo durante o carregamento (ex.: "Enviando"). */
  loadingLabel?: string
  iconStart?: LucideIcon
  iconEnd?: LucideIcon
  /** Ícone já renderizado (ex.: BrandIcon). */
  leading?: ReactNode
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  loadingLabel,
  iconStart,
  iconEnd,
  leading,
  className,
  disabled,
  type = 'button',
  children,
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx('btn', `btn--${variant}`, size === 'sm' && 'btn--sm', block && 'btn--block', className)}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      {...rest}
    >
      <span className="btn__stack">
        <span className={cx('btn__content', loading && 'is-hidden')}>
          {leading}
          {iconStart && <Icon icon={iconStart} size={20} />}
          <span>{children}</span>
          {iconEnd && <Icon icon={iconEnd} size={20} />}
        </span>
        <span className={cx('btn__content', !loading && 'is-hidden')} aria-hidden={!loading}>
          {loading && <span className="spinner" aria-hidden="true" />}
          <span>{loadingLabel ?? children}</span>
        </span>
      </span>
    </button>
  )
}

/** Botão só com ícone: alvo de 44 px e nome acessível obrigatório. */
export function IconButton({
  icon,
  glyph,
  label,
  variant = 'ghost',
  className,
  type = 'button',
  badge,
  ...rest
}: Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  icon?: LucideIcon
  /** Alternativa a `icon` para BrandIcon ou SVG próprio. */
  glyph?: ReactNode
  label: string
  variant?: 'ghost' | 'on-dark' | 'filled'
  badge?: boolean
}) {
  return (
    <button
      type={type}
      className={cx('icon-btn', `icon-btn--${variant}`, className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      {icon ? <Icon icon={icon} size={24} /> : glyph}
      {badge && <span className="icon-btn__badge" aria-hidden="true" />}
    </button>
  )
}
