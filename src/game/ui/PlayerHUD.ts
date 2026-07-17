import { STATES, type GameStatus } from '../core/shared/components/GameState'
import { LevelUpModal, type LevelUpOption } from './LevelUpModal'

interface BarElements {
  wrapper: HTMLDivElement
  fill: HTMLDivElement
  label: HTMLSpanElement
}

function createBar(color: string): BarElements {
  const wrapper = document.createElement('div')
  Object.assign(wrapper.style, {
    position: 'relative',
    width: '120px',
    height: '12px',
    background: '#444',
    borderRadius: '2px',
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
    background: color,
    borderRadius: '2px',
    transition: 'width 0.15s ease-out'
  })

  const label = document.createElement('span')
  Object.assign(label.style, {
    minWidth: '52px',
    textAlign: 'right',
    fontSize: '11px'
  })

  wrapper.appendChild(fill)
  return { wrapper, fill, label }
}

function createPauseButton(onToggle: () => void): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.textContent = '⏸'
  Object.assign(btn.style, {
    width: '24px',
    height: '24px',
    padding: '0',
    border: '1px solid #666',
    borderRadius: '3px',
    background: '#333',
    color: '#fff',
    fontSize: '14px',
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

function makeRow(children: HTMLElement[]): HTMLDivElement {
  const row = document.createElement('div')
  Object.assign(row.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  })
  for (const c of children) row.appendChild(c)
  return row
}

function buildHUDContainer(
  pauseBtn: HTMLButtonElement,
  levelLabel: HTMLSpanElement,
  hpBar: BarElements,
  xpBar: BarElements
): HTMLDivElement {
  const container = document.createElement('div')
  Object.assign(container.style, {
    position: 'absolute',
    top: '16px',
    left: '16px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#fff',
    textShadow: '1px 1px 2px #000',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    pointerEvents: 'none',
    zIndex: '10'
  })
  container.appendChild(makeRow([pauseBtn, levelLabel]))
  container.appendChild(makeRow([hpBar.wrapper, hpBar.label]))
  container.appendChild(makeRow([xpBar.wrapper, xpBar.label]))
  return container
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

function createVictoryOverlay(onReturn: (() => void) | null): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, OVERLAY_STYLE)
  const h1 = document.createElement('div')
  h1.textContent = 'VICTORY'
  el.appendChild(h1)
  if (onReturn) {
    const btn = document.createElement('button')
    btn.textContent = 'Return to Menu'
    Object.assign(btn.style, {
      marginTop: '24px',
      padding: '12px 32px',
      fontSize: '18px',
      fontFamily: 'monospace',
      background: '#4c4',
      color: '#fff',
      border: '2px solid #6c6',
      borderRadius: '4px',
      cursor: 'pointer',
      pointerEvents: 'auto'
    })
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      onReturn()
    })
    el.appendChild(btn)
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
  private levelUpModal: LevelUpModal | null = null
  private parent: HTMLElement
  private currentState: GameStatus = STATES.PLAYING
  private getUpgradeOptions: (() => LevelUpOption[]) | null
  private onUpgradeSelect: ((index: number) => void) | null
  private onReturnToMenu: (() => void) | null

  constructor(
    parent: HTMLElement,
    onTogglePause: () => void,
    getUpgradeOptions?: () => LevelUpOption[],
    onUpgradeSelect?: (index: number) => void,
    onReturnToMenu?: () => void
  ) {
    this.parent = parent
    this.getUpgradeOptions = getUpgradeOptions ?? null
    this.onUpgradeSelect = onUpgradeSelect ?? null
    this.onReturnToMenu = onReturnToMenu ?? null
    this.pauseBtn = createPauseButton(onTogglePause)
    this.hpBar = createBar('#4c4')
    this.xpBar = createBar('#48c')
    this.levelLabel = document.createElement('span')
    Object.assign(this.levelLabel.style, {
      fontSize: '13px',
      fontWeight: 'bold'
    })

    const container = buildHUDContainer(
      this.pauseBtn,
      this.levelLabel,
      this.hpBar,
      this.xpBar
    )
    parent.appendChild(container)
  }

  update(data: HUDData) {
    const { hp, hpMax, xp, xpNext, level, state } = data

    const hpRatio = Math.max(0, Math.min(1, hp / hpMax))
    this.hpBar.fill.style.width = `${hpRatio * 100}%`
    this.hpBar.fill.style.background =
      hpRatio > 0.5 ? '#4c4' : hpRatio > 0.25 ? '#ca0' : '#c44'
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

  private showLevelUpModal(): void {
    if (!this.getUpgradeOptions || !this.onUpgradeSelect) return
    const options = this.getUpgradeOptions()
    this.levelUpModal = new LevelUpModal(this.parent, options, (index) => {
      this.onUpgradeSelect!(index)
      this.levelUpModal = null
    })
    this.levelUpModal.show()
  }

  private updateOverlay(state: GameStatus) {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = null
    }
    this.levelUpModal?.hide()
    this.levelUpModal = null

    if (state === STATES.PAUSED) {
      this.overlay = createOverlay('PAUSED', 'Press Escape or tap ▶ to resume')
    } else if (state === STATES.GAME_OVER) {
      this.overlay = createOverlay('GAME OVER', 'Press Enter to restart')
    } else if (state === STATES.VICTORY) {
      this.overlay = createVictoryOverlay(this.onReturnToMenu)
    } else if (state === STATES.LEVEL_UP) {
      this.showLevelUpModal()
    }

    if (this.overlay) this.parent.appendChild(this.overlay)
  }
}
