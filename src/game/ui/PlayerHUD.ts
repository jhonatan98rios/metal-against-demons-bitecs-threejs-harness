import { STATES, type GameStatus } from '../core/shared/components/GameState'

interface BarElements {
  wrapper: HTMLDivElement
  fill: HTMLDivElement
  label: HTMLSpanElement
}

function createBar(color: string): BarElements {
  const wrapper = document.createElement('div')
  Object.assign(wrapper.style, {
    position: 'relative', width: '160px', height: '16px',
    background: '#444', borderRadius: '3px', overflow: 'hidden',
    border: '1px solid #666'
  })

  const fill = document.createElement('div')
  Object.assign(fill.style, {
    position: 'absolute', top: '0', left: '0', height: '100%',
    width: '100%', background: color, borderRadius: '2px',
    transition: 'width 0.15s ease-out'
  })

  const label = document.createElement('span')
  Object.assign(label.style, { minWidth: '52px', textAlign: 'right' })

  wrapper.appendChild(fill)
  return { wrapper, fill, label }
}

function createPauseButton(onToggle: () => void): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.textContent = '⏸'
  Object.assign(btn.style, {
    width: '32px', height: '32px', padding: '0',
    border: '1px solid #666', borderRadius: '4px',
    background: '#333', color: '#fff', fontSize: '18px',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', lineHeight: '1', flexShrink: '0',
    pointerEvents: 'auto'
  })
  btn.addEventListener('click', (e) => { e.stopPropagation(); onToggle() })
  return btn
}

const OVERLAY_STYLE: Partial<CSSStyleDeclaration> = {
  position: 'absolute', inset: '0', display: 'flex',
  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.7)', color: '#fff', fontFamily: 'monospace',
  fontSize: '48px', textShadow: '2px 2px 4px #000',
  pointerEvents: 'none', zIndex: '100'
}

function createOverlay(text: string, subtext?: string): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, OVERLAY_STYLE)
  const h1 = document.createElement('div')
  h1.textContent = text
  el.appendChild(h1)
  if (subtext) {
    const h2 = document.createElement('div')
    Object.assign(h2.style, { fontSize: '20px', marginTop: '16px', opacity: '0.8' })
    h2.textContent = subtext
    el.appendChild(h2)
  }
  return el
}

export interface HUDData {
  hp: number
  hpMax: number
  xp: number
  xpNext: number
  level: number
  state: GameStatus
}

export class PlayerHUD {
  private hpBar: BarElements
  private xpBar: BarElements
  private levelLabel: HTMLSpanElement
  private pauseBtn: HTMLButtonElement
  private overlay: HTMLDivElement | null = null
  private parent: HTMLElement
  private currentState: GameStatus = STATES.PLAYING

  constructor(parent: HTMLElement, onTogglePause: () => void) {
    this.parent = parent
    this.pauseBtn = createPauseButton(onTogglePause)
    this.hpBar = createBar('#4c4')
    this.xpBar = createBar('#48c')
    this.levelLabel = document.createElement('span')
    Object.assign(this.levelLabel.style, { minWidth: '40px' })

    const container = document.createElement('div')
    Object.assign(container.style, {
      position: 'absolute', top: '16px', left: '16px',
      fontFamily: 'monospace', fontSize: '14px', color: '#fff',
      textShadow: '1px 1px 2px #000', display: 'flex',
      flexDirection: 'column', gap: '4px',
      pointerEvents: 'none', zIndex: '10'
    })

    // Top row: pause + level + HP bar + HP label
    const topRow = document.createElement('div')
    Object.assign(topRow.style, { display: 'flex', alignItems: 'center', gap: '8px' })
    topRow.appendChild(this.pauseBtn)
    topRow.appendChild(this.levelLabel)
    topRow.appendChild(this.hpBar.wrapper)
    topRow.appendChild(this.hpBar.label)

    // XP row: indented to align with HP bar
    const xpRow = document.createElement('div')
    Object.assign(xpRow.style, {
      display: 'flex', alignItems: 'center', gap: '8px',
      paddingLeft: '80px'
    })
    xpRow.appendChild(this.xpBar.wrapper)
    xpRow.appendChild(this.xpBar.label)

    container.appendChild(topRow)
    container.appendChild(xpRow)
    parent.appendChild(container)
  }

  update(data: HUDData) {
    const { hp, hpMax, xp, xpNext, level, state } = data

    const hpRatio = Math.max(0, Math.min(1, hp / hpMax))
    this.hpBar.fill.style.width = `${hpRatio * 100}%`
    this.hpBar.fill.style.background = hpRatio > 0.5 ? '#4c4' : hpRatio > 0.25 ? '#ca0' : '#c44'
    this.hpBar.label.textContent = `${Math.ceil(hp)}/${hpMax}`

    const xpRatio = Math.max(0, Math.min(1, xp / xpNext))
    this.xpBar.fill.style.width = `${xpRatio * 100}%`
    this.xpBar.label.textContent = `${Math.floor(xp)}/${xpNext}`

    this.levelLabel.textContent = `Lv.${level}`

    if (state !== this.currentState) {
      this.currentState = state
      this.pauseBtn.textContent = state === STATES.PAUSED ? '▶' : '⏸'
      this.updateOverlay(state)
    }
  }

  private updateOverlay(state: GameStatus) {
    if (this.overlay) { this.overlay.remove(); this.overlay = null }
    if (state === STATES.PAUSED)
      this.overlay = createOverlay('PAUSED', 'Press Escape or tap ▶ to resume')
    else if (state === STATES.GAME_OVER)
      this.overlay = createOverlay('GAME OVER', 'Press Enter to restart')
    else if (state === STATES.LEVEL_UP)
      this.overlay = createOverlay('LEVEL UP!', 'Press Enter to continue')
    if (this.overlay) this.parent.appendChild(this.overlay)
  }
}
