import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Download, 
  Loader2, 
  RotateCcw,
  CheckCircle2, 
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  AlertCircle,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import FileDropzone from '../components/FileDropzone';

// Configuration du Worker locale (Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const CensureTool = () => {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [isPasswordRequired, setIsPasswordRequired] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [finalPdfUrl, setFinalPdfUrl] = useState(null);
    const [pdfInstance, setPdfInstance] = useState(null);

    const [redactions, setRedactions] = useState([]);
    const [activeRedaction, setActiveRedaction] = useState(null);
    const containerRef = useRef(null);
    const navigate = useNavigate();

    // 1. Chargement PDF avec gestion du mot de passe
    const onFileChange = async (selectedFile, pwd = '') => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setIsSuccess(false);
        setError(null);
        
        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ 
                data: arrayBuffer,
                password: pwd,
                useSystemFonts: true 
            });
            
            const pdf = await loadingTask.promise;
            
            setIsPasswordRequired(false);
            setPdfInstance(pdf);
            setNumPages(pdf.numPages);
            await renderCurrentPage(pdf, 1);
        } catch (e) {
            console.error("Erreur PDF.js:", e);
            if (e.name === 'PasswordException') {
                setIsPasswordRequired(true);
                setError("Ce document est protégé. Veuillez saisir le mot de passe.");
            } else {
                setError("Impossible de charger ce PDF. Il est peut-être corrompu.");
            }
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        onFileChange(file, password);
    };

    const renderCurrentPage = async (pdf, pageNum) => {
        try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;
            setPreviewUrl(canvas.toDataURL());
        } catch (err) {
            console.error("Erreur de rendu page:", err);
            setError("Erreur lors de l'affichage de la page.");
        }
    };

    const handleNextPage = async () => {
        if (currentPage < numPages) {
            const next = currentPage + 1;
            setCurrentPage(next);
            await renderCurrentPage(pdfInstance, next);
        }
    };

    const handlePrevPage = async () => {
        if (currentPage > 1) {
            const prev = currentPage - 1;
            setCurrentPage(prev);
            await renderCurrentPage(pdfInstance, prev);
        }
    };

    // 2. Logique de dessin
    const handleMouseDown = (e) => {
        if (!containerRef.current || !previewUrl) return;
        const rect = containerRef.current.getBoundingClientRect();
        const startX = ((e.clientX - rect.left) / rect.width) * 100;
        const startY = ((e.clientY - rect.top) / rect.height) * 100;
        setActiveRedaction({ x: startX, y: startY, width: 0, height: 0, page: currentPage });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!activeRedaction || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const currentX = ((e.clientX - rect.left) / rect.width) * 100;
            const currentY = ((e.clientY - rect.top) / rect.height) * 100;
            setActiveRedaction(prev => ({ ...prev, width: currentX - prev.x, height: currentY - prev.y }));
        };

        const handleMouseUp = () => {
            if (activeRedaction) {
                const normalized = {
                    page: activeRedaction.page,
                    x: activeRedaction.width < 0 ? activeRedaction.x + activeRedaction.width : activeRedaction.x,
                    y: activeRedaction.height < 0 ? activeRedaction.y + activeRedaction.height : activeRedaction.y,
                    width: Math.abs(activeRedaction.width),
                    height: Math.abs(activeRedaction.height)
                };
                if (normalized.width > 0.5 && normalized.height > 0.5) setRedactions(prev => [...prev, normalized]);
                setActiveRedaction(null);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [activeRedaction]);

    const removeRedaction = (index) => setRedactions(prev => prev.filter((_, i) => i !== index));

    const handleApplyRedaction = async () => {
        if (!file || redactions.length === 0) return;
        setIsProcessing(true);
        setError(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            // Chargement pdf-lib avec mot de passe si présent
            const pdfDoc = await PDFDocument.load(arrayBuffer, { password: password || undefined });
            const pages = pdfDoc.getPages();

            redactions.forEach(redact => {
                const page = pages[redact.page - 1];
                const { width, height } = page.getSize();
                const pdfX = (redact.x / 100) * width;
                const pdfW = (redact.width / 100) * width;
                const pdfH = (redact.height / 100) * height;
                const pdfY = height - ((redact.y / 100) * height) - pdfH;
                page.drawRectangle({ x: pdfX, y: pdfY, width: pdfW, height: pdfH, color: rgb(0, 0, 0) });
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setFinalPdfUrl(url);
            setIsSuccess(true);
            const link = document.createElement('a');
            link.href = url;
            link.download = `SignFlow_redacted_${file.name}`;
            link.click();
        } catch (e) {
            console.error(e);
            setError("Erreur technique lors de la sauvegarde.");
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPdfInstance(null);
        setPreviewUrl(null);
        setIsSuccess(false);
        setNumPages(0);
        setError(null);
        setRedactions([]);
        setCurrentPage(1);
        setIsPasswordRequired(false);
        setPassword('');
    };

    if (isSuccess) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-[#f3f0f1] dark:bg-[#0f172a] min-h-screen pt-20">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-8 p-12 bg-white dark:bg-[#1e293b] rounded-[48px] shadow-2xl">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={48} /></div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Censure Appliquée !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Votre document sécurisé est prêt.</p>
                    </div>
                    <button onClick={() => { const link = document.createElement('a'); link.href = finalPdfUrl; link.download = `SignFlow_redacted_${file.name}`; link.click(); }} className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"><Download size={20} /> Télécharger</button>
                    <button onClick={reset} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold uppercase text-xs tracking-widest transition-colors">Recommencer</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#0f172a] min-h-screen pt-20">
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">Censurer <span className="text-[#e52424]">PDF</span></h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">Masquez les informations sensibles avec des blocs noirs permanents.</p>
            </div>

            {!file ? (
                <FileDropzone onFileSelect={onFileChange} selectedFile={file} accept="application/pdf" label="Choisir le PDF à censurer" description="Glissez votre fichier ici" />
            ) : isPasswordRequired ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white dark:bg-[#1e293b] p-10 rounded-[40px] shadow-2xl border border-white dark:border-white/5 text-center space-y-8">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center mx-auto"><Lock size={40} /></div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Fichier Protégé</h3>
                        <p className="text-sm text-slate-500 font-medium">Saisissez le mot de passe pour ouvrir le document.</p>
                    </div>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe..." className="w-full h-14 px-6 bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" autoFocus />
                        <button type="submit" className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">Déverrouiller <ArrowRight size={18} /></button>
                        <button type="button" onClick={reset} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Choisir un autre fichier</button>
                    </form>
                </motion.div>
            ) : (
                <div className="w-full max-w-6xl grid grid-cols-1 xl:grid-cols-4 gap-8">
                    <div className="xl:col-span-3 space-y-6">
                        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[48px] shadow-2xl border border-white dark:border-white/5">
                            <div className="flex items-center justify-between mb-6 px-4">
                                <button onClick={handlePrevPage} disabled={currentPage === 1} className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl disabled:opacity-30"><ChevronLeft /></button>
                                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Page {currentPage} / {numPages || '...'}</span>
                                <button onClick={handleNextPage} disabled={currentPage === numPages} className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl disabled:opacity-30"><ChevronRight /></button>
                            </div>
                            <div ref={containerRef} onMouseDown={handleMouseDown} className="relative mx-auto bg-slate-100 dark:bg-[#0f172a] border-2 border-dashed border-slate-200 dark:border-slate-800 cursor-crosshair select-none rounded-[16px] overflow-hidden min-h-[400px] flex items-center justify-center" style={{ maxHeight: '70vh', width: 'fit-content' }}>
                                {previewUrl ? <img src={previewUrl} alt="Aperçu" className="max-h-[70vh] block pointer-events-none" /> : <div className="flex flex-col items-center gap-4 text-slate-400"><Loader2 className="animate-spin" size={48} /><p className="text-xs font-black uppercase tracking-widest">Chargement...</p></div>}
                                {redactions.filter(r => r.page === currentPage).map((redact, idx) => <div key={idx} className="absolute bg-black" style={{ left: `${redact.x}%`, top: `${redact.y}%`, width: `${redact.width}%`, height: `${redact.height}%` }} />)}
                                {activeRedaction && activeRedaction.page === currentPage && <div className="absolute bg-black/60 border border-blue-400" style={{ left: activeRedaction.width < 0 ? `${activeRedaction.x + activeRedaction.width}%` : `${activeRedaction.x}%`, top: activeRedaction.height < 0 ? `${activeRedaction.y + activeRedaction.height}%` : `${activeRedaction.y}%`, width: `${Math.abs(activeRedaction.width)}%`, height: `${Math.abs(activeRedaction.height)}%` }} />}
                            </div>
                        </div>
                    </div>
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[40px] shadow-xl border border-white dark:border-white/5 h-full flex flex-col">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3"><EyeOff className="text-red-500" size={20} /> Zones ({redactions.length})</h3>
                            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl text-[10px] font-bold flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
                            <div className="flex-1 overflow-y-auto space-y-3 mb-8 pr-2">
                                {redactions.length === 0 ? <p className="text-center py-12 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aucune zone tracée</p> : redactions.map((redact, idx) => <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl"><span className="text-[10px] font-black text-blue-500">PAGE {redact.page}</span><button onClick={() => removeRedaction(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button></div>)}
                            </div>
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                <button onClick={handleApplyRedaction} disabled={isProcessing || redactions.length === 0} className="w-full h-16 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">{isProcessing ? <Loader2 className="animate-spin" /> : <><ShieldAlert size={18} /> Censurer</>}</button>
                                <button onClick={reset} className="w-full py-2 text-slate-400 text-[10px] font-black uppercase tracking-widest"><RotateCcw size={14} className="inline mr-2" /> Réinitialiser</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CensureTool;
