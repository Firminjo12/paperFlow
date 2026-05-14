import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { 
  Moon, 
  Sun, 
  HelpCircle, 
  CheckCircle2, 
  ChevronDown, 
  FileImage, 
  FileText, 
  Presentation, 
  FileSearch, 
  Globe,
  Image as ImageIcon, 
  FileType, 
  LayoutGrid, 
  Zap, 
  Scissors,
  FileStack, 
  Signature, 
  Files, 
  Lock, 
  Unlock, 
  Hash, 
  Type, 
  RotateCcw, 
  FileEdit, 
  X, 
  Settings
} from 'lucide-react';

// Pages
import Home from './pages/Home';
import JpgToPdf from './pages/JpgToPdf';
import WordToPdf from './pages/WordToPdf';
import PptToPdf from './pages/PptToPdf';
import HtmlToPdf from './pages/HtmlToPdf';
import PdfToJpg from './pages/PdfToJpg';
import PdfToWord from './pages/PdfToWord';
import PdfToA from './pages/PdfToA';
import SmartConverter from './pages/SmartConverter';
import DownloadTest from './pages/DownloadTest';
import GenericTool from './pages/GenericTool';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MergeTool from './pages/MergeTool';
import SplitTool from './pages/SplitTool';
import CompressTool from './pages/CompressTool';
import RotatePdf from './pages/RotatePdf';
import PageNumbersTool from './pages/PageNumbersTool';
import DeletePagesTool from './pages/DeletePagesTool';
import ExtractPagesTool from './pages/ExtractPagesTool';
import OrganizeTool from './pages/OrganizeTool';
import WatermarkTool from './pages/WatermarkTool';
import EditPdfTool from './pages/EditPdfTool';
import PdfToPpt from './pages/PdfToPpt';
import RepairTool from './pages/RepairTool';
import OCRTool from './pages/OCRTool';
import ScanToPDFTool from './pages/ScanToPDFTool';
import UnlockTool from './pages/UnlockTool';
import ProtectTool from './pages/ProtectTool';
import CensureTool from './pages/CensureTool';
import CropTool from './pages/CropTool';
import Logs from './pages/Logs';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Original Components
import FileDropzone from './components/FileDropzone';
import SignaturePadComp from './components/SignaturePad';
import PdfEditor from './components/PdfEditor';
import StepTooltip from './components/StepTooltip';
import Footer from './components/Footer';
import RatingModal from './components/RatingModal';
import NavigationBar from './components/NavigationBar';
import SiteHeader from './components/SiteHeader';

const SignTool = ({ mode = 'sign', file, setFile, signatureUrl, setSignatureUrl }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState(mode);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [finalDocUrl, setFinalDocUrl] = useState(null);
  const [finalDocName, setFinalDocName] = useState("");
  const editorRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setActiveTab(mode);
  }, [mode]);

  const handleFileSelect = (selectedFile) => setFile(selectedFile);
  const handleSignatureSave = (url) => setSignatureUrl(url);

  const resetApp = () => {
    setStep(1);
    setFile(null);
    setSignatureUrl(null);
    setIsRatingModalOpen(false);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else if (step === 3) {
      if (editorRef.current && editorRef.current.isReady) {
        editorRef.current.finalize();
      } else {
        setIsRatingModalOpen(true);
        setStep(4);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const isNextDisabled = () => {
    if (step === 1) return !file;
    if (step === 2) return !signatureUrl;
    return false;
  };

  return (
    <div className="flex-1 flex flex-col relative">
        <div className="flex-1 flex flex-col pt-12 md:pt-20">
          {step === 4 ? (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 dark:bg-black/20">
              <div className="text-center p-12 space-y-4">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-600/20 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Document Finalisé !</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Votre document est prêt à être téléchargé.</p>
                <div className="flex gap-4 justify-center mt-8">
                  <button 
                    onClick={() => {
                        const link = document.createElement('a');
                        link.href = finalDocUrl;
                        link.download = finalDocName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => setIsRatingModalOpen(true), 1500);
                    }} 
                    className="px-10 py-4 bg-red-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    Télécharger
                  </button>
                  <button 
                    onClick={resetApp} 
                    className="px-10 py-4 bg-blue-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    Recommencer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'sign' && (
                <>
                  {step === 1 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                      <div className="max-w-4xl w-full space-y-12 text-center">
                        <div className="space-y-6">
                            <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1] uppercase">
                                Signer PDF <br />
                                <span className="text-[#e52424] italic">PROuvenant de partout.</span>
                            </h1>
                            <p className="text-lg text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto uppercase tracking-tighter">
                                La meilleure alternative à Adobe Sign pour signer vos PDF. <br className="hidden md:block" />
                                <span className="text-slate-400 font-black text-[9px] tracking-[0.3em]">Juridiquement contraignant • 100% sécurisé</span>
                            </p>
                        </div>
                        <div className="w-full max-w-lg mx-auto">
                            <FileDropzone 
                                onFileSelect={handleFileSelect} 
                                selectedFile={file} 
                                label="Choisir le PDF à signer"
                                description="ou déposez le document ici"
                            />
                        </div>
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <div className="flex-1 h-full max-w-4xl mx-auto w-full p-6 md:p-12 overflow-y-auto">
                      <SignaturePadComp onSave={handleSignatureSave} savedUrl={signatureUrl} />
                    </div>
                  )}
                  {step === 3 && (
                    <div className="flex-1 h-full w-full bg-slate-100 dark:bg-black/40 overflow-hidden relative">
                      <PdfEditor ref={editorRef} file={file} signatureUrl={signatureUrl} onComplete={(url, docName) => {
                        setFinalDocUrl(url);
                        setFinalDocName(docName);
                        setStep(4);
                      }} />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'merge' && <MergeTool />}
              {activeTab === 'split' && <SplitTool />}
              {activeTab === 'compress' && <CompressTool />}
            </>
          )}
        </div>

        {activeTab === 'sign' && step < 4 && (
          <NavigationBar
            currentStep={step}
            onBack={handleBack}
            onNext={handleNext}
            nextDisabled={isNextDisabled()}
            isLastStep={step === 3}
          />
        )}

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => {
          setIsRatingModalOpen(false);
          if (step === 4) setStep(1);
        }}
        onReset={resetApp}
      />
    </div>
  );
};

function App() {
  const [file, setFile] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toolProps = { file, setFile, signatureUrl, setSignatureUrl };

  return (
    <Router>
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#060912] transition-colors duration-500 overflow-x-hidden pt-20">
          <SiteHeader />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sign" element={<SignTool mode="sign" {...toolProps} />} />
              <Route path="/merge" element={<SignTool mode="merge" {...toolProps} />} />
              <Route path="/split" element={<SignTool mode="split" {...toolProps} />} />
              <Route path="/compress" element={<SignTool mode="compress" {...toolProps} />} />
              <Route path="/converter" element={<SmartConverter />} />
              <Route path="/test-download" element={<DownloadTest />} />
              <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
              <Route path="/word-to-pdf" element={<WordToPdf />} />
              <Route path="/ppt-to-pdf" element={<PptToPdf />} />
              <Route path="/html-to-pdf" element={<HtmlToPdf />} />
              <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
              <Route path="/pdf-to-word" element={<PdfToWord />} />
              <Route path="/pdf-to-ppt" element={<PdfToPpt />} />
              <Route path="/pdf-to-pdfa" element={<PdfToA />} />
              
              <Route path="/remove-pages" element={<DeletePagesTool />} />
              <Route path="/extract-pages" element={<ExtractPagesTool />} />
              <Route path="/organize" element={<OrganizeTool />} />
              
              <Route path="/edit" element={<EditPdfTool />} />
              <Route path="/watermark" element={<WatermarkTool />} />
              <Route path="/repair" element={<RepairTool />} />
              
              <Route path="/scan-to-pdf" element={<ScanToPDFTool />} />
              <Route path="/ocr" element={<OCRTool />} />
              <Route path="/rotate" element={<RotatePdf />} />
              <Route path="/page-numbers" element={<PageNumbersTool />} />
              <Route path="/unlock" element={<UnlockTool />} />
              <Route path="/protect" element={<ProtectTool />} />
              <Route path="/censure" element={<CensureTool />} />
              <Route path="/rogner" element={<CropTool />} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
    </Router>
  );
}

export default App;
