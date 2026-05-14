import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, 
  Download, 
  Loader2, 
  RotateCcw,
  CheckCircle2, 
  Maximize,
  ArrowLeft,
  Settings2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import FileDropzone from '../components/FileDropzone';

// Configuration du worker locale (Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const CropTool = () => {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [isPasswordRequired, setIsPasswordRequired] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [finalPdfUrl, setFinalPdfUrl] = useState(null);

    const [cropRect, setCropRect] = useState({ x: 10, y: 10, width: 80, height: 80 });
    const containerRef = useRef(null);
    const isDragging = useRef(false);
    const dragType = useRef(null);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const navigate = useNavigate();

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
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;
            setPreviewUrl(canvas.toDataURL());
        } catch (e) {
            console.error(e);
            if (e.name === 'PasswordException') {
                setIsPasswordRequired(true);
                setError("Ce document est protégé par un mot de passe.");
            } else {
                setError("Erreur lors du chargement de l'aperçu du PDF.");
            }
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        onFileChange(file, password);
    };

    const handleMouseDown = (e, type) => {
        e.preventDefault();
        isDragging.current = true;
        dragType.current = type;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const dx = ((e.clientX - lastMousePos.current.x) / rect.width) * 100;
            const dy = ((e.clientY - lastMousePos.current.y) / rect.height) * 100;

            setCropRect(prev => {
                if (dragType.current === 'move') {
                    return {
                        ...prev,
                        x: Math.max(0, Math.min(100 - prev.width, prev.x + dx)),
                        y: Math.max(0, Math.min(100 - prev.height, prev.y + dy))
                    };
                } else if (dragType.current === 'resize') {
                    return {
                        ...prev,
                        width: Math.max(5, Math.min(100 - prev.x, prev.width + dx)),
                        height: Math.max(5, Math.min(100 - prev.y, prev.height + dy))
                    };
                }
                return prev;
            });
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        };
        const handleMouseUp = () => { isDragging.current = false; };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleCrop = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { password: password || undefined });
            const pages = pdfDoc.getPages();
            pages.forEach(page => {
                const { width, height } = page.getSize();
                const cropX = (cropRect.x / 100) * width;
                const cropWidth = (cropRect.width / 100) * width;
                const cropHeight = (cropRect.height / 100) * height;
                const cropY = height - ((cropRect.y / 100) * height) - cropHeight;
                page.setCropBox(cropX, cropY, cropWidth, cropHeight);
                page.setMediaBox(cropX, cropY, cropWidth, cropHeight);
            });
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setFinalPdfUrl(url);
            setIsSuccess(true);
            const link = document.createElement('a');
            link.href = url;
            link.download = `paperFlow_cropped_${file.name}`;
            link.click();
        } catch (e) {
            console.error(e);
            setError("Une erreur s'est produite lors du rognage.");
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreviewUrl(null);
        setIsSuccess(false);
        setError(null);
        setFinalPdfUrl(null);
        setCropRect({ x: 10, y: 10, width: 80, height: 80 });
        setIsPasswordRequired(false);
        setPassword('');
    };

    if (isSuccess) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-[#f3f0f1] dark:bg-[#0f172a] min-h-screen pt-20">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-8 p-12 bg-white dark:bg-[#1e293b] rounded-[48px] shadow-2xl">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={48} /></div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">PDF Rogné !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic">Document prêt au téléchargement.</p>
                    </div>
                    <button onClick={() => { const link = document.createElement('a'); link.href = finalPdfUrl; link.download = `paperFlow_cropped_${file.name}`; link.click(); }} className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95"><Download size={20} /> Télécharger</button>
                    <button onClick={reset} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold uppercase text-xs tracking-widest transition-colors">Rogner un autre</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#0f172a] min-h-screen pt-20">
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase italic text-[#e52424]">Rogner PDF</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">Ajustez les dimensions de vos documents en quelques clics.</p>
            </div>

            {!file ? (
                <FileDropzone onFileSelect={onFileChange} selectedFile={file} accept="application/pdf" label="Choisir le PDF" description="pour commencer" />
            ) : isPasswordRequired ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white dark:bg-[#1e293b] p-10 rounded-[40px] shadow-2xl border border-white dark:border-white/5 text-center space-y-8">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center mx-auto"><Lock size={40} /></div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Fichier Protégé</h3>
                        <p className="text-sm text-slate-500 font-medium">Saisissez le mot de passe du document.</p>
                    </div>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe..." className="w-full h-14 px-6 bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none" autoFocus />
                        <button type="submit" className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">Déverrouiller <ArrowRight size={18} /></button>
                        <button type="button" onClick={reset} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Annuler</button>
                    </form>
                </motion.div>
            ) : (
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="relative bg-white dark:bg-[#1e293b] p-4 rounded-[40px] shadow-2xl border border-white dark:border-white/5 overflow-hidden">
                            <div ref={containerRef} className="relative mx-auto border-2 border-dashed border-slate-200 dark:border-slate-700 select-none min-h-[400px] flex items-center justify-center" style={{ maxHeight: '70vh', width: 'fit-content' }}>
                                {previewUrl ? <img src={previewUrl} alt="Aperçu" className="max-h-[70vh] block pointer-events-none rounded-lg" /> : <Loader2 className="animate-spin text-slate-300" size={48} />}
                                <div className="absolute border-2 border-blue-500 bg-blue-500/20 group cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" style={{ left: `${cropRect.x}%`, top: `${cropRect.y}%`, width: `${cropRect.width}%`, height: `${cropRect.height}%`, zIndex: 10 }} onMouseDown={(e) => handleMouseDown(e, 'move')}>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-tl-lg cursor-se-resize flex items-center justify-center text-white" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize'); }}><Maximize size={12} /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-[#1e293b] p-8 rounded-[40px] shadow-xl space-y-8 h-fit border border-white dark:border-white/5">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-900 dark:text-white"><Settings2 className="text-blue-500" /><h3 className="font-black uppercase tracking-tight">Options</h3></div>
                            <div className="p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-100 dark:border-white/5"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dimensions</p><p className="text-xs font-bold text-slate-700 dark:text-slate-300">L: {Math.round(cropRect.width)}% | H: {Math.round(cropRect.height)}%</p></div>
                        </div>
                        {error && <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-2xl text-[11px] font-bold border border-red-100 dark:border-red-500/20">{error}</div>}
                        <div className="space-y-3">
                            <button onClick={handleCrop} disabled={isProcessing} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">{isProcessing ? <Loader2 className="animate-spin" size={20} /> : <><Scissors size={18} /> Rogner</>}</button>
                            <button onClick={reset} className="w-full py-4 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-colors"><RotateCcw size={14} className="inline mr-2" /> Annuler</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default CropTool;
