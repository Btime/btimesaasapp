import { Flashlight, FlashlightOff, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Button, IconButton } from '../../components/Button'
import { TextField } from '../../components/fields'
import { Screen } from '../../components/layout'
import { Sheet } from '../../components/overlay'
import { cx } from '../../lib/cx'
import { useNav } from '../../nav/nav'
import { useStore, useToast } from '../../store/store'
import './new.css'
import { selectFinished, selectGroup, selectMine } from '../../store/selectors'

/** Atividade "encontrada" pela leitura simulada no protótipo. */
const DEMO_ACTIVITY_ID = 'a2'

function normalizeCode(code: string): string {
  return code.replace(/\s+/g, '').toLowerCase()
}

export function Scan() {
  const { state } = useStore()
  const { showToast } = useToast()
  const nav = useNav()
  const [torch, setTorch] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | undefined>()
  const formId = useId()
  const inputId = useId()

  function simulateRead() {
    const activity = state.activities.find((a) => a.id === DEMO_ACTIVITY_ID)
    if (!activity) {
      showToast({ message: 'Nenhuma atividade encontrada para este QR Code. Tente digitar o código.', tone: 'error' })
      return
    }
    showToast({ message: `QR Code lido: ${activity.title}`, tone: 'success' })
    nav.replace({ name: 'activity', id: activity.id })
  }

  function fail(message: string) {
    setCodeError(message)
    // Mantém o que foi digitado e devolve o foco ao campo.
    requestAnimationFrame(() => document.getElementById(inputId)?.focus())
  }

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const typed = normalizeCode(code)
    if (!typed) {
      fail('Digite o código da atividade.')
      return
    }
    // Só o que a pessoa pode ver: suas, do grupo (se pertence a um) e finalizadas.
    const visible = [...selectMine(state), ...selectGroup(state), ...selectFinished(state)]
    const activity = visible.find((a) => normalizeCode(a.code) === typed)
    if (!activity) {
      fail('Nenhuma atividade com esse código. Confira e tente de novo.')
      return
    }
    setSheetOpen(false)
    nav.replace({ name: 'activity', id: activity.id })
  }

  function closeSheet() {
    setSheetOpen(false)
    setCodeError(undefined)
  }

  return (
    <Screen className={cx('scan-screen', torch && 'is-torch')}>
      <header className="scan-top">
        <IconButton variant="on-dark" icon={X} label="Fechar" onClick={nav.back} />
        <h1 className="t-body-strong scan-top__title">Ler QR Code</h1>
        <IconButton
          variant="on-dark"
          icon={torch ? Flashlight : FlashlightOff}
          label="Lanterna"
          aria-pressed={torch}
          className="scan-torch"
          onClick={() => setTorch((t) => !t)}
        />
      </header>

      <div className="scan-stage">
        <p className="t-caption scan-sim">Câmera simulada no protótipo</p>
        <div className="scan-finder" aria-hidden="true">
          <span className="scan-corner scan-corner--tl" />
          <span className="scan-corner scan-corner--tr" />
          <span className="scan-corner scan-corner--bl" />
          <span className="scan-corner scan-corner--br" />
          <span className="scan-line" />
        </div>
        <p className="t-body scan-hint">Aponte a câmera para o QR Code do ativo ou da atividade.</p>
      </div>

      <footer className="scan-actions">
        <Button block onClick={simulateRead}>
          Simular leitura
        </Button>
        <Button variant="on-dark" block onClick={() => setSheetOpen(true)}>
          Digitar código
        </Button>
      </footer>

      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title="Digitar código"
        description="É o número que aparece no card e no detalhe da atividade."
        footer={
          <Button type="submit" form={formId} block>
            Buscar
          </Button>
        }
      >
        <form id={formId} className="scan-form" onSubmit={onSearch} noValidate>
          <TextField
            id={inputId}
            label="Código da atividade"
            placeholder="Ex.: 000138/25"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              if (codeError) setCodeError(undefined)
            }}
            error={codeError}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
            data-autofocus
          />
        </form>
      </Sheet>
    </Screen>
  )
}
