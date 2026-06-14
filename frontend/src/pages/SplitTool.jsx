import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import api from '../services/api';
import PageSlider from '../components/PageSlider';
import {
    Scissors,
    FileUp,
    Download,
    Plus,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCircle2,
    FileType,
    LayoutGrid,
    Layers,
    Type,
    Zap,
    DownloadCloud,
    Maximize2,
    Info,
    RotateCcw
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { pdfjs as pdfjsLib } from 'react-pdf';
import FileDropzone, { cn } from '../components/FileDropzone';
import { uploadToStorage } from '../utils/storage';
import SEO from '../components/SEO';

const SplitTool = () => {
    const { jwt, user } = useAuth();
    const { triggerFeedback } = useFeedback();
    const [file, setFile] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [ranges, setRanges] = useState([{ id: 1, from: 1, to: 1 }]);
    const [activeTab, setActiveTab] = useState('range'); // 'range' or 'fixed'
    const [fixedSize, setFixedSize] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [finalZipUrl, setFinalZipUrl] = useState(null);
    const [finalZipName, setFinalZipName] = useState("");
    const [thumbnails, setThumbnails] = useState([]);
    const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
    
    // Preview States
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewPageNum, setPreviewPageNum] = useState(1);
    const [highResPreview, setHighResPreview] = useState(null);

    const [isLoadingHighRes, setIsLoadingHighRes] = useState(false);
    
    const fileInputRef = useRef(null);
    const pdfDocRef = useRef(null);

    const generateThumbnails = async (pdfFile) => {
        setIsLoadingThumbnails(true);
        setThumbnails([]);
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ 
                data: arrayBuffer,
                wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/wasm/`,
                verbosity: 0 
            });
            const pdf = await loadingTask.promise;
            pdfDocRef.current = pdf;
            setNumPages(pdf.numPages);
            setRanges([{ id: 1, from: 1, to: pdf.numPages }]);

            const thumbs = [];
            const BATCH_SIZE = 4;
            
            for (let i = 1; i <= pdf.numPages; i += BATCH_SIZE) {
                const batchPromises = [];
                const end = Math.min(i + BATCH_SIZE - 1, pdf.numPages);
                
                for (let j = i; j <= end; j++) {
                    batchPromises.push((async (pageNum) => {
                        const page = await pdf.getPage(pageNum);
                        const viewport = page.getViewport({ scale: 0.25 }); // Scale réduit pour plus de rapidité
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d', { alpha: false });
                        
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        
                        await page.render({
                            canvasContext: context,
                            viewport: viewport
                        }).promise;
                        
                        const url = canvas.toDataURL('image/jpeg', 0.6); // Compression JPEG
                        
                        // Nettoyage mémoire immédiat
                        canvas.width = 0;
                        canvas.height = 0;
                        
                        return url;
                    })(j));
                }
                
                const batchResults = await Promise.all(batchPromises);
                thumbs.push(...batchResults);
                
                // Mise à jour de l'UI moins fréquente pour éviter les re-renders excessifs
                setThumbnails([...thumbs]);
            }
            setIsLoadingThumbnails(false);
        } catch (error) {
            console.error("Erreur miniatures :", error);
            setIsLoadingThumbnails(false);
        }
    };

    const handleHighResPreview = async (id) => {
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
        } catch (error) {
            console.error("Erreur high-res :", error);
            return null;
        }
    };

    const openPreview = async (pageNum) => {
        setPreviewPageNum(pageNum);
        setIsPreviewOpen(true);
        setIsLoadingHighRes(true);
        const url = await handleHighResPreview(`p-${pageNum}`);
        setHighResPreview(url);
        setIsLoadingHighRes(false);
    };

    const addRange = () => {
        const lastTo = ranges[ranges.length - 1].to;
        const nextFrom = Math.min(lastTo + 1, numPages);
        const nextTo = Math.min(nextFrom + 5, numPages);
        
        setRanges(prev => [
            ...prev,
            { id: prev.length + 1, from: nextFrom, to: nextTo }
        ]);
    };

    const removeRange = (id) => {
        if (ranges.length > 1) {
            setRanges(prev => prev.filter(r => r.id !== id).map((r, i) => ({ ...r, id: i + 1 })));
        }
    };

    const updateRange = (id, field, value) => {
        const numValue = Math.max(1, Math.min(numPages, parseInt(value) || 1));
        setRanges(prev => prev.map(r => 
            r.id === id ? { ...r, [field]: numValue } : r
        ));
    };

    const handleSplit = async () => {
        if (!file || numPages === 0) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const zip = new JSZip();

            if (activeTab === 'range') {
                for (const range of ranges) {
                    const from = Math.min(parseInt(range.from), parseInt(range.to));
                    const to = Math.max(parseInt(range.from), parseInt(range.to));
                    
                    const newPdf = await PDFDocument.create();
                    const indices = [];
                    for (let i = from - 1; i < to; i++) {
                        if (i >= 0 && i < sourceDoc.getPageCount()) {
                            indices.push(i);
                        }
                    }
                    
                    if (indices.length > 0) {
                        const copiedPages = await newPdf.copyPages(sourceDoc, indices);
                        copiedPages.forEach(p => newPdf.addPage(p));
                        
                        const pdfBytes = await newPdf.save();
                        zip.file(`paperFlow_range_${from}-${to}.pdf`, pdfBytes);
                    }
                }
            } else {
                const totalPages = sourceDoc.getPageCount();
                for (let i = 0; i < totalPages; i += fixedSize) {
                    const newPdf = await PDFDocument.create();
                    const indices = [];
                    for (let j = i; j < Math.min(i + fixedSize, totalPages); j++) {
                        indices.push(j);
                    }
                    
                    const copiedPages = await newPdf.copyPages(sourceDoc, indices);
                    copiedPages.forEach(p => newPdf.addPage(p));
                    
                    const pdfBytes = await newPdf.save();
                    zip.file(`paperFlow_part_${Math.floor(i/fixedSize)+1}.pdf`, pdfBytes);
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const zipName = `paperFlow_Split_${file.name.replace(".pdf", "")}.zip`;
            
            setFinalZipUrl(url);
            setFinalZipName(zipName);

            if (jwt) {
                try {
                    const userId = user?.id || user?._id || 'anonymous';
                    const downloadURL = await uploadToStorage(content, userId, 'split');

                    await api.logDocument(jwt, {
                        file_name: `Split: ${file.name}`,
                        file_size: content.size,
                        action: 'split',
                        pages_count: numPages,
                        file_url: downloadURL // Sera null si l'upload échoue, mais le log sera créé
                    });
                } catch (err) {
                    console.error("Logging Error:", err);
                    // On tente un log sans URL si storage a crash
                    try {
                        await api.logDocument(jwt, {
                            file_name: `Split: ${file.name}`,
                            file_size: content.size,
                            action: 'split',
                            pages_count: numPages,
                            file_url: null
                        });
                    } catch (finalErr) {
                        console.error("Final Logging Error:", finalErr);
                    }
                }
            }

            setTimeout(() => {
                setIsSuccess(true);
                setIsProcessing(false);
            }, 1000);
        } catch (error) {
            console.error("Erreur split :", error);
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setNumPages(0);
        setRanges([{ id: 1, from: 1, to: 1 }]);
        setIsSuccess(false);
        setThumbnails([]);
        pdfDocRef.current = null;
        setIsPreviewOpen(false);
        setHighResPreview(null);
    };

    if (isSuccess) {
        const handleFinalDownload = () => {
            const link = document.createElement('a');
            link.href = finalZipUrl;
            link.download = finalZipName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            triggerFeedback();
        };

        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-[#f3f0f1] dark:bg-[#060912]">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl w-full bg-white dark:bg-[#0d1120] rounded-[64px] border border-slate-100 dark:border-white/5 shadow-2xl p-16 space-y-12 text-center"
                >
                    <div className="w-24 h-24 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto scale-110">
                        <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Fichiers Prêts !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Le ZIP contenant vos PDF est prêt à être téléchargé.</p>
                    </div>



                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleFinalDownload}
                            className="h-16 col-span-2 bg-[#e52424] text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Download size={18} /> Télécharger ZIP
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="h-16 bg-blue-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                        >
                            <Plus size={18} /> Autre PDF
                        </button>
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="h-16 bg-slate-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                        >
                            Tableau de bord
                        </button>
                    </div>
                </motion.div>


            </div>
        );
    }

    if (!file) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-slate-50 dark:bg-[#060912] space-y-12 min-h-screen">
                <SEO 
                    title="Diviser PDF"
                    description="Séparez un fichier PDF en plusieurs documents. Extrayez des pages spécifiques ou divisez par intervalles de pages facilement et gratuitement."
                    keywords="diviser pdf, séparer pdf, extraire pages pdf, découper pdf"
                />
                <div className="text-center space-y-4 max-w-2xl px-4">
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none"
                    >
                        Diviser <br /> <span className="text-red-600">votre PDF.</span>
                    </motion.h1>
                    <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tighter">
                        Extrayez des pages ou divisez un document volumineux en plusieurs fichiers PDF de haute qualité.
                    </p>
                </div>
                <div className="w-full max-w-md flex flex-col items-center gap-6 px-4">
                    <FileDropzone 
                        onFileSelect={(selectedFile) => {
                            if (selectedFile && selectedFile.type === 'application/pdf') {
                                setFile(selectedFile);
                                setIsSuccess(false);
                                generateThumbnails(selectedFile);
                            }
                        }}
                        selectedFile={file}
                        label="Choisir le fichier"
                        description="ou déposez le PDF ici"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060912] flex flex-col lg:flex-row relative">
            <SEO 
                title="Diviser PDF"
                description="Séparez un fichier PDF en plusieurs documents. Extrayez des pages spécifiques ou divisez par intervalles de pages facilement et gratuitement."
                keywords="diviser pdf, séparer pdf, extraire pages pdf, découper pdf"
            />
            {/* Left Side: Preview Area */}
            <div className="flex-1 overflow-y-auto pb-60 lg:pb-0">
                <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10">
                    <div className="bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl p-6 md:p-10 w-full min-h-[500px] relative transition-all">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center">
                                    <Scissors size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md uppercase tracking-tight italic">
                                        {file.name}
                                    </h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                                        {numPages} Pages • {activeTab === 'range' ? 'Par intervalles' : 'Taille fixe'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={reset} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        {isLoadingThumbnails ? (
                            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Génération des miniatures...</p>
                            </div>
                        ) : (
                            <PageSlider 
                                pages={thumbnails.map((url, i) => {
                                    const pageNum = i + 1;
                                    const range = ranges.find(r => pageNum >= r.from && pageNum <= r.to);
                                    return {
                                        id: `p-${pageNum}`,
                                        url,
                                        intervalId: activeTab === 'range' ? (range ? range.id : null) : (Math.floor(i / fixedSize) + 1),
                                        originalIndex: i
                                    };
                                })}
                                mode="split"
                                onPageSelect={(id) => openPreview(parseInt(id.split('-')[1]))}
                                onPreview={handleHighResPreview}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side: Options Panel */}
            <div className="w-full lg:w-[420px] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 backdrop-blur-xl flex flex-col pb-80 lg:pb-40">
                <div className="flex border-b border-slate-100 dark:border-white/5 sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <button
                        onClick={() => setActiveTab('range')}
                        className={cn(
                            "flex-1 py-8 text-[11px] font-black uppercase tracking-widest transition-all relative group",
                            activeTab === 'range' ? "text-red-600 bg-red-50/50 dark:bg-red-500/5" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Intervalle
                        {activeTab === 'range' && <motion.div layoutId="split-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('fixed')}
                        className={cn(
                            "flex-1 py-8 text-[11px] font-black uppercase tracking-widest transition-all relative group",
                            activeTab === 'fixed' ? "text-red-600 bg-red-50/50 dark:bg-red-500/5" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Fixe
                        {activeTab === 'fixed' && <motion.div layoutId="split-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" />}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10">
                    <div className="space-y-4">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none italic">
                            Options de <br /> Division
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configurez le fractionnement</p>
                    </div>

                    {activeTab === 'range' ? (
                        <div className="space-y-6">
                            {ranges.map((range, idx) => (
                                <motion.div
                                    key={range.id}
                                    layout
                                    className="p-6 bg-slate-50 dark:bg-white/5 rounded-[40px] border border-slate-100 dark:border-white/5 space-y-6 relative group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Intervalle {idx + 1}</span>
                                        {ranges.length > 1 && (
                                            <button onClick={() => removeRange(range.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">De la page</label>
                                            <input
                                                type="number"
                                                value={range.from}
                                                onChange={(e) => updateRange(range.id, 'from', e.target.value)}
                                                className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-red-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">À la page</label>
                                            <input
                                                type="number"
                                                value={range.to}
                                                onChange={(e) => updateRange(range.id, 'to', e.target.value)}
                                                className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-red-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            <button onClick={addRange} className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[40px] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:border-red-500/50 transition-all flex items-center justify-center gap-2">
                                <Plus size={16} strokeWidth={3} /> Ajouter un intervalle
                            </button>
                        </div>
                    ) : (
                        <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[48px] border border-slate-100 dark:border-white/5 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pages par document PDF</label>
                                <input
                                    type="number"
                                    value={fixedSize}
                                    onChange={(e) => setFixedSize(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[32px] px-8 text-4xl font-black outline-none focus:ring-4 focus:ring-red-500/10 text-red-600"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-widest font-black opacity-60">
                                Un PDF de {numPages} pages sera divisé en {Math.ceil(numPages / fixedSize)} documents.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Action Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-8 pointer-events-none">
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="max-w-5xl mx-auto bg-slate-900/90 dark:bg-black/90 backdrop-blur-2xl px-6 md:px-10 py-5 md:py-6 rounded-[32px] md:rounded-[40px] border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-auto"
                >
                    <div className="flex items-center gap-6 md:gap-10 text-white">
                        <div className="flex flex-col">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 italic">Nouveaux fichiers</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl md:text-4xl font-black text-red-500 italic">
                                    {activeTab === 'range' ? ranges.length : Math.ceil(numPages / fixedSize)}
                                </span>
                                <span className="text-xs font-black opacity-40 uppercase tracking-widest italic">Documents</span>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div className="flex flex-col">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 italic">Total source</p>
                            <span className="text-xl md:text-2xl font-black italic">{numPages} pages</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSplit}
                        disabled={isProcessing}
                        className={cn(
                            "w-full md:w-auto h-16 md:h-20 px-8 md:px-12 rounded-[24px] md:rounded-[32px] font-black text-xs md:text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-xl",
                            "bg-red-600 text-white hover:scale-[1.02] active:scale-95 shadow-red-500/20"
                        )}
                    >
                        {isProcessing ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <DownloadCloud size={24} strokeWidth={3} />
                        )}
                        <span>{isProcessing ? 'Traitement...' : 'Diviser PDF'}</span>
                    </button>
                </motion.div>
            </div>

            {/* Modal Preview */}
            <AnimatePresence>
                {isPreviewOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8"
                        onClick={() => setIsPreviewOpen(false)}
                    >
                        <button className="absolute top-8 right-8 text-white/50 hover:text-white p-4">
                            <X size={48} />
                        </button>
                        {isLoadingHighRes ? <Loader2 className="animate-spin text-white" size={48} /> : (
                            <img src={highResPreview} className="max-h-full rounded-xl shadow-2xl" alt="Preview" />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SplitTool;
