import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadCustomCatalog } from './lib/loadCatalog';
import './styles.css';

// Pick up admin-added products first (capped at 1.5 s, falls back to the built-in gifts), then render.
loadCustomCatalog().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
