import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Mostrar información de la aplicación
console.log(`🚀 Plane Bookmark v${__APP_VERSION__}`)
console.log(`📦 Build: ${new Date().toISOString()}`)
console.log(`🌐 Environment: ${import.meta.env.MODE}`)
console.log(`🔗 ${import.meta.env.DEV ? 'Development' : 'Production'} mode`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
