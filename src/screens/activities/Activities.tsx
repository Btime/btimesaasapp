import {
  ArrowUpDown,
  FunnelX,
  Info,
  List,
  ListCollapse,
  Plus,
  ScanLine,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ActivityCard } from '../../components/ActivityCard'
import { BrandIcon } from '../../components/BrandIcon'
import { Button, IconButton } from '../../components/Button'
import { SearchField } from '../../components/fields'
import { Icon } from '../../components/Icon'
import { Callout, EmptyState, Screen, ScreenBody, TabPanel, Tabs, TopBar, type TabItem } from '../../components/layout'
import { cx } from '../../lib/cx'
import { plural } from '../../lib/format'
import { useNav } from '../../nav/nav'
import type { ActivitiesTab, Route } from '../../nav/routes'
import { getPlace } from '../../store/selectors'
import { useStore } from '../../store/store'
import type { Activity, ActivityStatus } from '../../store/types'
import { FilterSheet } from './FilterSheet'
import {
  countActiveFilters,
  DEFAULT_SORT,
  EMPTY_FILTERS,
  matchesFilters,
  matchesSearch,
  selectTab,
  SORT_SUMMARY,
  sortActivities,
  TAB_LABEL,
  TAB_STATUSES,
  type Filters,
  type SortKey,
  type ViewMode,
} from './logic'
import { SortSheet } from './SortSheet'
import { StatusGroups } from './StatusGroups'
import './activities.css'

const ID = 'acts'

/** Foca um elemento depois que o React aplicou a mudança na tela. */
function focusSoon(selector: string) {
  requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true }))
}

const TAB_PHRASE: Record<ActivitiesTab, string> = {
  minhas: 'nas suas atividades',
  grupo: 'nas atividades do grupo',
  finalizadas: 'nas finalizadas',
}

const TAB_ACTION: Record<ActivitiesTab, string> = {
  minhas: 'Ver nas suas atividades',
  grupo: 'Ver atividades do grupo',
  finalizadas: 'Ver nas finalizadas',
}

export function Activities({ route }: { route: Extract<Route, { name: 'activities' }> }) {
  const { state } = useStore()
  const nav = useNav()
  const inGroup = state.prototype.inGroup

  const [tabState, setTab] = useState<ActivitiesTab>(route.tab ?? 'minhas')
  const tab: ActivitiesTab = tabState === 'grupo' && !inGroup ? 'minhas' : tabState
  const [view, setView] = useState<ViewMode>('lista')
  const [searchOpen, setSearchOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [sort, setSort] = useState<SortKey>(DEFAULT_SORT)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [sheet, setSheet] = useState<'sort' | 'filter' | null>(null)
  /** Cada abertura do filtro começa um rascunho novo a partir dos filtros aplicados. */
  const [filterSession, setFilterSession] = useState(0)
  const [collapsed, setCollapsed] = useState<ActivityStatus[]>([])
  const topRef = useRef<HTMLDivElement>(null)

  const tabs: ActivitiesTab[] = inGroup ? ['minhas', 'grupo', 'finalizadas'] : ['minhas', 'finalizadas']
  const lists: Record<ActivitiesTab, Activity[]> = {
    minhas: selectTab(state, 'minhas'),
    grupo: selectTab(state, 'grupo'),
    finalizadas: selectTab(state, 'finalizadas'),
  }
  const tabItems: TabItem<ActivitiesTab>[] = tabs.map((t) => ({ value: t, label: TAB_LABEL[t], count: lists[t].length }))

  const searchFor = (list: Activity[]) =>
    term.trim() ? list.filter((a) => matchesSearch(a, getPlace(state, a.placeId), term)) : list
  const base = lists[tab]
  const searched = searchFor(base)
  const visible = sortActivities(
    searched.filter((a) => matchesFilters(a, filters)),
    sort,
    state.places,
    tab,
  )
  const filterCount = countActiveFilters(filters)
  const hasTerm = term.trim().length > 0
  // No vazio de Minhas, a ação fica só no estado vazio (sem duplicar com o botão flutuante).
  const showFab = tab !== 'finalizadas' && base.length > 0

  const open = (a: Activity) => nav.push({ name: 'activity', id: a.id })

  function changeTab(next: ActivitiesTab) {
    setTab(next)
    topRef.current?.closest('.screen__body')?.scrollTo({ top: 0 })
  }

  function toggleSearch() {
    if (searchOpen) setTerm('')
    setSearchOpen((v) => !v)
  }

  function onSearchKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Escape') return
    e.preventDefault()
    setTerm('')
    setSearchOpen(false)
    focusSoon(`#${ID}-search-toggle`)
  }

  function clearSearch() {
    setTerm('')
    focusSoon(`#${ID}-search input`)
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    focusSoon(`#${ID}-panel`)
  }

  function openFilter() {
    setFilterSession((n) => n + 1)
    setSheet('filter')
  }

  function toggleGroup(status: ActivityStatus) {
    setCollapsed((c) => (c.includes(status) ? c.filter((s) => s !== status) : [...c, status]))
  }

  // Linha de resultado (anunciada ao mudar).
  let result = plural(visible.length, 'atividade', 'atividades')
  if (hasTerm) result += ` para “${term.trim()}”`
  if (sort !== DEFAULT_SORT) result += ` · ${SORT_SUMMARY[sort]}`

  function renderContent(): ReactNode {
    if (base.length === 0) return <TabEmpty tab={tab} groupName={state.user.groupName} onNew={() => nav.push({ name: 'new' })} />

    if (visible.length === 0) {
      // Procura nas outras abas para não parecer que a atividade "sumiu".
      const elsewhere = tabs
        .filter((t) => t !== tab)
        .map((t) => ({ tab: t, count: searchFor(lists[t]).filter((a) => matchesFilters(a, filters)).length }))
        .find((t) => t.count > 0)
      const hint = elsewhere ? ` Há ${plural(elsewhere.count, 'resultado', 'resultados')} ${TAB_PHRASE[elsewhere.tab]}.` : ''
      return (
        <EmptyState
          icon={hasTerm ? SearchX : FunnelX}
          title={hasTerm ? `Nada encontrado para “${term.trim()}”` : 'Nenhuma atividade com esses filtros'}
          description={
            (hasTerm
              ? 'Confira a grafia ou busque pelo título, código, local ou endereço.'
              : 'Mude ou limpe os filtros para ver mais atividades.') + hint
          }
          action={
            <div className="acts-empty-actions">
              {hasTerm ? (
                <Button variant="secondary" onClick={clearSearch}>
                  Limpar busca
                </Button>
              ) : (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
              {elsewhere ? (
                <Button
                  variant="tertiary"
                  onClick={() => {
                    changeTab(elsewhere.tab)
                    focusSoon(`#${ID}-tab-${elsewhere.tab}`)
                  }}
                >
                  {TAB_ACTION[elsewhere.tab]}
                </Button>
              ) : (
                hasTerm &&
                filterCount > 0 && (
                  <Button variant="tertiary" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                )
              )}
            </div>
          }
        />
      )
    }

    if (view === 'status') {
      return (
        <StatusGroups
          statuses={TAB_STATUSES[tab]}
          activities={visible}
          collapsed={collapsed}
          onToggle={toggleGroup}
          onOpen={open}
        />
      )
    }
    return (
      <div className="card-list">
        {visible.map((a) => (
          <ActivityCard key={a.id} activity={a} onOpen={open} />
        ))}
      </div>
    )
  }

  return (
    <Screen className="acts">
      <TopBar
        title="Atividades"
        large
        actions={
          <>
            <IconButton
              id={`${ID}-search-toggle`}
              icon={searchOpen ? X : Search}
              label={searchOpen ? 'Fechar busca' : 'Buscar atividades'}
              aria-expanded={searchOpen}
              aria-controls={searchOpen ? `${ID}-search` : undefined}
              onClick={toggleSearch}
            />
            <IconButton icon={ScanLine} label="Ler QR Code" onClick={() => nav.push({ name: 'scan' })} />
          </>
        }
      />

      <div className="acts-head">
        {searchOpen && (
          <div id={`${ID}-search`} className="acts-search" onKeyDown={onSearchKeyDown}>
            <SearchField
              value={term}
              onChange={setTerm}
              label="Buscar atividades"
              placeholder="Título, código ou local"
              autoFocus
            />
          </div>
        )}

        <Tabs items={tabItems} value={tab} onChange={changeTab} label="Atividades" idPrefix={ID} />

        <div className="acts-tools">
          <Button
            variant="secondary"
            size="sm"
            iconStart={ArrowUpDown}
            className="acts-tool"
            aria-haspopup="dialog"
            onClick={() => setSheet('sort')}
          >
            Ordenar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconStart={SlidersHorizontal}
            className={cx('acts-tool', filterCount > 0 && 'is-active')}
            aria-haspopup="dialog"
            onClick={openFilter}
          >
            Filtrar
            {filterCount > 0 && (
              <>
                <span aria-hidden="true"> · {filterCount}</span>
                <span className="visually-hidden">, {plural(filterCount, 'filtro ativo', 'filtros ativos')}</span>
              </>
            )}
          </Button>
          <div className="acts-view" role="group" aria-label="Visualização">
            <ViewButton icon={List} label="Lista" selected={view === 'lista'} onClick={() => setView('lista')} />
            <ViewButton
              icon={ListCollapse}
              label="Por status"
              selected={view === 'status'}
              onClick={() => setView('status')}
            />
          </div>
        </div>
      </div>

      <ScreenBody className={cx('acts-body', showFab && 'acts-body--fab')}>
        <div ref={topRef}>
          <TabPanel idPrefix={ID} value={tab}>
            {tab === 'finalizadas' && base.length > 0 && (
              <div className="acts-callout">
                <Callout tone="brand" icon={Info}>
                  Concluídas, recusadas e improdutivas ficam aqui. Depois de concluir, só o gestor pode editar as
                  respostas.
                </Callout>
              </div>
            )}
            <div className="acts-result">
              <p className={cx('t-small t-muted', base.length === 0 && 'visually-hidden')} aria-live="polite">
                {result}
              </p>
              {filterCount > 0 && visible.length > 0 && (
                <Button variant="tertiary" size="sm" className="acts-result__clear" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
            {renderContent()}
          </TabPanel>
        </div>
      </ScreenBody>

      {showFab && (
        <Button iconStart={Plus} className="acts-fab" onClick={() => nav.push({ name: 'new' })}>
          Nova atividade
        </Button>
      )}

      <SortSheet
        open={sheet === 'sort'}
        onClose={() => setSheet(null)}
        value={sort}
        onChange={setSort}
        tab={tab}
      />
      <FilterSheet
        key={filterSession}
        finished={tab === 'finalizadas'}
        open={sheet === 'filter'}
        onClose={() => setSheet(null)}
        initial={filters}
        onApply={(next) => {
          setFilters(next)
          setSheet(null)
        }}
        places={state.places}
        countFor={(f) => searched.filter((a) => matchesFilters(a, f)).length}
        tabLabel={TAB_LABEL[tab]}
      />
    </Screen>
  )
}

function ViewButton({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: LucideIcon
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cx('acts-view__btn', selected && 'is-selected')}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon icon={icon} size={20} />
    </button>
  )
}

function TabEmpty({ tab, groupName, onNew }: { tab: ActivitiesTab; groupName: string; onNew: () => void }) {
  if (tab === 'grupo') {
    return (
      <EmptyState
        glyph={<BrandIcon name="pessoas" size={32} />}
        title="Nenhuma atividade no grupo"
        description={`Quando o gestor abrir uma atividade para ${groupName}, ela aparece aqui.`}
      />
    )
  }
  if (tab === 'finalizadas') {
    return (
      <EmptyState
        glyph={<BrandIcon name="documento" size={32} />}
        title="Nenhuma atividade finalizada"
        description="Quando você concluir, recusar ou tornar improdutiva uma atividade, ela aparece aqui."
      />
    )
  }
  return (
    <EmptyState
      glyph={<BrandIcon name="resultado" size={32} />}
      title="Nenhuma atividade para você"
      description="Quando uma atividade for atribuída a você, ela aparece aqui. Você também pode abrir uma nova."
      action={
        <Button variant="secondary" iconStart={Plus} onClick={onNew}>
          Nova atividade
        </Button>
      }
    />
  )
}
