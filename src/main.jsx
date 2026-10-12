import { createRoot } from 'react-dom/client';
import { AppProvider } from './context/AppContext.jsx';
import { App } from './App.jsx';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';

createRoot(document.getElementById('root')).render(
  <AppProvider>
    <App />
  </AppProvider>
);
