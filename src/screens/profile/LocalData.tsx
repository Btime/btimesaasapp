import { Copy } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { ListRow, RowGroup, Screen, ScreenBody, Section, TopBar } from '../../components/layout'
import { Sheet } from '../../components/overlay'
import { plural } from '../../lib/format'
import { useStore, useToast } from '../../store/store'
import type { AppState } from '../../store/types'
import { copyText } from './shared'
import './profile.css'

interface Dataset {
  id: string
  label: string
  /** Só quando o protótipo tem os registros de verdade. */
  count?: number
  data: unknown
}

/** Rótulos de sincronização que já aparecem com contagem real na primeira lista. */
const COUNTED_SYNC_LABELS = ['Atividades', 'Questionários', 'Perguntas', 'Locais/pessoas', 'Usuários']

function buildDatasets(state: AppState): { counted: Dataset[]; others: Dataset[] } {
  const questions = state.questionnaires.flatMap((q) =>
    q.questions.map((question) => ({ questionnaireId: q.id, ...question })),
  )
  const counted: Dataset[] = [
    { id: 'activities', label: 'Atividades', count: state.activities.length, data: state.activities },
    { id: 'questionnaires', label: 'Questionários', count: state.questionnaires.length, data: state.questionnaires },
    { id: 'questions', label: 'Perguntas', count: questions.length, data: questions },
    { id: 'places', label: 'Locais/pessoas', count: state.places.length, data: state.places },
    { id: 'users', label: 'Usuários', count: state.users.length, data: state.users },
  ]
  const others: Dataset[] = state.sync.entities
    .filter((e) => !COUNTED_SYNC_LABELS.includes(e.label))
    .map((e) => ({ id: e.id, label: e.label, data: e }))
  return { counted, others }
}

function JsonSheet({ dataset, onClose }: { dataset: Dataset | null; onClose: () => void }) {
  const { showToast } = useToast()
  const [last, setLast] = useState<Dataset | null>(dataset)
  // Mantém o conteúdo visível durante a animação de saída da folha.
  if (dataset && dataset !== last) setLast(dataset)
  const shown = dataset ?? last
  const json = shown ? JSON.stringify(shown.data, null, 2) : ''

  async function copy() {
    const ok = await copyText(json)
    showToast(
      ok
        ? { message: 'Dados copiados.', tone: 'success' }
        : { message: 'Não foi possível copiar. Tire um print desta tela.', tone: 'error' },
    )
  }

  return (
    <Sheet
      open={dataset !== null}
      onClose={onClose}
      tall
      kicker="Dados locais"
      title={shown?.label ?? ''}
      description={
        shown?.count !== undefined
          ? `${plural(shown.count, 'registro salvo', 'registros salvos')} neste aparelho.`
          : 'Informações de sincronização deste item.'
      }
      footer={
        <Button variant="secondary" block iconStart={Copy} onClick={copy}>
          Copiar
        </Button>
      }
    >
      <pre className="prof-json" tabIndex={0} role="region" aria-label={`Dados de ${shown?.label ?? ''} em JSON`}>
        {json}
      </pre>
    </Sheet>
  )
}

export function LocalData() {
  const { state } = useStore()
  const [open, setOpen] = useState<Dataset | null>(null)
  const { counted, others } = buildDatasets(state)

  return (
    <Screen>
      <TopBar title="Dados locais" />
      <ScreenBody>
        <p className="t-body t-muted prof-intro">Registros salvos neste aparelho para o app funcionar sem internet.</p>

        <Section title="Registros" id="prof-local-counted">
          <RowGroup>
            {counted.map((d) => (
              <ListRow
                key={d.id}
                label={d.label}
                value={d.count !== undefined ? plural(d.count, 'registro', 'registros') : undefined}
                onClick={() => setOpen(d)}
              />
            ))}
          </RowGroup>
        </Section>

        <Section title="Outros dados sincronizados" id="prof-local-others">
          <RowGroup>
            {others.map((d) => (
              <ListRow key={d.id} label={d.label} onClick={() => setOpen(d)} />
            ))}
          </RowGroup>
        </Section>
      </ScreenBody>
      <JsonSheet dataset={open} onClose={() => setOpen(null)} />
    </Screen>
  )
}
