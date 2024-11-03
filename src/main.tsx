import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    {/* 
    <div>
      <h2>Selecione uma área da imagem para extrair o texto</h2>
      <img src="/tema-da-aula.webp" alt="Tema da Aula" style={{ width: '100%' }} />
    </div> 
    */}
  </StrictMode>
)
