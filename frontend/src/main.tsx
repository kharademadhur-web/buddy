import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeVoices } from './voice'

// Provide global React for any classic JSX modules expecting `React` at runtime
// This is safe and helps with third-party packages using classic runtime
;(window as any).React = React

// Initialize voice engines early
initializeVoices().then(() => {
  console.log('Voice engines initialized');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
