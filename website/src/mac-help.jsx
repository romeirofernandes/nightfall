import React from 'react';
import {createRoot} from 'react-dom/client';
import {MacHelp} from './shared';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div id="main-content"><MacHelp/></div>
  </>,
);
