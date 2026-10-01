import { useState } from 'react'
import { Button } from '../../components/Button'
import { ChoiceList } from '../../components/fields'
import { ActionBar, Screen, ScreenBody, TopBar } from '../../components/layout'
import { useNav } from '../../nav/nav'
import { useStore, useToast } from '../../store/store'
import type { Language as LanguageCode } from '../../store/types'
import { LANGUAGE_LABELS } from './shared'
import './profile.css'

const LANG_ATTR: Record<LanguageCode, string> = { 'pt-BR': 'pt-BR', en: 'en', es: 'es' }

const OPTIONS = (Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((value) => ({
  value,
  label: LANGUAGE_LABELS[value],
  lang: LANG_ATTR[value],
}))

/**
 * A escolha só vale ao tocar em "Usar este idioma": navegar pelas opções com
 * as setas não troca o idioma do app a cada tecla (WCAG 3.2.2).
 */
export function Language() {
  const { state, actions } = useStore()
  const { showToast } = useToast()
  const nav = useNav()
  const [choice, setChoice] = useState<LanguageCode>(state.prototype.language)
  const changed = choice !== state.prototype.language

  function apply() {
    if (!changed) {
      nav.back()
      return
    }
    actions.setPrototype({ language: choice })
    showToast({ message: 'Idioma alterado. (No protótipo, os textos continuam em português.)', tone: 'success' })
    nav.back()
  }

  return (
    <Screen>
      <TopBar title="Idioma" />
      <ScreenBody>
        <ChoiceList
          name="prof-language"
          legend="Idioma do app"
          options={OPTIONS}
          value={choice}
          onChange={(v) => setChoice(v as LanguageCode)}
        />
      </ScreenBody>
      <ActionBar>
        <Button onClick={apply}>{changed ? 'Usar este idioma' : 'Manter idioma atual'}</Button>
      </ActionBar>
    </Screen>
  )
}
