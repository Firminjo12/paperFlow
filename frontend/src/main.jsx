import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { BrandingProvider } from './contexts/BrandingContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { FeedbackProvider } from './contexts/FeedbackContext'
import ErrorBoundary from './ErrorBoundary.jsx'
import { pdfjs } from 'react-pdf';

// Global PDF.js configuration (Worker, Fonts, CMaps)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
pdfjs.GlobalWorkerOptions.wasmUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`;
pdfjs.GlobalWorkerOptions.standardFontDataUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`;
pdfjs.GlobalWorkerOptions.cMapUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`;
pdfjs.GlobalWorkerOptions.cMapPacked = true;

// Patch de sécurité pour éviter les crashs "removeChild" et "insertBefore" causés par des extensions (ex: Google Translate)
if (typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console) console.warn('Signature Flow: prevented removeChild crash', child, this);
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) console.warn('Signature Flow: prevented insertBefore crash', newNode, referenceNode, this);
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthProvider>
      <BrandingProvider>
        <ThemeProvider>
          <FeedbackProvider>
            <App />
          </FeedbackProvider>
        </ThemeProvider>
      </BrandingProvider>
    </AuthProvider>
  </ErrorBoundary>
)
