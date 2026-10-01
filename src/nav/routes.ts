export type ActivitiesTab = 'minhas' | 'grupo' | 'finalizadas'

export type TabName = 'home' | 'activities' | 'profile'

export type Route =
  // Abas
  | { name: 'home' }
  | { name: 'activities'; tab?: ActivitiesTab }
  | { name: 'profile' }
  // Atividade
  | { name: 'activity'; id: string }
  | { name: 'execute'; id: string }
  | { name: 'done'; id: string }
  | { name: 'unproductive'; id: string }
  // Criação
  | { name: 'new' }
  | { name: 'scan' }
  // Perfil, ajuda e diagnóstico
  | { name: 'diagnostics' }
  | { name: 'sync' }
  | { name: 'appVersion' }
  | { name: 'localData' }
  | { name: 'location' }
  | { name: 'support' }
  | { name: 'language' }
  | { name: 'password' }

export type RouteName = Route['name']

export const TAB_ROUTES: Record<TabName, Route> = {
  home: { name: 'home' },
  activities: { name: 'activities' },
  profile: { name: 'profile' },
}

export function isTabRoute(route: Route): boolean {
  return route.name === 'home' || route.name === 'activities' || route.name === 'profile'
}
