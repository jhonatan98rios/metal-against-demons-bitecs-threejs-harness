export interface LevelUpOption {
  label: string
  description: string
}

export class LevelUpModal {
  private overlay: HTMLDivElement
  private buttons: HTMLButtonElement[] = []

  constructor(
    private parent: HTMLElement,
    private options: LevelUpOption[],
    onSelect: (index: number) => void
  ) {
    this.overlay = document.createElement('div')
    Object.assign(this.overlay.style, {
      position: 'absolute', inset: '0', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', color: '#fff', fontFamily: 'monospace',
      zIndex: '100', gap: '24px'
    })

    const title = document.createElement('div')
    title.textContent = 'LEVEL UP!'
    Object.assign(title.style, {
      fontSize: '48px', textShadow: '2px 2px 4px #000'
    })
    this.overlay.appendChild(title)

    const row = document.createElement('div')
    Object.assign(row.style, {
      display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center'
    })

    options.forEach((opt, i) => {
      row.appendChild(this.createCard(opt, i, onSelect))
    })
    this.overlay.appendChild(row)
  }

  private createCard(
    opt: LevelUpOption,
    index: number,
    onSelect: (index: number) => void
  ): HTMLDivElement {
    const card = document.createElement('div')
    Object.assign(card.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '10px', padding: '24px 20px',
      background: 'rgba(255,255,255,0.08)', borderRadius: '8px',
      border: '2px solid #555', minWidth: '160px',
      pointerEvents: 'auto', cursor: 'pointer',
      transition: 'border-color 0.15s, background 0.15s'
    })

    const btn = document.createElement('button')
    btn.textContent = opt.label
    Object.assign(btn.style, {
      padding: '10px 24px', fontSize: '18px', fontWeight: 'bold',
      fontFamily: 'monospace', cursor: 'pointer',
      background: '#555', color: '#fff', border: 'none',
      borderRadius: '4px', width: '100%'
    })
    btn.addEventListener('click', (e) => { e.stopPropagation(); onSelect(index) })
    this.buttons.push(btn)
    card.appendChild(btn)

    const desc = document.createElement('span')
    desc.textContent = opt.description
    Object.assign(desc.style, {
      fontSize: '12px', opacity: '0.7', textAlign: 'center'
    })
    card.appendChild(desc)

    // hover effect
    card.addEventListener('pointerenter', () => {
      card.style.borderColor = '#aaa'
      card.style.background = 'rgba(255,255,255,0.14)'
    })
    card.addEventListener('pointerleave', () => {
      card.style.borderColor = '#555'
      card.style.background = 'rgba(255,255,255,0.08)'
    })

    return card
  }

  show() {
    this.parent.appendChild(this.overlay)
  }

  hide() {
    if (this.overlay.parentNode) this.overlay.remove()
  }
}
