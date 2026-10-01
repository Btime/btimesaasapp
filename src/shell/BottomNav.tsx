import { House, ListChecks, UserRound, type LucideIcon } from 'lucide-react'
import { cx } from '../lib/cx'
import { useNav } from '../nav/nav'
import { TAB_ROUTES, type TabName } from '../nav/routes'
import { selectMine } from '../store/selectors'
import { useStore } from '../store/store'
import { Icon } from '../components/Icon'

const ITEMS: Array<{ tab: TabName; label: string; icon: LucideIcon }> = [
  { tab: 'home', label: 'Início', icon: House },
  { tab: 'activities', label: 'Atividades', icon: ListChecks },
  { tab: 'profile', label: 'Perfil', icon: UserRound },
]

/**
 * Três destinos. O antigo "Mais" deixou de existir: Finalizadas virou aba em
 * Atividades, Suporte foi para o topo da Início, e Sair e Configurações
 * foram para o Perfil.
 */
export function BottomNav() {
  const nav = useNav()
  const { state } = useStore()
  const openCount = selectMine(state).length
  return (
    <nav className="bottom-nav" aria-label="Principal">
      {ITEMS.map((item) => {
        const active = nav.tab === item.tab
        return (
          <button
            key={item.tab}
            type="button"
            className={cx('bottom-nav__item', active && 'is-active')}
            aria-current={active ? 'page' : undefined}
            onClick={() => nav.goTab(TAB_ROUTES[item.tab])}
          >
            <span className="bottom-nav__icon">
              <Icon icon={item.icon} size={24} />
              {item.tab === 'activities' && openCount > 0 && (
                <span className="bottom-nav__count t-tabular" aria-hidden="true">
                  {openCount}
                </span>
              )}
            </span>
            <span className="t-caption">
              {item.label}
              {item.tab === 'activities' && openCount > 0 && (
                <span className="visually-hidden">, {openCount} abertas</span>
              )}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
