import { Camera, Images, Languages, LogOut, RefreshCw, SunMoon, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { BrandIcon } from '../../components/BrandIcon'
import { BrandMark } from '../../components/BrandMark'
import { Button } from '../../components/Button'
import { ChoiceList } from '../../components/fields'
import { Icon } from '../../components/Icon'
import { Avatar, ListRow, RowGroup, Screen, ScreenBody, Section, TopBar } from '../../components/layout'
import { Dialog, Sheet } from '../../components/overlay'
import { useResolvedTheme } from '../../lib/theme'
import { useNav } from '../../nav/nav'
import { selectPendingSyncCount } from '../../store/selectors'
import { useStore, useToast } from '../../store/store'
import type { ThemePreference } from '../../store/types'
import { LANGUAGE_LABELS, THEME_LABELS } from './shared'
import './profile.css'

/** Tom aleatório para a "foto" simulada (o protótipo não acessa a câmera). */
function randomHue(): number {
  return Math.floor(Math.random() * 360)
}

function PhotoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions } = useStore()
  const { showToast } = useToast()
  const hasPhoto = state.user.photoHue !== undefined

  function choose(source: 'camera' | 'gallery') {
    actions.setPhoto(randomHue())
    onClose()
    showToast({
      message: source === 'camera' ? 'Foto atualizada. (Simulação da câmera)' : 'Foto atualizada. (Simulação da galeria)',
      tone: 'success',
    })
  }

  function remove() {
    actions.setPhoto(undefined)
    onClose()
    showToast({ message: 'Foto removida.' })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Foto do perfil">
      <RowGroup>
        <ListRow icon={Camera} label="Tirar foto" chevron={false} onClick={() => choose('camera')} />
        <ListRow icon={Images} label="Escolher da galeria" chevron={false} onClick={() => choose('gallery')} />
        {hasPhoto && <ListRow icon={Trash2} label="Remover foto" tone="danger" chevron={false} onClick={remove} />}
      </RowGroup>
    </Sheet>
  )
}

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; description?: string }> = [
  { value: 'light', label: THEME_LABELS.light },
  { value: 'dark', label: THEME_LABELS.dark },
  { value: 'system', label: THEME_LABELS.system, description: 'Segue o tema escolhido no celular.' },
]

function ThemeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions } = useStore()
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Aparência"
      footer={
        <Button block onClick={onClose}>
          Pronto
        </Button>
      }
    >
      <ChoiceList
        name="prof-theme"
        legend="Tema do app"
        hideLegend
        options={THEME_OPTIONS}
        value={state.prototype.theme}
        onChange={(value) => actions.setPrototype({ theme: value as ThemePreference })}
      />
    </Sheet>
  )
}

type LogoutStep = 'closed' | 'pending' | 'confirm'

function LogoutDialogs({ step, onClose }: { step: LogoutStep; onClose: () => void }) {
  const { state, actions } = useStore()
  const { showToast } = useToast()
  const nav = useNav()
  const pending = selectPendingSyncCount(state)

  function logout() {
    onClose()
    actions.reset()
    nav.reset([{ name: 'home' }])
    showToast({ message: 'Você saiu da conta. (Simulação: os dados foram reiniciados.)' })
  }

  function syncNow() {
    actions.startSync()
    onClose()
  }

  return (
    <>
      <Dialog
        open={step === 'pending'}
        onClose={onClose}
        tone="warning"
        icon={<Icon icon={RefreshCw} size={24} />}
        title="Sincronize antes de sair"
        actions={
          <>
            <Button onClick={syncNow}>Sincronizar agora</Button>
            <Button variant="danger-tertiary" onClick={logout}>
              Sair mesmo assim
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
          </>
        }
      >
        <p>
          {pending === 1
            ? 'Você tem 1 atividade que ainda não foi enviada. Se sair agora, ela será perdida.'
            : `Você tem ${pending} atividades que ainda não foram enviadas. Se sair agora, elas serão perdidas.`}
        </p>
      </Dialog>
      <Dialog
        open={step === 'confirm'}
        onClose={onClose}
        tone="danger"
        icon={<Icon icon={LogOut} size={24} />}
        title="Sair da conta?"
        actions={
          <>
            <Button variant="danger" onClick={logout}>
              Sair
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
          </>
        }
      >
        <p>Para entrar de novo, use seu e-mail e senha. Ao entrar, você pode escolher outro ambiente.</p>
      </Dialog>
    </>
  )
}

export function Profile() {
  const { state } = useStore()
  const nav = useNav()
  const theme = useResolvedTheme()
  const [photoOpen, setPhotoOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [logoutStep, setLogoutStep] = useState<LogoutStep>('closed')
  const { user } = state

  function askLogout() {
    setLogoutStep(selectPendingSyncCount(state) > 0 ? 'pending' : 'confirm')
  }

  return (
    <Screen>
      <TopBar title="Perfil" large />
      <ScreenBody>
        <section className="prof-identity" aria-labelledby="prof-name">
          <div className="prof-identity__main">
            <Avatar name={user.name} size={72} hue={user.photoHue} />
            <div className="prof-identity__text">
              <h2 id="prof-name" className="t-h3">
                {user.name}
              </h2>
              {user.email && <p className="t-muted prof-identity__email">{user.email}</p>}
              <Button variant="tertiary" size="sm" onClick={() => setPhotoOpen(true)} className="prof-inline-start">
                Alterar foto
              </Button>
            </div>
          </div>
          <div className="prof-env">
            <p className="t-label">Ambiente {user.environment}</p>
            <p className="t-small t-muted">Para usar outro ambiente, saia e entre de novo.</p>
          </div>
        </section>

        <Section title="Conta" id="prof-account">
          <RowGroup>
            <ListRow
              glyph={<BrandIcon name="seguranca" size={24} />}
              label="Redefinir senha"
              onClick={() => nav.push({ name: 'password' })}
            />
            <ListRow
              icon={Languages}
              label="Idioma"
              value={LANGUAGE_LABELS[state.prototype.language]}
              onClick={() => nav.push({ name: 'language' })}
            />
            <ListRow
              icon={SunMoon}
              label="Aparência"
              value={THEME_LABELS[state.prototype.theme]}
              onClick={() => setThemeOpen(true)}
            />
          </RowGroup>
        </Section>

        <Section title="Suporte" id="prof-help">
          <RowGroup>
            <ListRow
              glyph={<BrandIcon name="suporte" size={24} />}
              label="Falar com o suporte"
              onClick={() => nav.push({ name: 'support' })}
            />
            <ListRow
              glyph={<BrandIcon name="dados" size={24} />}
              label="Diagnóstico técnico"
              description="Informações técnicas. Abra quando o suporte pedir."
              onClick={() => nav.push({ name: 'diagnostics' })}
            />
          </RowGroup>
        </Section>

        <Section>
          <RowGroup>
            <ListRow icon={LogOut} label="Sair da conta" tone="danger" chevron={false} onClick={askLogout} />
          </RowGroup>
        </Section>

        <footer className="prof-footer">
          <BrandMark variant="horizontal" tone={theme === 'dark' ? 'branco-frio' : 'noite'} width={120} />
          <p className="t-caption t-muted t-tabular">Versão {state.installedVersion}</p>
        </footer>
      </ScreenBody>

      <PhotoSheet open={photoOpen} onClose={() => setPhotoOpen(false)} />
      <ThemeSheet open={themeOpen} onClose={() => setThemeOpen(false)} />
      <LogoutDialogs step={logoutStep} onClose={() => setLogoutStep('closed')} />
    </Screen>
  )
}
