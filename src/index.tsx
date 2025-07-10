import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Se você tem um arquivo CSS principal (ex: index.css ou App.css)
// que você importa diretamente no JavaScript, ele é processado pelo Vite.
// Exemplo: import './index.css'; 

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);