import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { VoiceSOSProvider } from './contexts/VoiceSOSContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VoiceSOSProvider>
      <App />
    </VoiceSOSProvider>
  </React.StrictMode>,
);
