import React from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/ibm-plex-mono/latin-400.css';
import {AfterHours} from './variants';
import {MacHelp} from './shared';
import './styles.css';
const Page=location.pathname.startsWith('/mac-help')?MacHelp:AfterHours;
createRoot(document.getElementById('root')).render(<><a className="skip-link" href="#main-content">Skip to content</a><div id="main-content"><Page/></div></>);
