import { Download } from 'lucide-react'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { Dialog } from '../../components/overlay'
import { useStore, useToast } from '../../store/store'
import { NEW_VERSION, UPDATE_STARTED_MESSAGE } from './shared'

/**
 * Aviso central de nova versão. Montado no AppShell. Substitui a faixa de
 * atualização: aparece no meio da tela até a pessoa atualizar ou dispensar.
 */
export function UpdateDialog() {
  const { state, actions } = useStore()
  const { showToast } = useToast()
  const open = state.prototype.updateAvailable && !state.updateDismissed

  function update() {
    actions.installUpdate()
    showToast({ message: UPDATE_STARTED_MESSAGE })
  }

  return (
    <Dialog
      open={open}
      onClose={actions.dismissUpdate}
      icon={<Icon icon={Download} size={24} />}
      title="Atualize o app"
      actions={
        <>
          <Button onClick={update}>Atualizar agora</Button>
          <Button variant="tertiary" onClick={actions.dismissUpdate}>
            Agora não
          </Button>
        </>
      }
    >
      <p>A versão {NEW_VERSION} está disponível. Algumas funções podem não funcionar até você atualizar.</p>
    </Dialog>
  )
}
