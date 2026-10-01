import { CircleAlert, Copy, Database, Download, MapPin, RefreshCw, Smartphone } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { ListRow, RowGroup, Screen, ScreenBody, TopBar } from '../../components/layout'
import { useNav } from '../../nav/nav'
import { useStore, useToast } from '../../store/store'
import { copyText, supportSummary, syncDescription } from './shared'
import './profile.css'

export function Diagnostics() {
  const { state } = useStore()
  const { showToast } = useToast()
  const nav = useNav()
  const { sync } = state
  const updateAvailable = state.prototype.updateAvailable

  async function copyInfo() {
    const ok = await copyText(supportSummary(state))
    showToast(
      ok
        ? { message: 'Informações copiadas.', tone: 'success' }
        : { message: 'Não foi possível copiar. Tire um print desta tela e envie ao suporte.', tone: 'error' },
    )
  }

  let syncTrailing: ReactNode = null
  if (sync.status === 'syncing') syncTrailing = <span className="spinner prof-row-spinner" aria-hidden="true" />
  else if (sync.status === 'error') syncTrailing = <Icon icon={CircleAlert} size={20} className="prof-row-alert" />

  return (
    <Screen>
      <TopBar title="Diagnóstico técnico" />
      <ScreenBody>
        <div className="prof-stack">
          <p className="t-body t-muted">
            Informações técnicas para o suporte. Você só precisa abrir esta área quando alguém da btime pedir.
          </p>

          <RowGroup>
            <ListRow
              icon={RefreshCw}
              label="Sincronização"
              description={
                <span className={sync.status === 'error' ? 'prof-text-error' : undefined}>{syncDescription(state)}</span>
              }
              trailing={syncTrailing}
              onClick={() => nav.push({ name: 'sync' })}
            />
            <ListRow
              icon={Smartphone}
              label="Versão do app"
              description={updateAvailable ? 'Nova versão disponível' : `${state.installedVersion} · atualizada`}
              trailing={updateAvailable ? <Icon icon={Download} size={20} className="prof-row-accent" /> : undefined}
              onClick={() => nav.push({ name: 'appVersion' })}
            />
            <ListRow
              icon={Database}
              label="Dados locais"
              description="Registros salvos neste aparelho"
              onClick={() => nav.push({ name: 'localData' })}
            />
            <ListRow
              icon={MapPin}
              label="Localização (GPS)"
              description="Permitida durante o uso"
              onClick={() => nav.push({ name: 'location' })}
            />
          </RowGroup>

          <Button variant="secondary" block iconStart={Copy} onClick={copyInfo}>
            Copiar informações para o suporte
          </Button>
        </div>
      </ScreenBody>
    </Screen>
  )
}
