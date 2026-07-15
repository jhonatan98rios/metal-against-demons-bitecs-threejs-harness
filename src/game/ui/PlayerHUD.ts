import { STATES, type GameStatus } from '../core/shared/components/GameState'

function createBar(): [HTMLDivElement, HTMLDivElement] {
  const wrapper = document.createElement('div')
  Object.assign(wrapper.style, {
    position: 'relative',
    width: '160px',
    height: '20px',
    background: '#444',
    borderRadius: '3px',
    overflow: 'hidden',
    border: '1px solid #666'
  })

  const fill = document.createElement('div')
  Object.assign(fill.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    height: '100%',
    width: '100%',
    background: '#4c4',
    borderRadius: '2px',
    transition: 'width 0.15s ease-out'
  })

  wrapper.appendChild(fill)
  return [wrapper, fill]
}

function createPauseButton(onToggle: () => void): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.textContent = '⏸'
  Object.assign(btn.style, {
    width: '32px',
    height: '32px',
    padding: '0',
    border: '1px solid #666',
    borderRadius: '4px',
    background: '#333',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1',
    flexShrink: '0',
    pointerEvents: 'auto'
  })
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    onToggle()
  })
  return btn
}

const OVERLAY_STYLE: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  inset: '0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.7)',
  color: '#fff',
  fontFamily: 'monospace',
  fontSize: '48px',
  textShadow: '2px 2px 4px #000',
  pointerEvents: 'none',
  zIndex: '100'
}

function createOverlay(text: string, subtext?: string): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, OVERLAY_STYLE)

  const h1 = document.createElement('div')
  h1.textContent = text
  el.appendChild(h1)

  if (subtext) {
    const h2 = document.createElement('div')
    Object.assign(h2.style, {
      fontSize: '20px',
      marginTop: '16px',
      opacity: '0.8'
    })
    h2.textContent = subtext
    el.appendChild(h2)
  }

  return el
}

export class PlayerHUD {
  private container: HTMLDivElement
  private fillBar: HTMLDivElement
  private pauseBtn: HTMLButtonElement
  private overlay: HTMLDivElement | null = null
  private parent: HTMLElement
  private currentState: GameStatus = STATES.PLAYING

  constructor(parent: HTMLElement, onTogglePause: () => void) {
    this.parent = parent

    const container = document.createElement('div')
    Object.assign(container.style, {
      position: 'absolute',
      top: '16px',
      left: '16px',
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#fff',
      textShadow: '1px 1px 2px #000',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      pointerEvents: 'none',
      zIndex: '10'
    })

    this.pauseBtn = createPauseButton(onTogglePause)
    container.appendChild(this.pauseBtn)

    const [barWrapper, fillBar] = createBar()
    container.appendChild(barWrapper)

    const label = document.createElement('span')
    container.appendChild(label)

    parent.appendChild(container)

    this.container = container
    this.fillBar = fillBar
  }

  update(current: number, max: number, state: GameStatus) {
    const ratio = Math.max(0, Math.min(1, current / max))
    this.fillBar.style.width = `${ratio * 100}%`

    if (ratio > 0.5) this.fillBar.style.background = '#4c4'
    else if (ratio > 0.25) this.fillBar.style.background = '#ca0'
    else this.fillBar.style.background = '#c44'

    const label = this.container.lastChild as HTMLSpanElement
    label.textContent = `${Math.ceil(current)}/${max}`

    if (state !== this.currentState) {
      this.currentState = state
      this.pauseBtn.textContent =
        state === STATES.PAUSED ? '▶' : '⏸'
      this.updateOverlay(state)
    }
  }

  private updateOverlay(state: GameStatus) {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = null
    }

    if (state === STATES.PAUSED) {
      this.overlay = createOverlay(
        'PAUSED',
        'Press Escape or tap ▶ to resume'
      )
    } else if (state === STATES.GAME_OVER) {
      this.overlay = createOverlay('GAME OVER', 'Press Enter to restart')
    } else if (state === STATES.LEVEL_UP) {
      this.overlay = createOverlay('LEVEL UP!', 'Press Enter to continue')
    }

    if (this.overlay) {
      this.parent.appendChild(this.overlay)
    }
  }
}
