import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// A importação do CSS principal agora está ativa.
// É essencial para que o Tailwind (processado pelo Vite/PostCSS) seja aplicado.
import './index.css'; 

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Adicionado React.StrictMode para ajudar a detectar problemas comuns no desenvolvimento.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);