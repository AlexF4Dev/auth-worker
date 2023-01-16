import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { loadAuthWorker } from 'auth-worker';
import { OAUTH2_CONFIG } from './config';

loadAuthWorker(OAUTH2_CONFIG, '/service-worker.global.js');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
