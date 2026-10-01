import { CircleAlert, CircleCheck, CloudUpload, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { ActionBar, Callout, ListRow, ProgressBar, RowGroup, Screen, ScreenBody, Section, TopBar } from '../../components/layout'
import { formatRelative } from '../../lib/format'
import { useNav } from '../../nav/nav'
import { selectPendingSyncCount } from '../../store/selectors'
import { useStore } from '../../store/store'
import type { SyncEntity } from '../../store/types'
import { capitalize, pendingLabel, setSupportDraft } from './shared'
import './profile.css'

function durationLabel(sec: number): string {
  return sec < 1 ? 'menos de 1 s' : `${sec} s`
}

function EntityRow({ entity }: { entity: SyncEntity }) {
  const failed = entity.status === 'error'
  return (
    <ListRow
      label={entity.label}
      description={
        <>
          <span className="t-tabular">
            {capitalize(formatRelative(entity.lastSyncAt))} · {durationLabel(entity.durationSec)}
          </span>
          {failed && entity.error && <span className="prof-sync-item__error">{entity.error.message}</span>}
        </>
      }
      trailing={
        <span className={failed ? 'prof-sync-status prof-sync-status--error' : 'prof-sync-status'}>
          <Icon icon={failed ? CircleAlert : CircleCheck} size={16} />
          <span className="t-caption">{failed ? 'Erro' : 'Sincronizado'}</span>
        </span>
      }
    />
  )
}

/** 'há menos de 1 min' em vez de 'agora', que soa errado depois de 'Última sincronização'. */
function lastSyncText(iso: string): string {
  const rel = formatRelative(iso)
  return rel === 'agora' ? 'há menos de 1 min' : rel
}

export function SyncDetail() {
  const { state, actions } = useStore()
  const nav = useNav()
  const { sync } = state
  const pending = selectPendingSyncCount(state)
  const failed = sync.entities.find((e) => e.status === 'error')
  const syncing = sync.status === 'syncing'

  function sendToSupport() {
    setSupportDraft(
      failed?.error
        ? `A sincronização falhou em 1 item (${failed.label}). Código do erro: ${failed.error.code}. Mensagem: ${failed.error.message}`
        : 'A sincronização falhou em 1 item.',
    )
    nav.push({ name: 'support' })
  }

  let top: ReactNode
  if (syncing) {
    top = (
      <div className="prof-sync-progress" aria-hidden="true">
        <p className="prof-sync-progress__row">
          <span className="spinner" aria-hidden="true" />
          <span className="t-body-strong">{sync.step || 'Sincronizando'}</span>
          <span className="t-body t-tabular prof-sync-progress__pct">{Math.round(sync.progress)}%</span>
        </p>
        <ProgressBar value={sync.progress} label="Progresso da sincronização" />
      </div>
    )
  } else if (sync.status === 'error') {
    top = (
      <Callout
        tone="error"
        icon={CircleAlert}
        title="1 item não foi sincronizado"
        action={
          <Button variant="secondary" size="sm" onClick={sendToSupport}>
            Falar com o suporte
          </Button>
        }
      >
        {failed?.error && (
          <>
            <p>
              {failed.label}: {failed.error.message}
            </p>
            <p className="t-tabular">Código do erro: {failed.error.code}</p>
          </>
        )}
        <p className="prof-callout-next">
          <span className="t-label">O que fazer:</span> toque em Sincronizar de novo. Se o erro continuar, fale com o suporte: a mensagem já vai com
          o código do erro.
        </p>
      </Callout>
    )
  } else if (pending > 0) {
    top = (
      <Callout tone="info" icon={CloudUpload} title={pendingLabel(pending)}>
        Última sincronização {lastSyncText(sync.lastSyncAt)}. Toque em Sincronizar agora para enviar.
      </Callout>
    )
  } else {
    top = (
      <Callout tone="success" icon={CircleCheck} title="Tudo sincronizado">
        Última sincronização {lastSyncText(sync.lastSyncAt)}.
      </Callout>
    )
  }

  const showPendingLine = pending > 0 && sync.status !== 'idle'

  return (
    <Screen>
      <TopBar title="Sincronização" />
      <ScreenBody>
        {/* Só as transições são anunciadas; a porcentagem fica na barra (role=progressbar). */}
        <p className="visually-hidden" role="status">
          {syncing ? 'Sincronizando.' : ''}
        </p>
        <div className="prof-stack">
          {top}
          {showPendingLine && (
            <p className="prof-pending t-small">
              <Icon icon={CloudUpload} size={18} />
              {pendingLabel(pending)}
            </p>
          )}
        </div>

        <Section title="Itens" id="prof-sync-items" className="prof-section-gap">
          <RowGroup>
            {sync.entities.map((entity) => (
              <EntityRow key={entity.id} entity={entity} />
            ))}
          </RowGroup>
        </Section>
      </ScreenBody>
      <ActionBar>
        <Button
          iconStart={RefreshCw}
          loading={syncing}
          loadingLabel="Sincronizando"
          onClick={actions.startSync}
        >
          {sync.status === 'error' ? 'Sincronizar de novo' : 'Sincronizar agora'}
        </Button>
      </ActionBar>
    </Screen>
  )
}
