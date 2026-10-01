/**
 * Assinaturas oficiais btime (SVGs do kit, nunca redigitadas).
 * Assinatura digital: 160 px recomendados, 120 px mínimos. Símbolo: mínimo 24 px.
 */
type Variant = 'horizontal' | 'vertical' | 'simbolo' | 'lettering'
type Tone = 'noite' | 'violeta' | 'lavanda' | 'branco' | 'branco-frio'

export function BrandMark({
  variant = 'horizontal',
  tone = 'noite',
  width,
  decorative = false,
  className,
}: {
  variant?: Variant
  tone?: Tone
  width: number
  decorative?: boolean
  className?: string
}) {
  return (
    <img
      src={`/btime/assinaturas/btime-${variant}-${tone}.svg`}
      alt={decorative ? '' : 'btime'}
      width={width}
      style={{ height: 'auto' }}
      className={className}
      draggable={false}
    />
  )
}
