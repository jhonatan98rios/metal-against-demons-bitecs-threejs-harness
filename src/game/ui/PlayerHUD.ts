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

export class PlayerHUD {
  private container: HTMLDivElement
  private fillBar: HTMLDivElement

  constructor(parent: HTMLElement) {
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

    const [barWrapper, fillBar] = createBar()
    container.appendChild(barWrapper)

    const label = document.createElement('span')
    container.appendChild(label)

    parent.appendChild(container)

    this.container = container
    this.fillBar = fillBar
  }

  update(current: number, max: number) {
    const ratio = Math.max(0, Math.min(1, current / max))
    this.fillBar.style.width = `${ratio * 100}%`

    if (ratio > 0.5) this.fillBar.style.background = '#4c4'
    else if (ratio > 0.25) this.fillBar.style.background = '#ca0'
    else this.fillBar.style.background = '#c44'

    const label = this.container.lastChild as HTMLSpanElement
    label.textContent = `${Math.ceil(current)}/${max}`
  }
}
