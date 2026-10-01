import type { ComponentType } from 'react'
import type { Route, RouteName } from '../nav/routes'
import { Home } from '../screens/home/Home'
import { Activities } from '../screens/activities/Activities'
import { ActivityDetail } from '../screens/activity/ActivityDetail'
import { Execute } from '../screens/activity/Execute'
import { Done } from '../screens/activity/Done'
import { Unproductive } from '../screens/activity/Unproductive'
import { NewActivity } from '../screens/new/NewActivity'
import { Scan } from '../screens/new/Scan'
import { Profile } from '../screens/profile/Profile'
import { Diagnostics } from '../screens/profile/Diagnostics'
import { SyncDetail } from '../screens/profile/SyncDetail'
import { AppVersion } from '../screens/profile/AppVersion'
import { LocalData } from '../screens/profile/LocalData'
import { Location } from '../screens/profile/Location'
import { Support } from '../screens/profile/Support'
import { Language } from '../screens/profile/Language'
import { Password } from '../screens/profile/Password'

type ScreenMap = { [K in RouteName]: ComponentType<{ route: Extract<Route, { name: K }> }> }

/** Registro de telas: cada rota aponta para um componente. */
export const SCREENS: ScreenMap = {
  home: Home,
  activities: Activities,
  profile: Profile,
  activity: ActivityDetail,
  execute: Execute,
  done: Done,
  unproductive: Unproductive,
  new: NewActivity,
  scan: Scan,
  diagnostics: Diagnostics,
  sync: SyncDetail,
  appVersion: AppVersion,
  localData: LocalData,
  location: Location,
  support: Support,
  language: Language,
  password: Password,
}

/** Rótulos usados no painel do protótipo. */
export const SCREEN_LABELS: Record<RouteName, string> = {
  home: 'Início',
  activities: 'Atividades',
  profile: 'Perfil',
  activity: 'Detalhe da atividade',
  execute: 'Execução (questionário)',
  done: 'Atividade concluída',
  unproductive: 'Tornar improdutiva',
  new: 'Nova atividade',
  scan: 'Ler QR Code',
  diagnostics: 'Diagnóstico técnico',
  sync: 'Sincronização',
  appVersion: 'Versão do app',
  localData: 'Dados locais',
  location: 'Localização (GPS)',
  support: 'Falar com o suporte',
  language: 'Idioma',
  password: 'Redefinir senha',
}
