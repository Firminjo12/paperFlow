import React, { useState, useRef, useEffect, useMemo } from 'react';
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

const OrganizeTool = () => {
    const [file, setFile] = useState(null);
    const [pages, setPages] = useState([]); // { id: string, originalIndex: number, url: string, rotation: number }
    const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const { jwt } = useAuth();
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
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                loadedPages.push({
                    id: `page-${i}-${Date.now()}`,
                    originalIndex: i - 1,
                    url: canvas.toDataURL('image/jpeg', 0.7),
                    rotation: 0
                });
                
                // Update progress occasionally
                if (i % 5 === 0 || i === pdf.numPages) {
                    setPages([...loadedPages]);
                }
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
                    await api.logDocument(jwt, {
                        file_name: `Organized: ${file.name}`,
                        file_size: blob.size,
                        action: 'organize',
                        pages_count: pages.length
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
                        <a
                            href={downloadUrl}
                            download={`SignFlow_organized.pdf`}
                            className="flex-1 h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Download size={20} /> Télécharger le PDF
                        </a>
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
                <div className="w-full flex flex-col lg:flex-row gap-10 items-start max-w-7xl">
                    {/* Main Organizer Area */}
                    <div className="flex-1 bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl p-6 md:p-10 w-full min-h-[600px] relative">
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
                                onReorder={setPages}
                                onPageDelete={deletePage}
                                onPageRotate={rotatePage}
                            />
                        )}
                    </div>

                    {/* Controls Side Panel */}
                    <div className="w-full lg:w-[350px] space-y-6 sticky top-24">
                        <div className="p-8 bg-white dark:bg-[#0d1120] rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Modifications</h3>
                                <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-[32px] space-y-6">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pages finales</p>
                                        <p className="text-2xl font-black text-blue-600">{pages.length}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-tighter font-bold">
                                        Faites glisser les pages pour changer leur ordre, tournez-les ou supprimez-les si nécessaire.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleProcess}
                                disabled={pages.length === 0 || isProcessing}
                                className={cn(
                                    "w-full py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-2xl relative overflow-hidden",
                                    pages.length === 0
                                        ? "bg-slate-100 dark:bg-white/5 text-slate-300 cursor-not-allowed shadow-none"
                                        : "bg-blue-600 text-white shadow-blue-500/30 hover:scale-105 active:scale-95 hover:shadow-blue-500/50"
                                )}
                            >
                                <div className="flex items-center justify-center gap-4 transition-all duration-300">
                                    <div className="relative w-6 h-6 flex items-center justify-center">
                                        <div className={`absolute transition-all duration-300 transform ${isProcessing ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}`}>
                                            <Loader2 className="animate-spin" size={24} />
                                        </div>
                                        <div className={`absolute transition-all duration-300 transform ${!isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                            <RefreshCw size={24} strokeWidth={3} />
                                        </div>
                                    </div>
                                    <span>{isProcessing ? 'Application...' : 'Organiser le PDF'}</span>
                                </div>
                            </button>

                            <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col items-center gap-4 text-center">
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                                    <FileCheck size={12} className="text-green-500" /> Traitement 100% Client-Side
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizeTool;
