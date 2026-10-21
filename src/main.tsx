import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {CloudProvider} from './cloud';
import './index.css';

createRoot(document.getElementById('root')!).render(<CloudProvider><App /></CloudProvider>);
