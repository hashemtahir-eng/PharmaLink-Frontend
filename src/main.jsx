import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { DataProvider } from './context/DataContext';
import './styles/global.css';
createRoot(document.getElementById('root')).render(
  // Hash routes do not require server-side rewrites on GitHub Pages.
  <HashRouter>
    <DataProvider>
      <App />
    </DataProvider>
  </HashRouter>,
);
