import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Provide global React for any classic JSX modules expecting `React` at runtime
// This is safe and helps with third-party packages using classic runtime
;(window as any).React = React

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
