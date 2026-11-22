import {AppErrorBoundary} from './components/common/AppErrorBoundary';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

window.gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origConsoleError = console.error;
console.error = (...args) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => (typeof a === 'string' ? a : a?.message || '')).join(' ');
  if (
    msg.includes('OverQuotaMapError') ||
    msg.includes('QuotaExceeded') ||
    msg.includes('RESOURCE_EXHAUSTED')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

createRoot(document.getElementById('root')!).render(<AppErrorBoundary><App /></AppErrorBoundary>);

