import { useState, useEffect } from 'react'

function App() {
  const [systemInfo, setSystemInfo] = useState(null)
  const [message, setMessage] = useState('')
  const [clickCount, setClickCount] = useState(0)

  useEffect(() => {
    // Get system info from Electron API
    if (window.electronAPI) {
      setSystemInfo({
        platform: window.electronAPI.platform,
        node: window.electronAPI.versions.node,
        chrome: window.electronAPI.versions.chrome,
        electron: window.electronAPI.versions.electron
      })
    }
  }, [])

  const messages = [
    '👋 Hello from Electron!',
    '🎉 Great to see you!',
    '✨ You\'re doing great!',
    '🚀 Ready for deployment!',
    '💻 Built with Electron + React + pnpm'
  ]

  const handleClick = () => {
    const newCount = clickCount + 1
    setClickCount(newCount)
    const randomMessage = messages[newCount % messages.length]
    setMessage(randomMessage)
    
    // Fade out after 2 seconds
    setTimeout(() => {
      setMessage('')
    }, 2000)
  }

  return (
    <div className="container">
      <h1>Hello World! 🚀</h1>
      <p className="subtitle">Welcome to your Electron + React app</p>
      
      <div className="info-card">
        <h2>System Information</h2>
        {systemInfo ? (
          <ul>
            <li><strong>Platform:</strong> {systemInfo.platform}</li>
            <li><strong>Node Version:</strong> {systemInfo.node}</li>
            <li><strong>Chrome Version:</strong> {systemInfo.chrome}</li>
            <li><strong>Electron Version:</strong> {systemInfo.electron}</li>
          </ul>
        ) : (
          <p>Loading system info...</p>
        )}
      </div>

      <div className="button-container">
        <button onClick={handleClick} className="btn">
          Click me!
        </button>
      </div>
      
      <p className="message" style={{ opacity: message ? 1 : 0 }}>
        {message}
      </p>
    </div>
  )
}

export default App

