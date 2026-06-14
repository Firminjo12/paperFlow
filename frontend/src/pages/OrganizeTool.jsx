import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFeedback } from '../contexts/FeedbackContext';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
    LayoutGrid, 
    FileUp, 
    CheckCircle2, 
    Download, 
    FileText, 
    Loader2, 
    History,
    X,
    RotateCcw,
    Trash2,
    GripVertical,
    FileCheck,
    RefreshCw
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import FileDropzone, { cn } from '../components/FileDropzone';
import { pdfjs as pdfjsLib } from 'react-pdf';
import PageSlider from '../components/PageSlider';
import { uploadToStorage } from '../utils/storage';

const OrganizeTool = () => {
    const [file, setFile] = useState(null);
    const [pages, setPages] = useState([]); // { id: string, originalIndex: number, url: string, rotation: number }
    const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const { jwt, user } = useAuth();
    const { triggerFeedback } = useFeedback();
    const pdfDocRef = useRef(null);

    // Mémorisation des options pour éviter le warning react-pdf
    const pdfOptions = useMemo(() => ({
        wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/wasm/`,
        verbosity: 0 
    }), []);

    const loadPdf = async (selectedFile) => {
        setFile(selectedFile);
        setIsSuccess(false);
        setPages([]);
        setIsLoadingThumbnails(true);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ 
                data: arrayBuffer,
                ...pdfOptions
            });
            const pdf = await loadingTask.promise;
            pdfDocRef.current = pdf;

            const loadedPages = [];
            const BATCH_SIZE = 4;
            
            for (let i = 1; i <= pdf.numPages; i += BATCH_SIZE) {
                const batchPromises = [];
                const end = Math.min(i + BATCH_SIZE - 1, pdf.numPages);
                
                for (let j = i; j <= end; j++) {
                    batchPromises.push((async (pageNum) => {
                        const page = await pdf.getPage(pageNum);
                        const viewport = page.getViewport({ scale: 0.25 });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d', { alpha: false });
                        
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        
                        await page.render({
                            canvasContext: context,
                            viewport: viewport
                        }).promise;
                        
                        const url = canvas.toDataURL('image/jpeg', 0.6);
                        
                        // Nettoyage mémoire immédiat
                        canvas.width = 0;
                        canvas.height = 0;
                        
                        return {
                            id: `page-${pageNum}-${Date.now()}`,
                            originalIndex: pageNum - 1,
                            url: url,
                            rotation: 0
                        };
                    })(j));
                }
                
                const results = await Promise.all(batchPromises);
                loadedPages.push(...results);
                setPages([...loadedPages]);
            }
            setIsLoadingThumbnails(false);
        } catch (error) {
            console.error("Erreur chargement PDF :", error);
            setIsLoadingThumbnails(false);
        }
    };

    const rotatePage = (id) => {
        setPages(prev => prev.map(p => 
            p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
        ));
    };

    const deletePage = (id) => {
        setPages(prev => prev.filter(p => p.id !== id));
    };

    const generateHighResPreview = async (id) => {
        const pageData = pages.find(p => p.id === id);
        if (!pageData || !pdfDocRef.current) return null;

        try {
            const page = await pdfDocRef.current.getPage(pageData.originalIndex + 1);
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
        if (!file || pages.length === 0) return;

        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            
            // Create a new PDF
            const newPdf = await PDFDocument.create();
            
            // Collect all indices to copy and their rotations
            const indicesToCopy = pages.map(p => p.originalIndex);
            const copiedPages = await newPdf.copyPages(pdfDoc, indicesToCopy);
            
            copiedPages.forEach((p, idx) => {
                const originalRotation = p.getRotation().angle;
                const addedRotation = pages[idx].rotation;
                p.setRotation(degrees(originalRotation + addedRotation));
                newPdf.addPage(p);
            });

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            // Log action to DB
            if (jwt) {
                try {
                    const userId = user?.id || user?._id || 'anonymous';
                    const downloadURL = await uploadToStorage(blob, userId, 'organized');

                    await api.logDocument(jwt, {
                        file_name: `Organized: ${file.name}`,
                        file_size: blob.size,
                        action: 'organize',
                        pages_count: pages.length,
                        file_url: downloadURL
                    });
                } catch (err) {
                    console.error("Logging Error:", err);
                }
            }

            setTimeout(() => {
                setIsSuccess(true);
                setIsProcessing(false);
            }, 800);
        } catch (error) {
            console.error("Erreur réorganisation PDF :", error);
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPages([]);
        setIsSuccess(false);
        setDownloadUrl(null);
    };

    if (isSuccess) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-[#f3f0f1] dark:bg-[#060912]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl w-full bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl p-10 md:p-16 space-y-10"
                >
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-600/20 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">Document réorganisé !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg uppercase tracking-tight">Vos modifications ont été appliquées avec succès.</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-black/20 rounded-[32px] p-8 space-y-6 text-center">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de pages</p>
                            <p className="text-4xl font-black text-blue-600">{pages.length}</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = `paperFlow_organized.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                triggerFeedback();
                            }}
                            className="flex-1 h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Download size={20} /> Télécharger le PDF
                        </button>
                        <button
                            onClick={reset}
                            className="px-8 h-16 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            <History size={20} /> Autre PDF
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#060912]">
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
                    Organiser <br />
                    <span className="text-blue-600">votre PDF.</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium tracking-tighter uppercase">
                    Réorganisez, tournez ou supprimez des pages par simple glisser-déposer. Traitement 100% local.
                </p>
            </div>

            {!file ? (
                <FileDropzone 
                    onFileSelect={loadPdf}
                    selectedFile={file}
                    label="Sélectionner le PDF"
                    description="ou déposez le PDF ici"
                />
            ) : (
                <div className="w-full max-w-6xl pb-40">
                    {/* Main Organizer Area */}
                    <div className="bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl p-6 md:p-10 w-full min-h-[500px] relative transition-all">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <LayoutGrid size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md">{file.name}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{pages.length} pages</p>
                                </div>
                            </div>
                            <button onClick={reset} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {isLoadingThumbnails && pages.length === 0 ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                                <Loader2 className="animate-spin text-blue-600" size={48} />
                                <p className="font-black uppercase tracking-widest text-slate-400 animate-pulse text-xs text-center">Chargement des pages...</p>
                            </div>
                        ) : (
                            <PageSlider 
                                pages={pages}
                                mode="organize"
                                onPageRotate={rotatePage}
                                onPageDelete={deletePage}
                                onReorder={(newOrder) => setPages(newOrder)}
                                onPreview={generateHighResPreview}
                            />
                        )}
                    </div>

                    {/* Floating Summary Bar */}
                    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-8 pointer-events-none">
                        <motion.div 
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="max-w-5xl mx-auto bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl px-6 md:px-10 py-5 md:py-6 rounded-[32px] md:rounded-[40px] border border-slate-200 dark:border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-auto"
                        >
                            <div className="flex items-center gap-6 md:gap-10">
                                <div className="flex flex-col">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Pages finales</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl md:text-4xl font-black text-blue-600">
                                            {pages.length}
                                        </span>
                                        <span className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest">Pages total</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-10 bg-slate-200 dark:bg-white/10" />
                                <div className="hidden sm:flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">État de l'ordre</span>
                                    <span className="text-xs md:text-sm font-black text-green-600 uppercase tracking-tight">Prêt pour réorganisation</span>
                                </div>
                            </div>

                            <button
                                onClick={handleProcess}
                                disabled={pages.length === 0 || isProcessing}
                                className={cn(
                                    "w-full md:w-auto h-16 md:h-20 px-8 md:px-12 rounded-[24px] md:rounded-[32px] font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 relative overflow-hidden shadow-2xl",
                                    pages.length === 0
                                        ? "bg-slate-100 dark:bg-white/5 text-slate-300 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:scale-[1.02] active:scale-95 shadow-blue-500/20 shadow-lg"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {isProcessing ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <RefreshCw size={20} strokeWidth={3} />
                                    )}
                                    <span>{isProcessing ? 'Traitement...' : 'Organiser le PDF'}</span>
                                </div>
                            </button>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizeTool;
