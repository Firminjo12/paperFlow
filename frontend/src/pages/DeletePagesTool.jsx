import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trash2, 
    FileUp, 
    CheckCircle2, 
    Download, 
    FileText, 
    Loader2, 
    History,
    ArrowRight,
    X,
    FileCheck
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import FileDropzone, { cn } from '../components/FileDropzone';
import { pdfjs as pdfjsLib } from 'react-pdf';
import PageSlider from '../components/PageSlider';

const DeletePagesTool = () => {
    const [file, setFile] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [thumbnails, setThumbnails] = useState([]);
    const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
    const [selectedPages, setSelectedPages] = useState(new Set());
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

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            loadPdf(selectedFile);
        }
    };

    const loadPdf = async (selectedFile) => {
        setFile(selectedFile);
        setIsSuccess(false);
        setSelectedPages(new Set());
        setThumbnails([]);
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

            const thumbs = [];
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

                thumbs.push({
                    page: i,
                    url: canvas.toDataURL('image/jpeg', 0.7)
                });
                
                // Update progress occasionally
                if (i % 5 === 0 || i === pdf.numPages) {
                    setThumbnails([...thumbs]);
                }
            }
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

    const handleProcess = async () => {
        if (!file || selectedPages.size === 0 || selectedPages.size === numPages) return;

        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            
            // Create a new PDF and copy pages NOT selected for deletion
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
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            // Log action to DB
            if (jwt) {
                try {
                    await api.logDocument(jwt, {
                        file_name: `DelPages: ${file.name}`,
                        file_size: blob.size,
                        action: 'delete-pages',
                        pages_count: indicesToKeep.length
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
            console.error("Erreur suppression pages :", error);
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
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">Pages supprimées !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg uppercase tracking-tight">Votre document est prêt avec les pages restantes.</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-black/20 rounded-[32px] p-8 space-y-6">
                        <div className="flex items-center justify-center gap-8">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pages d'origines</p>
                                <p className="text-3xl font-black text-slate-400">{numPages}</p>
                            </div>
                            <ArrowRight className="text-slate-300" size={32} />
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Pages finales</p>
                                <p className="text-3xl font-black text-blue-600">{numPages - selectedPages.size}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <a
                            href={downloadUrl}
                            download={`SignFlow_Deleted_Pages_${file.name}`}
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
                    Supprimer des <br />
                    <span className="text-[#e52424]">Pages du PDF.</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium tracking-tighter uppercase">
                    Sélectionnez les pages inutiles et générez un nouveau document en un clic. 100% sécurisé et local.
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
                <div className="w-full flex flex-col lg:flex-row gap-10 items-start">
                    {/* Preview Area */}
                    <div className="flex-1 bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl p-6 md:p-10 w-full min-h-[600px] relative">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <FileText size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md">{file.name}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{numPages} pages totales</p>
                                </div>
                            </div>
                            <button onClick={reset} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {isLoadingThumbnails && thumbnails.length === 0 ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                                <Loader2 className="animate-spin text-blue-600" size={48} />
                                <p className="font-black uppercase tracking-widest text-slate-400 animate-pulse text-xs">Analyse du document...</p>
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
                            />
                        )}
                    </div>

                    {/* Controls Side Panel */}
                    <div className="w-full lg:w-[350px] space-y-6 sticky top-24">
                        <div className="p-8 bg-white dark:bg-[#0d1120] rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Récapitulatif</h3>
                                <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-[32px] space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Pages à supprimer</p>
                                            <p className={`text-4xl font-black ${selectedPages.size > 0 ? 'text-[#e52424]' : 'text-slate-300'}`}>
                                                {selectedPages.size}
                                            </p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Total pages</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">{numPages}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rendu final</span>
                                            <span className="text-sm font-black text-blue-600">{numPages - selectedPages.size} pages restantes</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleProcess}
                                disabled={selectedPages.size === 0 || isProcessing || selectedPages.size === numPages}
                                className={cn(
                                    "w-full py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-2xl relative overflow-hidden",
                                    selectedPages.size === 0 || selectedPages.size === numPages
                                        ? "bg-slate-100 dark:bg-white/5 text-slate-300 cursor-not-allowed shadow-none"
                                        : "bg-[#e52424] text-white shadow-red-500/30 hover:scale-105 active:scale-95 hover:shadow-red-500/50"
                                )}
                            >
                                <div className="flex items-center justify-center gap-4 transition-all duration-300">
                                    <div className="relative w-6 h-6 flex items-center justify-center">
                                        <div className={`absolute transition-all duration-300 transform ${isProcessing ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}`}>
                                            <Loader2 className="animate-spin" size={24} />
                                        </div>
                                        <div className={`absolute transition-all duration-300 transform ${!isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                            <Trash2 size={24} strokeWidth={3} />
                                        </div>
                                    </div>
                                    <span>{isProcessing ? 'Traitement...' : 'Générer mon PDF'}</span>
                                </div>
                            </button>

                            {selectedPages.size === numPages && (
                                <p className="text-[10px] font-bold text-[#e52424] text-center uppercase tracking-widest">
                                    Vous ne pouvez pas supprimer <br /> toutes les pages.
                                </p>
                            )}

                            <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col items-center gap-4">
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                                    <FileCheck size={12} className="text-green-500" /> Confidentiel & Local
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeletePagesTool;
