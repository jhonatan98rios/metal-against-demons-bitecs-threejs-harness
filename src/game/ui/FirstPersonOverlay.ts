const ID = 'fp-hands-overlay'

const STYLE = `
  #${ID} {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    z-index: 100;
    opacity: 0;
    transition: opacity 0.2s;
  }
  #${ID}.visible {
    opacity: 1;
  }
`

export function createFirstPersonOverlay(): {
  update: (visible: boolean) => void
} {
  if (document.getElementById(ID)) {
    // ponytail: already exists, reuse
    const el = document.getElementById(ID)!
    return {
      update: (v: boolean) => el.classList.toggle('visible', v)
    }
  }

  const style = document.createElement('style')
  style.textContent = STYLE
  document.head.appendChild(style)

  const img = document.createElement('img')
  img.id = ID
  img.src = '/players-hand.png'
  img.alt = ''
  document.body.appendChild(img)

  return {
    update: (visible: boolean) => img.classList.toggle('visible', visible)
  }
}
