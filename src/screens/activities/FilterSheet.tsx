import { Bookmark, Building2, Check } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '../../components/Button'
import { ChoiceList, SearchField, type ChoiceOption } from '../../components/fields'
import { Icon } from '../../components/Icon'
import { Sheet } from '../../components/overlay'
import { cx } from '../../lib/cx'
import { plural } from '../../lib/format'
import type { Place, Priority } from '../../store/types'
import { EMPTY_FILTERS, normalize, PRIORITY_OPTIONS, scheduleOptions, type Filters, type ScheduleFilter } from './logic'

const ANY_PLACE = 'any'

/**
 * Filtros em rascunho: nada muda na lista até tocar em "Aplicar filtros".
 * Fechar a folha (X, Escape, toque fora) descarta o rascunho.
 */
export function FilterSheet({
  open,
  onClose,
  initial,
  onApply,
  places,
  countFor,
  tabLabel,
  finished = false,
}: {
  open: boolean
  onClose: () => void
  initial: Filters
  onApply: (filters: Filters) => void
  places: Place[]
  /** Quantas atividades da aba atual ficam visíveis com estes filtros. */
  countFor: (filters: Filters) => number
  tabLabel: string
  /** Aba Finalizadas: filtros de data usam a finalização. */
  finished?: boolean
}) {
  const [draft, setDraft] = useState<Filters>(initial)
  const [placeTerm, setPlaceTerm] = useState('')
  const ids = useId()
  const count = countFor(draft)

  function togglePriority(p: Priority) {
    setDraft((d) => ({
      ...d,
      priorities: d.priorities.includes(p) ? d.priorities.filter((x) => x !== p) : [...d.priorities, p],
    }))
  }

  const needle = normalize(placeTerm)
  const matchingPlaces = places.filter(
    (p) =>
      !needle ||
      p.id === draft.placeId ||
      [p.name, p.company, p.address].some((v) => normalize(v).includes(needle)),
  )
  const placeOptions: ChoiceOption[] = [
    { value: ANY_PLACE, label: 'Qualquer local/pessoa' },
    ...matchingPlaces.map((p) => ({
      value: p.id,
      label: p.name,
      description: p.address,
      leading: <Icon icon={Building2} size={20} />,
    })),
  ]
  const noPlaceMatch = needle && matchingPlaces.every((p) => p.id === draft.placeId)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filtrar atividades"
      tall
      footer={
        <>
          <p className="t-small t-muted acts-filter__preview" aria-live="polite">
            A aba {tabLabel} vai mostrar {plural(count, 'atividade', 'atividades')}.
          </p>
          <div className="acts-sheet-actions">
            <Button
              variant="tertiary"
              onClick={() => {
                setDraft(EMPTY_FILTERS)
                setPlaceTerm('')
              }}
            >
              Limpar
            </Button>
            <Button onClick={() => onApply(draft)}>Aplicar filtros</Button>
          </div>
        </>
      }
    >
      <div className="acts-filter">
        <section className="acts-filter__section" aria-labelledby={`${ids}-views`}>
          <h3 id={`${ids}-views`} className="t-kicker t-muted">
            Visões salvas
          </h3>
          <p className="acts-filter__note t-small t-muted">
            <Icon icon={Bookmark} size={20} />
            <span>Nenhuma visão salva. As visões criadas na web aparecem aqui.</span>
          </p>
        </section>

        <section className="acts-filter__section" aria-labelledby={`${ids}-schedule`}>
          <h3 id={`${ids}-schedule`} className="t-kicker t-muted">
            {finished ? 'Data de finalização' : 'Agendamento'}
          </h3>
          <ChoiceList
            name="acts-filter-schedule"
            legend={finished ? 'Data de finalização' : 'Agendamento'}
            hideLegend
            options={scheduleOptions(finished)}
            value={draft.schedule}
            onChange={(v) => setDraft((d) => ({ ...d, schedule: v as ScheduleFilter }))}
          />
        </section>

        <section className="acts-filter__section" aria-labelledby={`${ids}-priority`}>
          <h3 id={`${ids}-priority`} className="t-kicker t-muted">
            Prioridade
          </h3>
          <p id={`${ids}-priority-help`} className="t-small t-muted acts-filter__help">
            Escolha uma ou mais.
          </p>
          <div
            className="acts-toggles"
            role="group"
            aria-labelledby={`${ids}-priority`}
            aria-describedby={`${ids}-priority-help`}
          >
            {PRIORITY_OPTIONS.map((p) => {
              const on = draft.priorities.includes(p.value)
              return (
                <button
                  key={p.value}
                  type="button"
                  className={cx('acts-toggle', on && 'is-on')}
                  aria-pressed={on}
                  onClick={() => togglePriority(p.value)}
                >
                  <Icon icon={on ? Check : p.icon} size={18} />
                  <span>{p.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="acts-filter__section" aria-labelledby={`${ids}-place`}>
          <h3 id={`${ids}-place`} className="t-kicker t-muted">
            Local/pessoa
          </h3>
          <SearchField
            value={placeTerm}
            onChange={setPlaceTerm}
            label="Buscar local/pessoa"
            placeholder="Buscar local/pessoa"
          />
          <ChoiceList
            name="acts-filter-place"
            legend="Local/pessoa"
            hideLegend
            options={placeOptions}
            value={draft.placeId ?? ANY_PLACE}
            onChange={(v) => setDraft((d) => ({ ...d, placeId: v === ANY_PLACE ? null : v }))}
          />
          {/* Região sempre montada: o leitor de tela anuncia quando a lista fica vazia. */}
          <p className="t-small t-muted acts-wrap" role="status">
            {noPlaceMatch ? `Nenhum local/pessoa encontrado para “${placeTerm.trim()}”.` : ''}
          </p>
        </section>
      </div>
    </Sheet>
  )
}
