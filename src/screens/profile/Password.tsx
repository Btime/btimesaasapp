import { CircleCheck, Mail } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { ActionBar, Callout, DefinitionList, Screen, ScreenBody, TopBar } from '../../components/layout'
import { useNav } from '../../nav/nav'
import { useStore, useToast } from '../../store/store'
import { useSimulatedTask } from './shared'
import './profile.css'

export function Password() {
  const { state } = useStore()
  const { showToast } = useToast()
  const nav = useNav()
  const [sent, setSent] = useState(false)
  const [sending, runSend] = useSimulatedTask(1000)
  const [resending, runResend] = useSimulatedTask(1000)
  const resultRef = useRef<HTMLDivElement>(null)
  const email = state.user.email ?? 'seu e-mail'

  // O botão "Enviar link" some depois do envio: o foco vai para a confirmação.
  useEffect(() => {
    if (sent) resultRef.current?.focus()
  }, [sent])

  function send() {
    runSend(() => setSent(true))
  }

  function resend() {
    runResend(() => showToast({ message: `Link reenviado para ${email}.`, tone: 'success' }))
  }

  function finish() {
    if (nav.canGoBack) nav.back()
    else nav.goTab({ name: 'profile' })
  }

  return (
    <Screen tone="surface">
      <TopBar title="Redefinir senha" />
      <ScreenBody>
        <div className="prof-stack">
          <p className="t-body">Vamos enviar um link para o seu e-mail. Por ele você cria uma senha nova.</p>
          <DefinitionList items={[{ term: 'E-mail', value: email, icon: Mail }]} />

          {sent && (
            <div ref={resultRef} tabIndex={-1} className="prof-focus-target prof-stack prof-stack--tight">
              <Callout tone="success" icon={CircleCheck} title={`Link enviado para ${email}.`}>
                Confira a caixa de entrada e o spam.
              </Callout>
              <div>
                <Button
                  variant="tertiary"
                  loading={resending}
                  loadingLabel="Reenviando"
                  onClick={resend}
                >
                  Reenviar link
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScreenBody>
      <ActionBar>
        {sent ? (
          <Button onClick={finish}>Voltar ao perfil</Button>
        ) : (
          <Button loading={sending} loadingLabel="Enviando" onClick={send}>
            Enviar link
          </Button>
        )}
      </ActionBar>
    </Screen>
  )
}
