import { ArrowLeft, CircleCheck, CloudUpload, FileImage, Map as MapIcon, Navigation, RefreshCw, SearchX } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { Callout, EmptyState, ListRow, RowGroup, Screen, ScreenBody, TopBar } from '../../components/layout'
import { Sheet } from '../../components/overlay'
import { useNav } from '../../nav/nav'
import { useStore, useToast } from '../../store/store'
import type { MediaItem, Place } from '../../store/types'

function useLeave() {
  const nav = useNav()
  return () => (nav.canGoBack ? nav.back() : nav.reset([{ name: 'home' }]))
}

/** Id que não existe (removida ou ainda não sincronizada). */
export function ActivityNotFound({ title = 'Atividade' }: { title?: string }) {
  const leave = useLeave()
  return (
    <Screen>
      <TopBar title={title} onBack={leave} />
      <ScreenBody>
        <EmptyState
          icon={SearchX}
          title="Atividade não encontrada"
          description="Ela pode ter sido removida ou ainda não chegou a este aparelho. Sincronize e tente de novo."
          action={
            <Button variant="secondary" iconStart={ArrowLeft} onClick={leave}>
              Voltar
            </Button>
          }
        />
      </ScreenBody>
    </Screen>
  )
}

/** A atividade já foi encerrada: não dá mais para executar nem tornar improdutiva. */
export function ActivityClosed({ id, title }: { id: string; title: string }) {
  const nav = useNav()
  return (
    <Screen>
      <TopBar title={title} />
      <ScreenBody>
        <EmptyState
          icon={CircleCheck}
          title="Esta atividade já foi finalizada"
          description="Veja o resultado no detalhe da atividade."
          action={
            <Button variant="secondary" onClick={() => nav.replace({ name: 'activity', id })}>
              Ver detalhes
            </Button>
          }
        />
      </ScreenBody>
    </Screen>
  )
}

/** Miniaturas de foto só para leitura (mesmo visual do MediaField). */
export function PhotoThumbs({ items, label }: { items: MediaItem[]; label: string }) {
  return (
    <ul className="media-field__grid act-thumbs" aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className="media-thumb" style={{ ['--thumb-hue' as string]: item.hue }}>
          <Icon icon={FileImage} size={24} className="media-thumb__icon" />
          <span className="visually-hidden">{item.name}</span>
        </li>
      ))}
    </ul>
  )
}

/** "Como chegar": escolhe o app de mapas (simulado com um aviso). */
export function DirectionsSheet({ open, onClose, place }: { open: boolean; onClose: () => void; place?: Place }) {
  const { showToast } = useToast()
  function openIn(app: string) {
    onClose()
    showToast({ message: `Abrindo o ${app}…` })
  }
  return (
    <Sheet open={open} onClose={onClose} title="Abrir no" description={place?.address}>
      <RowGroup>
        <ListRow icon={MapIcon} label="Google Maps" onClick={() => openIn('Google Maps')} />
        <ListRow icon={Navigation} label="Waze" onClick={() => openIn('Waze')} />
      </RowGroup>
    </Sheet>
  )
}

/**
 * Aviso de resultado ainda não enviado, com "Sincronizar agora". Depois que a
 * sincronização pedida aqui termina, o bloco continua montado e mostra a
 * confirmação (o foco vai para ela, em vez de cair no body).
 */
export function SyncPendingNotice({ pending, children }: { pending: boolean; children: ReactNode }) {
  const { state, actions } = useStore()
  const [requested, setRequested] = useState(false)
  const doneRef = useRef<HTMLDivElement>(null)
  const syncing = state.sync.status === 'syncing'
  const sent = requested && !pending
  useEffect(() => {
    if (sent) doneRef.current?.focus({ preventScroll: true })
  }, [sent])
  if (!pending && !requested) return null
  if (sent) {
    return (
      <div ref={doneRef} tabIndex={-1} className="act-notice-done" role="status">
        <Callout tone="success" icon={CircleCheck} title="Resultado enviado" />
      </div>
    )
  }
  return (
    <Callout
      tone="info"
      icon={CloudUpload}
      title="Aguardando envio"
      action={
        <Button
          variant="secondary"
          size="sm"
          iconStart={RefreshCw}
          loading={syncing}
          loadingLabel="Sincronizando"
          onClick={() => {
            setRequested(true)
            actions.startSync()
          }}
        >
          Sincronizar agora
        </Button>
      }
    >
      {children}
    </Callout>
  )
}
