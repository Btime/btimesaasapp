import { RotateCcw } from 'lucide-react'
import { BrandMark } from '../components/BrandMark'
import { Button } from '../components/Button'
import { Switch } from '../components/fields'
import { cx } from '../lib/cx'
import { useResolvedTheme } from '../lib/theme'
import { useNav } from '../nav/nav'
import { TAB_ROUTES, type Route, type TabName } from '../nav/routes'
import { SCREEN_LABELS } from '../shell/screens'
import { useStore } from '../store/store'
import type { ThemePreference } from '../store/types'
import { NOTES } from './notes'

interface Jump {
  label: string
  tab: TabName
  route: Route
}

const GROUPS: Array<{ title: string; items: Jump[] }> = [
  {
    title: 'Principais',
    items: [
      { label: 'Início', tab: 'home', route: { name: 'home' } },
      { label: 'Atividades', tab: 'activities', route: { name: 'activities' } },
      { label: 'Finalizadas', tab: 'activities', route: { name: 'activities', tab: 'finalizadas' } },
      { label: 'Perfil', tab: 'profile', route: { name: 'profile' } },
    ],
  },
  {
    title: 'Atividade',
    items: [
      { label: 'Detalhe (recebida)', tab: 'activities', route: { name: 'activity', id: 'a2' } },
      { label: 'Detalhe (pausada)', tab: 'home', route: { name: 'activity', id: 'a1' } },
      { label: 'Execução (retoma a pausada)', tab: 'home', route: { name: 'execute', id: 'a1' } },
      { label: 'Tornar improdutiva', tab: 'home', route: { name: 'unproductive', id: 'a1' } },
      { label: 'Concluída', tab: 'home', route: { name: 'done', id: 'f1' } },
    ],
  },
  {
    title: 'Criação',
    items: [
      { label: 'Nova atividade', tab: 'home', route: { name: 'new' } },
      { label: 'Ler QR Code', tab: 'home', route: { name: 'scan' } },
    ],
  },
  {
    title: 'Perfil e suporte',
    items: [
      { label: 'Diagnóstico técnico', tab: 'profile', route: { name: 'diagnostics' } },
      { label: 'Sincronização', tab: 'profile', route: { name: 'sync' } },
      { label: 'Falar com o suporte', tab: 'home', route: { name: 'support' } },
      { label: 'Idioma', tab: 'profile', route: { name: 'language' } },
      { label: 'Redefinir senha', tab: 'profile', route: { name: 'password' } },
    ],
  },
]

const THEMES: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
]

function sameRoute(a: Route, b: Route): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function Panel() {
  const nav = useNav()
  const { state, actions } = useStore()
  const p = state.prototype
  const note = NOTES[nav.current.name]
  const theme = useResolvedTheme()

  function jump(item: Jump) {
    const root = item.route.name === TAB_ROUTES[item.tab].name ? item.route : TAB_ROUTES[item.tab]
    nav.reset(sameRoute(root, item.route) ? [root] : [root, item.route])
  }

  return (
    <aside className="panel" aria-label="Painel do protótipo">
      <header className="panel__head">
        <BrandMark variant="horizontal" tone={theme === 'dark' ? 'branco-frio' : 'noite'} width={160} className="panel__logo" />
        <div>
          <p className="t-body-strong">App de execução · redesign</p>
          <p className="t-small t-muted">Protótipo navegável. Dados e textos são demonstrativos.</p>
        </div>
      </header>

      <section className="panel__section" aria-labelledby="panel-note">
        <h2 id="panel-note" className="t-kicker t-muted">
          Tela atual
        </h2>
        <p className="t-title">{SCREEN_LABELS[nav.current.name]}</p>
        {note ? (
          <>
            <p className="t-small">{note.summary}</p>
            {note.changes.length > 0 && (
              <>
                <h3 className="t-label panel__subhead">O que mudou</h3>
                <ul className="panel__list t-small">
                  {note.changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </>
            )}
            {note.openQuestions && note.openQuestions.length > 0 && (
              <>
                <h3 className="t-label panel__subhead">Para decidir</h3>
                <ul className="panel__list t-small">
                  {note.openQuestions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          <p className="t-small t-muted">Sem notas para esta tela.</p>
        )}
      </section>

      <section className="panel__section" aria-labelledby="panel-jump">
        <h2 id="panel-jump" className="t-kicker t-muted">
          Ir para
        </h2>
        {GROUPS.map((g) => (
          <div key={g.title} className="panel__group">
            <h3 className="t-caption t-muted">{g.title}</h3>
            <div className="panel__chips">
              {g.items.map((item) => {
                const current = sameRoute(nav.current, item.route)
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={cx('panel__chip', current && 'is-current')}
                    aria-current={current ? 'page' : undefined}
                    onClick={() => jump(item)}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="panel__section" aria-labelledby="panel-scen">
        <h2 id="panel-scen" className="t-kicker t-muted">
          Cenários
        </h2>
        <div className="panel__switches">
          <Switch
            label="Nova versão disponível"
            description="Mostra o aviso de atualização no centro da tela."
            checked={p.updateAvailable}
            onChange={(v) => actions.setPrototype({ updateAvailable: v })}
          />
          <Switch
            label="Próxima sincronização falha"
            description="Um item retorna erro do servidor."
            checked={p.syncFails}
            onChange={(v) => actions.setPrototype({ syncFails: v })}
          />
          <Switch
            label="Estou no endereço da atividade"
            description="Desligado, o app avisa que você está longe."
            checked={p.nearPlace}
            onChange={(v) => actions.setPrototype({ nearPlace: v })}
          />
          <Switch
            label="Pertenço a um grupo"
            description="Habilita a aba Do grupo."
            checked={p.inGroup}
            onChange={(v) => actions.setPrototype({ inGroup: v })}
          />
          <Switch
            label="Pode abrir para outros usuários"
            description="Inclui a etapa Responsável em Nova atividade."
            checked={p.permissions.assignOthers}
            onChange={(v) => actions.setPrototype({ permissions: { ...p.permissions, assignOthers: v } })}
          />
          <Switch
            label="Preenche campos adicionais"
            description="Inclui a etapa Detalhes em Nova atividade."
            checked={p.permissions.extraFields}
            onChange={(v) => actions.setPrototype({ permissions: { ...p.permissions, extraFields: v } })}
          />
        </div>
        <fieldset className="panel__theme">
          <legend className="t-label">Tema</legend>
          <div className="panel__chips">
            {THEMES.map((t) => (
              <label key={t.value} className={cx('panel__chip', p.theme === t.value && 'is-current')}>
                <input
                  type="radio"
                  name="proto-theme"
                  value={t.value}
                  checked={p.theme === t.value}
                  onChange={() => actions.setPrototype({ theme: t.value })}
                  className="visually-hidden"
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Button
          variant="secondary"
          size="sm"
          iconStart={RotateCcw}
          onClick={() => {
            actions.reset()
            nav.reset([{ name: 'home' }])
          }}
        >
          Reiniciar demonstração
        </Button>
      </section>
    </aside>
  )
}
