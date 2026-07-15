const STYLE_ID = 'camera-switcher-style'
const BTN_ID = 'camera-switcher-btn'

export function createCameraSwitcher(onToggle: () => void) {
  if (document.getElementById(STYLE_ID)) return { destroy() {} }

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #${BTN_ID} {
      position: fixed;
      top: 16px;
      right: 16px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.4);
      background: rgba(0, 0, 0, 0.5);
      color: #fff;
      font-size: 22px;
      cursor: pointer;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
  `
  document.head.appendChild(style)

  const btn = document.createElement('button')
  btn.id = BTN_ID
  btn.textContent = '🎥'
  btn.title = 'Switch camera'
  btn.addEventListener('click', onToggle)
  document.body.appendChild(btn)

  return {
    destroy() {
      style.remove()
      btn.remove()
    }
  }
}
