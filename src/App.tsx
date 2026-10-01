import { OverlayProvider } from './components/overlay'
import { ThemeSync } from './lib/theme'
import { NavProvider } from './nav/nav'
import { Frame } from './prototype/Frame'
import { StoreProvider } from './store/store'

export default function App() {
  return (
    <StoreProvider>
      <ThemeSync />
      <NavProvider>
        <OverlayProvider>
          <Frame />
        </OverlayProvider>
      </NavProvider>
    </StoreProvider>
  )
}
