// index.jsx or main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import './i18next.js'; // Import i18next configuration
import { DataProvider } from './DataProvider.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx'; // Create this file if not already

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <ErrorBoundary>
        <DataProvider>
          <App />
        </DataProvider>
      </ErrorBoundary>
    </Router>
  </StrictMode>
);
