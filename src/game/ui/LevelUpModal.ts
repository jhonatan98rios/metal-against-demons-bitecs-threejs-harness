export interface LevelUpOption {
  icon: string
  label: string
  description: string
  detail: string
}

export class LevelUpModal {
  private overlay: HTMLDivElement
  private detailText: HTMLParagraphElement
  private cards: HTMLDivElement[] = []
  private selectedIndex = -1

  constructor(
    private parent: HTMLElement,
    private options: LevelUpOption[],
    onConfirm: (index: number) => void
  ) {
    this.overlay = document.createElement('div')
    Object.assign(this.overlay.style, {
      position: 'absolute', inset: '0', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', color: '#fff', fontFamily: 'monospace',
      zIndex: '1001', gap: '20px', paddingBottom: '160px'
    })

    const title = document.createElement('div')
    title.textContent = 'LEVEL UP!'
    Object.assign(title.style, {
      fontSize: '42px', textShadow: '2px 2px 4px #000', marginBottom: '4px'
    })
    this.overlay.appendChild(title)

    const row = document.createElement('div')
    Object.assign(row.style, {
      display: 'flex', gap: '12px', justifyContent: 'center'
    })
    options.forEach((opt, i) => {
      row.appendChild(this.createCard(opt, i, onConfirm))
    })
    this.overlay.appendChild(row)

    this.detailText = document.createElement('p')
    Object.assign(this.detailText.style, {
      margin: '0', fontSize: '13px', opacity: '0.85',
      textAlign: 'center', lineHeight: '1.5', minHeight: '40px',
      maxWidth: '420px'
    })
    this.overlay.appendChild(this.detailText)
  }

  private createCard(
    opt: LevelUpOption,
    index: number,
    onConfirm: (index: number) => void
  ): HTMLDivElement {
    const card = document.createElement('div')
    Object.assign(card.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '6px', padding: '14px 18px',
      background: 'rgba(255,255,255,0.06)', borderRadius: '8px',
      border: '2px solid #444', minWidth: '120px',
      pointerEvents: 'auto', cursor: 'pointer',
      transition: 'border-color 0.12s, background 0.12s, transform 0.12s'
    })
    const icon = document.createElement('span')
    icon.textContent = opt.icon
    Object.assign(icon.style, { fontSize: '28px' })
    const label = document.createElement('span')
    label.textContent = opt.label
    Object.assign(label.style, { fontSize: '14px', fontWeight: 'bold' })
    const desc = document.createElement('span')
    desc.textContent = opt.description
    Object.assign(desc.style, { fontSize: '11px', opacity: '0.6', textAlign: 'center' })
    card.append(icon, label, desc)
    // ponytail: second click on same card confirms, first click selects
    const handleClick = () =>
      this.selectedIndex === index ? (this.hide(), onConfirm(index)) : this.select(index)
    card.addEventListener('click', handleClick)
    card.addEventListener('touchend', (e) => { e.stopPropagation(); handleClick() })
    card.addEventListener('pointerenter', () => {
      if (this.selectedIndex !== index) {
        card.style.borderColor = '#777'
        card.style.background = 'rgba(255,255,255,0.10)'
      }
    })
    card.addEventListener('pointerleave', () => {
      if (this.selectedIndex !== index) {
        card.style.borderColor = '#444'
        card.style.background = 'rgba(255,255,255,0.06)'
      }
    })
    this.cards.push(card)
    return card
  }

  private select(index: number) {
    if (this.selectedIndex >= 0) {
      const prev = this.cards[this.selectedIndex]
      prev.style.borderColor = '#444'
      prev.style.background = 'rgba(255,255,255,0.06)'
      prev.style.transform = 'scale(1)'
    }

    this.selectedIndex = index
    const card = this.cards[index]
    card.style.borderColor = '#ca0'
    card.style.background = 'rgba(255,200,0,0.12)'
    card.style.transform = 'scale(1.05)'

    this.detailText.textContent = this.options[index].detail
  }

  show() {
    this.selectedIndex = -1
    this.detailText.textContent = ''
    this.parent.appendChild(this.overlay)
  }

  hide() {
    if (this.selectedIndex >= 0) {
      const card = this.cards[this.selectedIndex]
      card.style.borderColor = '#444'
      card.style.background = 'rgba(255,255,255,0.06)'
      card.style.transform = 'scale(1)'
    }
    if (this.overlay.parentNode) this.overlay.remove()
  }
}
