import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './containers/app';
import { SocketProvider } from './providers/SocketProvider';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  const tetrisElement = document.getElementById('tetris');
  if (tetrisElement) {
    const root = createRoot(tetrisElement);
    root.render(
      <SocketProvider>
        <App />
      </SocketProvider>
    );
  } else {
    console.error('Could not find element with id "tetris"');
  }
});

