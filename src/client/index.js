import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './containers/app';

const root = createRoot(document.getElementById('tetris'));
root.render(<App />);

