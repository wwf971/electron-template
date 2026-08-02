import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import TransparentWindowDemo from '../sub-app/TransparentWindowDemo.jsx'
import './styles.css'

// the transparent-window sub app opens a second window loading this same build
// with a hash; that window renders only the demo content, over a transparent
// page background
const isTransparentWindowDemo = window.location.hash === '#transparent-window-demo'
if (isTransparentWindowDemo) {
  document.body.classList.add('transparent-window-body')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isTransparentWindowDemo ? <TransparentWindowDemo /> : <App />}
  </React.StrictMode>,
)

