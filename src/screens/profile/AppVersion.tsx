import { CircleCheck, Download } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '../../components/Button'
import { Callout, Screen, ScreenBody, TopBar } from '../../components/layout'
import { useStore, useToast } from '../../store/store'
import { NEW_VERSION, UPDATE_STARTED_MESSAGE, useSimulatedTask } from './shared'
import './profile.css'

export function AppVersion() {
  const { state, actions } = useStore()
  const { showToast } = useToast()
  const [updating, runUpdate] = useSimulatedTask(1000)
  const doneRef = useRef<HTMLDivElement>(null)
  const installed = useRef(state.installedVersion)
  // Depois de atualizar, o botão some: o foco vai para a confirmação.
  useEffect(() => {
    if (installed.current !== state.installedVersion) doneRef.current?.focus({ preventScroll: true })
    installed.current = state.installedVersion
  }, [state.installedVersion])

  function update() {
    runUpdate(() => {
      showToast({ message: UPDATE_STARTED_MESSAGE })
      actions.installUpdate()
    })
  }

  return (
    <Screen>
      <TopBar title="Versão do app" />
      <ScreenBody>
        <div className="prof-stack">
          <div className="prof-version">
            <p className="t-kicker t-muted">Versão instalada</p>
            <p className="t-h2 t-tabular">{state.installedVersion}</p>
          </div>

          {state.prototype.updateAvailable ? (
            <Callout
              tone="brand"
              icon={Download}
              title={`Nova versão ${NEW_VERSION} disponível`}
              action={
                <Button loading={updating} loadingLabel="Abrindo a loja" onClick={update}>
                  Atualizar agora
                </Button>
              }
            >
              Algumas funções podem não funcionar até você atualizar.
            </Callout>
          ) : (
            <div ref={doneRef} tabIndex={-1} className="prof-focus-target">
              <Callout tone="success" icon={CircleCheck} title="Você está na versão mais recente." />
            </div>
          )}
        </div>
      </ScreenBody>
    </Screen>
  )
}
