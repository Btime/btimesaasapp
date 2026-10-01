import { Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BrandIcon } from '../../components/BrandIcon'
import { Button, IconButton } from '../../components/Button'
import { TextField } from '../../components/fields'
import { EmptyState, Screen, ScreenBody, TopBar } from '../../components/layout'
import { cx } from '../../lib/cx'
import { makeId } from '../../store/store'
import { clearSupportDraft, peekSupportDraft } from './shared'
import './profile.css'
import { onSessionReset } from '../../lib/session'

interface Message {
  id: string
  from: 'me' | 'btime'
  text: string
  at: string
}

const SHORTCUTS = [
  { label: 'Erro na sincronização', text: 'Estou com erro na sincronização.' },
  { label: 'Não encontro uma atividade', text: 'Não encontro uma atividade no app.' },
  { label: 'Como atualizar o app', text: 'Como faço para atualizar o app?' },
]

const AUTO_REPLY = 'Recebemos sua mensagem. Uma pessoa do suporte responde em breve.'

const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function Bubble({ message }: { message: Message }) {
  const mine = message.from === 'me'
  return (
    <li className={cx('prof-msg', mine ? 'prof-msg--me' : 'prof-msg--btime')}>
      {!mine && (
        <span className="t-caption t-muted prof-msg__author" aria-hidden="true">
          Suporte btime
        </span>
      )}
      <div className="prof-msg__bubble">
        <span className="visually-hidden">{mine ? 'Você: ' : 'Suporte btime: '}</span>
        <p className="t-body">{message.text}</p>
      </div>
      <time className="t-caption t-muted t-tabular prof-msg__time" dateTime={message.at}>
        {timeFmt.format(new Date(message.at))}
      </time>
    </li>
  )
}

/** A conversa fica guardada enquanto o app está aberto (sair da tela não apaga). */
let savedMessages: Message[] = []
onSessionReset(() => {
  savedMessages = []
})

export function Support() {
  const [messages, setMessagesState] = useState<Message[]>(() => savedMessages)
  const setMessages = (fn: (list: Message[]) => Message[]) =>
    setMessagesState((list) => {
      const next = fn(list)
      savedMessages = next
      return next
    })
  const [draft, setDraft] = useState(peekSupportDraft)
  const [error, setError] = useState<string | undefined>()
  const [typing, setTyping] = useState(false)
  const replyTimer = useRef<number | null>(null)
  const composerRef = useRef<HTMLFormElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // O rascunho vindo de outra tela (ex.: erro de sincronização) só vale uma vez.
  useEffect(() => clearSupportDraft(), [])

  useEffect(
    () => () => {
      if (replyTimer.current) {
        window.clearTimeout(replyTimer.current)
        // A resposta pendente não se perde se a pessoa sair da tela.
        savedMessages = [
          ...savedMessages,
          { id: makeId('msg'), from: 'btime', text: AUTO_REPLY, at: new Date().toISOString() },
        ]
      }
    },
    [],
  )

  useEffect(() => {
    const body = endRef.current?.closest('.screen__body')
    if (body) body.scrollTop = body.scrollHeight
  }, [messages.length, typing])

  function focusInput() {
    composerRef.current?.querySelector<HTMLInputElement>('input')?.focus()
  }

  function fill(text: string) {
    setDraft(text)
    setError(undefined)
    focusInput()
  }

  function send(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) {
      setError('Escreva uma mensagem antes de enviar.')
      focusInput()
      return
    }
    setMessages((list) => [...list, { id: makeId('msg'), from: 'me', text, at: new Date().toISOString() }])
    setDraft('')
    setError(undefined)
    setTyping(true)
    // Várias mensagens seguidas recebem uma única resposta automática.
    if (replyTimer.current) window.clearTimeout(replyTimer.current)
    replyTimer.current = window.setTimeout(() => {
      replyTimer.current = null
      setTyping(false)
      setMessages((list) => [
        ...list,
        { id: makeId('msg'), from: 'btime', text: AUTO_REPLY, at: new Date().toISOString() },
      ])
    }, 1500)
  }

  const empty = messages.length === 0

  return (
    <Screen>
      <TopBar title="Falar com o suporte" />
      <ScreenBody className={cx('prof-chat-body', empty && 'is-empty')}>
        {empty && (
          <EmptyState
            glyph={<BrandIcon name="suporte" size={32} />}
            title="Nenhuma mensagem ainda"
            description="Conte o que aconteceu. A equipe btime responde por aqui."
            action={
              <div className="prof-shortcuts" role="group" aria-label="Sugestões de assunto">
                {SHORTCUTS.map((s) => (
                  <Button key={s.label} variant="secondary" size="sm" onClick={() => fill(s.text)}>
                    {s.label}
                  </Button>
                ))}
              </div>
            }
          />
        )}
        {/* A lista existe desde o início para que o leitor de tela anuncie a primeira mensagem. */}
        <div role="log" aria-label="Conversa com o suporte">
          <ol className="prof-chat">
            {messages.map((m) => (
              <Bubble key={m.id} message={m} />
            ))}
          </ol>
        </div>
        <div className="prof-typing" role="status">
          {typing && (
            <>
              <span className="prof-typing__dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="t-small t-muted">Suporte btime está digitando</span>
            </>
          )}
        </div>
        <div ref={endRef} />
      </ScreenBody>

      <form ref={composerRef} className="prof-composer" onSubmit={send} noValidate>
        <div className="prof-composer__field">
          <TextField
            label="Mensagem"
            hideLabel
            placeholder="Escreva sua mensagem"
            value={draft}
            error={error}
            autoComplete="off"
            enterKeyHint="send"
            onChange={(e) => {
              setDraft(e.target.value)
              if (error) setError(undefined)
            }}
          />
        </div>
        <IconButton type="submit" icon={Send} label="Enviar" variant="filled" className="prof-composer__send" />
      </form>
    </Screen>
  )
}
