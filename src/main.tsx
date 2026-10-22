import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {CloudProvider} from './cloud';
import './index.css';

try { const theme=localStorage.getItem('generator-theme')==='light'?'light':'dark'; document.documentElement.dataset.theme=theme; document.documentElement.style.colorScheme=theme; } catch {}

createRoot(document.getElementById('root')!).render(<CloudProvider><App /></CloudProvider>);
