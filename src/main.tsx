import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div>
      <App />

      <h1>Selecione uma área da imagem para extrair o texto</h1>
      <img src="/logo.png" alt="Tema da Aula" style={{ width: '100%' }} />
    </div>
  </StrictMode>
)
