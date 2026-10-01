import { useEffect, useState } from 'react'
import { cx } from '../lib/cx'
import { AppShell } from '../shell/AppShell'
import { Panel } from './Panel'

const DESKTOP = '(min-width: 960px)'

/**
 * Em telas largas, o app aparece dentro de um aparelho de 390 × 844 com o
 * painel de revisão ao lado. No celular, o app ocupa a tela inteira.
 * O AppShell fica sempre na mesma posição da árvore, para não perder o
 * estado das telas ao cruzar 960 px (os invólucros viram display: contents).
 */
export function Frame() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP).matches)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP)
    const onChange = () => setDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div className={cx('proto', !desktop && 'proto--bare')}>
      {desktop && <Panel />}
      <div className="proto__stage" role={desktop ? 'region' : undefined} aria-label={desktop ? 'Aparelho' : undefined}>
        <div className="device">
          <div className="device__screen">
            <AppShell framed={desktop} />
          </div>
        </div>
      </div>
    </div>
  )
}
