import { MapPin, Settings } from 'lucide-react'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { Switch } from '../../components/fields'
import { Screen, ScreenBody, TopBar } from '../../components/layout'
import { useStore, useToast } from '../../store/store'
import './profile.css'

export function Location() {
  const { state, actions } = useStore()
  const { showToast } = useToast()

  return (
    <Screen>
      <TopBar title="Localização" />
      <ScreenBody>
        <div className="prof-stack">
          <p className="t-body">
            Para iniciar uma atividade, o app confere se você está no endereço. O GPS liga só quando precisa, para
            gastar menos bateria.
          </p>

          <div className="prof-permission">
            <p className="t-label">Permissão do aparelho</p>
            <Chip tone="success" icon={MapPin}>
              Permitida durante o uso
            </Chip>
          </div>

          <div className="prof-switch-group">
            <Switch
              label="Estou no endereço (simulação)"
              description="Ligado, o app entende que você está no local da atividade."
              checked={state.prototype.nearPlace}
              onChange={(nearPlace) => actions.setPrototype({ nearPlace })}
            />
          </div>

          <Button
            variant="secondary"
            block
            iconStart={Settings}
            onClick={() =>
              showToast({ message: 'No aparelho, isto abre os ajustes de localização. (Simulação)' })
            }
          >
            Abrir ajustes do aparelho
          </Button>
        </div>
      </ScreenBody>
    </Screen>
  )
}
