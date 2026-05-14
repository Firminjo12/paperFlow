import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trash2, 
    CheckCircle2, 
    Download, 
    FileText, 
    Loader2, 
    History,
    X,
    FileCheck,
    AlertCircle,
    Info,
    RotateCcw,
    MousePointer2,
    Zap,
    Maximize,
    Minimize
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import FileDropzone, { cn } from '../components/FileDropzone';
import { pdfjs as pdfjsLib } from 'react-pdf';
import PageSlider from '../components/PageSlider';

// Worker PDF.js - Optimisation : chargement différé
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const DeletePagesTool = () => {
    const [file, setFile] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [thumbnails, setThumbnails] = useState([]);
    const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [selectedPages, setSelectedPages] = useState(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const { jwt } = useAuth();
    const pdfDocRef = useRef(null);

    // Mémorisation des options pour éviter le warning react-pdf
    const pdfOptions = useMemo(() => ({
        verbosity: 0 
    }), []);

    // Optimisation : Chargement des miniatures par lots (Batching)
    const loadPdfThumbnails = useCallback(async (pdf, totalPages) => {
        const BATCH_SIZE = 4;
        const thumbs = [];
        
        for (let i = 1; i <= totalPages; i += BATCH_SIZE) {
            const currentBatch = [];
            const end = Math.min(i + BATCH_SIZE - 1, totalPages);
            
            for (let j = i; j <= end; j++) {
                currentBatch.push((async (pageNum) => {
                    const page = await pdf.getPage(pageNum);
                    // Optimisation : scale réduit pour les miniatures pour économiser la RAM
                    const viewport = page.getViewport({ scale: 0.4 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d', { alpha: false }); // Optimisation : pas d'alpha
                    
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                        intent: 'display'
                    }).promise;

                    const url = canvas.toDataURL('image/jpeg', 0.6); // Optimisation : JPEG compressé
                    
                    // Nettoyage immédiat du tag canvas
                    canvas.width = 0;
                    canvas.height = 0;
                    
                    return { page: pageNum, url };
                })(j));
            }

            const results = await Promise.all(currentBatch);
            thumbs.push(...results);
            
            // Mise à jour de l'état graduelle pour fluidité
            setThumbnails([...thumbs]);
            setLoadingProgress(Math.round((thumbs.length / totalPages) * 100));
        }
    }, []);

    const loadPdf = async (selectedFile) => {
        setFile(selectedFile);
        setIsSuccess(false);
        setSelectedPages(new Set());
        setThumbnails([]);
        setLoadingProgress(0);
        setIsLoadingThumbnails(true);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ 
                data: arrayBuffer,
                ...pdfOptions
            });
            const pdf = await loadingTask.promise;
            pdfDocRef.current = pdf;
            setNumPages(pdf.numPages);

            await loadPdfThumbnails(pdf, pdf.numPages);
            setIsLoadingThumbnails(false);
        } catch (error) {
            console.error("Erreur chargement PDF :", error);
            setIsLoadingThumbnails(false);
        }
    };

    const togglePageSelection = (pageNum) => {
        const next = new Set(selectedPages);
        if (next.has(pageNum)) {
            next.delete(pageNum);
        } else {
            next.add(pageNum);
        }
        setSelectedPages(next);
    };

    const selectAll = () => {
        // Garder au moins une page par défaut (la 1ère)
        const all = new Set();
        for (let i = 2; i <= numPages; i++) all.add(i);
        setSelectedPages(all);
    };

    const deselectAll = () => {
        setSelectedPages(new Set());
    };

    const generateHighResPreview = async (id) => {
        const pageNum = parseInt(id.split('-')[1]);
        if (!pdfDocRef.current) return null;

        try {
            const page = await pdfDocRef.current.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            return canvas.toDataURL('image/jpeg', 0.9);
        } catch (err) {
            console.error("High-res error:", err);
            return null;
        }
    };

    const handleProcess = async () => {
        if (!file || selectedPages.size === 0 || selectedPages.size === numPages) return;

        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            
            const newPdf = await PDFDocument.create();
            const indicesToKeep = [];
            for (let i = 0; i < numPages; i++) {
                if (!selectedPages.has(i + 1)) {
                    indicesToKeep.push(i);
                }
            }

            const copiedPages = await newPdf.copyPages(pdfDoc, indicesToKeep);
            copiedPages.forEach(p => newPdf.addPage(p));

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const localUrl = URL.createObjectURL(blob);
            setDownloadUrl(localUrl);

            if (jwt) {
                try {
                    const { uploadToStorage } = await import('../utils/storage');
                    const downloadURL = await uploadToStorage(blob, 'user', 'deleted');
                    
                    await api.logDocument(jwt, {
                        file_name: `Deleted: ${file.name}`,
                        file_size: blob.size,
                        action: 'delete-pages',
                        pages_count: indicesToKeep.length,
                        file_url: downloadURL
                    });
                } catch (err) {
                    api.logDocument(jwt, {
                        file_name: `Deleted: ${file.name}`,
                        file_size: blob.size,
                        action: 'delete-pages',
                        pages_count: indicesToKeep.length,
                        file_url: null
                    }).catch(() => {});
                }
            }

            setTimeout(() => {
                setIsSuccess(true);
                setIsProcessing(false);
            }, 800);
        } catch (error) {
            console.error("Erreur suppression :", error);
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setNumPages(0);
        setSelectedPages(new Set());
        setThumbnails([]);
        setIsSuccess(false);
        setDownloadUrl(null);
        setLoadingProgress(0);
    };

    if (isSuccess) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-[#060912] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600 rounded-full blur-[120px]"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-[50px] border border-slate-100 dark:border-white/5 shadow-2xl p-10 md:p-14 space-y-10 relative z-10"
                >
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20 rotate-3">
                            <CheckCircle2 size={40} strokeWidth={3} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">C'est tout propre !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Le PDF a été généré avec {numPages - selectedPages.size} pages.</p>
                    </div>

                    <div className="flex items-center justify-center gap-6 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                        <div className="text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Poids final</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">Optimum</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-white/10"></div>
                        <div className="text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Pages</p>
                            <p className="text-xl font-bold text-blue-600">{numPages - selectedPages.size}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <motion.a
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            href={downloadUrl}
                            download={`Optimized_${file.name}`}
                            className="h-20 bg-slate-900 dark:bg-blue-600 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-xl"
                        >
                            <Download size={24} strokeWidth={3} /> Télécharger maintenant
                        </motion.a>
                        <button onClick={reset} className="h-14 text-slate-400 hover:text-slate-900 dark:hover:text-white font-black text-[9px] uppercase tracking-[0.4em] transition-colors">
                            Éditer un nouveau fichier
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-10 space-y-12 bg-white dark:bg-[#060912] relative overflow-hidden min-h-screen">
            {/* Background Gradient Mesh - Optimized */}
            <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none opacity-40 dark:opacity-10 blur-3xl overflow-hidden">
                <div className="absolute -top-1/2 -left-1/4 w-[80%] h-[80%] bg-blue-100 dark:bg-blue-900 rounded-full"></div>
                <div className="absolute -top-1/4 -right-1/4 w-[60%] h-[60%] bg-red-100 dark:bg-red-900/40 rounded-full"></div>
            </div>

            <div className="max-w-4xl w-full space-y-4 text-center relative z-10">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 mb-4">
                       <Zap size={14} className="text-blue-500 shadow-blue-500/50" />
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Moteur rapide v2.0 • Local Only</span>
                   </div>
                </motion.div>
                <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase italic">
                    Allégez Votre <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-blue-700">Document PDF.</span>
                </h1>
            </div>

            {!file ? (
                <div className="w-full max-w-4xl relative z-10">
                    <FileDropzone 
                        onFileSelect={loadPdf}
                        selectedFile={file}
                        label="Cliquez ou déposez votre PDF"
                        description="Analyse ultra-rapide et sécurisée"
                    />
                </div>
            ) : (
                <div className="w-full max-w-6xl pb-40">
                    {/* Preview Area */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 dark:bg-white/5 backdrop-blur-xl rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl w-full min-h-[500px] overflow-hidden"
                    >
                        <div className="p-8 md:p-10 space-y-10">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 rotate-[-5deg]">
                                        <FileText size={28} />
                                    </div>
                                    <div className="max-w-[150px] md:max-w-md">
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white truncate uppercase italic">{file.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{numPages} PAGES</span>
                                            {isLoadingThumbnails && (
                                                <span className="text-[9px] font-black text-blue-600 animate-pulse">{loadingProgress}%</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={selectAll} className="px-5 py-2.5 bg-white dark:bg-white/10 text-slate-600 dark:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 hover:bg-slate-50 transition-all flex items-center gap-2">
                                        <Maximize size={14} /> Tout
                                    </button>
                                    <button onClick={deselectAll} className="px-5 py-2.5 bg-white dark:bg-white/10 text-slate-600 dark:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 hover:bg-slate-50 transition-all flex items-center gap-2">
                                        <Minimize size={14} /> Aucun
                                    </button>
                                    <button onClick={reset} className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl hover:bg-red-100 transition-all">
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            {isLoadingThumbnails && thumbnails.length === 0 ? (
                                <div className="h-[450px] flex flex-col items-center justify-center gap-6">
                                    <div className="relative">
                                        <Loader2 className="animate-spin text-blue-600" size={56} strokeWidth={3} />
                                        <div className="absolute inset-0 blur-lg bg-blue-600/20 rounded-full animate-pulse"></div>
                                    </div>
                                    <p className="font-black uppercase tracking-[0.4em] text-slate-300 text-[10px]">Optimisation du moteur PDF...</p>
                                </div>
                            ) : (
                                <PageSlider 
                                    pages={thumbnails.map(t => ({
                                        ...t,
                                        id: `p-${t.page}`,
                                        isSelected: selectedPages.has(t.page)
                                    }))}
                                    mode="delete"
                                    onPageSelect={(id) => {
                                        const pageNum = parseInt(id.split('-')[1]);
                                        togglePageSelection(pageNum);
                                    }}
                                    onPreview={generateHighResPreview}
                                />
                            )}
                        </div>
                    </motion.div>

                    {/* Floating Summary Bar */}
                    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-8 pointer-events-none">
                        <motion.div 
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="max-w-5xl mx-auto bg-slate-900/90 dark:bg-black/90 backdrop-blur-2xl px-6 md:px-10 py-5 md:py-6 rounded-[32px] md:rounded-[40px] border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-auto"
                        >
                            <div className="flex items-center gap-6 md:gap-10 text-white">
                                <div className="flex flex-col">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Document actuel</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl md:text-4xl font-black italic">{numPages}</span>
                                        <span className="text-xs font-black opacity-40 uppercase tracking-widest">Pages total</span>
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="flex flex-col">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-1">À supprimer</p>
                                    <span className={`text-2xl md:text-4xl font-black tabular-nums transition-colors ${selectedPages.size > 0 ? 'text-red-500' : 'text-white/20'}`}>
                                        {selectedPages.size}
                                    </span>
                                </div>
                                <div className="hidden sm:block w-px h-10 bg-white/10" />
                                <div className="hidden sm:flex flex-col">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Restantes</p>
                                    <span className="text-xl md:text-2xl font-black italic">{numPages - selectedPages.size} pages</span>
                                </div>
                            </div>

                            <button
                                onClick={handleProcess}
                                disabled={selectedPages.size === 0 || isProcessing || selectedPages.size === numPages}
                                className={cn(
                                    "w-full md:w-auto h-16 md:h-20 px-8 md:px-12 rounded-[24px] md:rounded-[32px] font-black text-xs md:text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-xl",
                                    selectedPages.size === 0 || selectedPages.size === numPages
                                        ? "bg-white/5 text-white/10 cursor-not-allowed"
                                        : "bg-white text-slate-900 hover:scale-[1.02] active:scale-95 shadow-white/5"
                                )}
                            >
                                {isProcessing ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <Zap size={24} strokeWidth={3} className="text-blue-600" />
                                )}
                                <span>{isProcessing ? 'Traitement...' : 'Supprimer les pages'}</span>
                            </button>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeletePagesTool;
