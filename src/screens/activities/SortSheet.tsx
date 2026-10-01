import { useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { ChoiceList } from '../../components/fields'
import { Sheet } from '../../components/overlay'
import type { ActivitiesTab } from '../../nav/routes'
import { sortOptions, type SortKey } from './logic'

/**
 * Ordenação: aplica ao escolher e fecha. Setas do teclado só mudam a
 * escolha (sem fechar a folha); Enter, Espaço ou toque confirmam.
 */
export function SortSheet({
  open,
  onClose,
  value,
  onChange,
  tab,
}: {
  open: boolean
  onClose: () => void
  value: SortKey
  onChange: (value: SortKey) => void
  tab: ActivitiesTab
}) {
  const viaArrow = useRef(false)

  function onKeyDown(e: KeyboardEvent) {
    if (e.key.startsWith('Arrow')) viaArrow.current = true
    else if (e.key === 'Enter') {
      e.preventDefault()
      onClose()
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    if (e.key.startsWith('Arrow')) viaArrow.current = false
    else if (e.key === ' ') onClose()
  }
  function onClick(e: MouseEvent) {
    // Toque ou clique real (o teclado gera clique com detail 0).
    if (e.detail > 0 && (e.target as HTMLElement).closest('.choice')) onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Ordenar por" description="Toque em uma opção para aplicar.">
      <div onKeyDown={onKeyDown} onKeyUp={onKeyUp} onClick={onClick}>
        <ChoiceList
          name="acts-sort"
          legend="Ordenar por"
          hideLegend
          options={sortOptions(tab)}
          value={value}
          autoFocusSelected
          onChange={(v) => {
            onChange(v as SortKey)
            if (!viaArrow.current) onClose()
            viaArrow.current = false
          }}
        />
      </div>
    </Sheet>
  )
}
