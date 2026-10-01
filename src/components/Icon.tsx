import type { LucideIcon } from 'lucide-react'

/**
 * Ícones funcionais de interface (lucide), com o traço 1,4/24 da
 * família oficial. Conceitos que existem na família btime usam BrandIcon.
 */
export function Icon({
  icon: Glyph,
  size = 20,
  label,
  className,
}: {
  icon: LucideIcon
  size?: number
  /** Só para ícone informativo sem texto ao lado. */
  label?: string
  className?: string
}) {
  return (
    <Glyph
      size={size}
      strokeWidth={1.4}
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable={false}
    />
  )
}
