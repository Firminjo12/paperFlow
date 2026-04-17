import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
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

const SplitTool = () => {
    const { jwt } = useAuth();
    const [file, setFile] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [ranges, setRanges] = useState([{ id: 1, from: 1, to: 1 }]);
    const [activeTab, setActiveTab] = useState('range'); // 'range' or 'fixed'
    const [fixedSize, setFixedSize] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
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

                thumbs.push(canvas.toDataURL('image/jpeg', 0.7));
                
                if (i % 5 === 0 || i === pdf.numPages) {
                    setThumbnails([...thumbs]);
                }
            }
            setIsLoadingThumbnails(false);
        } catch (error) {
            console.error("Erreur miniatures :", error);
            setIsLoadingThumbnails(false);
        }
    };

    const generateHighResPreview = async (pageNum) => {
        if (!pdfDocRef.current) return;
        setIsLoadingHighRes(true);
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

            setHighResPreview(canvas.toDataURL('image/jpeg', 0.9));
            setIsLoadingHighRes(false);
        } catch (error) {
            console.error("Erreur high-res :", error);
            setIsLoadingHighRes(false);
        }
    };

    const openPreview = (pageNum) => {
        setPreviewPageNum(pageNum);
        setIsPreviewOpen(true);
        generateHighResPreview(pageNum);
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
                        zip.file(`SignFlow_range_${from}-${to}.pdf`, pdfBytes);
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
                    zip.file(`SignFlow_part_${Math.floor(i/fixedSize)+1}.pdf`, pdfBytes);
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `SignFlow_Split_${file.name.replace(".pdf", "")}.zip`;
            link.click();

            if (jwt) {
                try {
                    await api.logDocument(jwt, {
                        file_name: `Split: ${file.name}`,
                        file_size: content.size,
                        action: 'split',
                        pages_count: numPages
                    });
                } catch (err) {
                    console.error("Logging Error:", err);
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
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Le ZIP contenant vos PDF a été téléchargé avec succès.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-[#060912] space-y-12">
                <div className="text-center space-y-4 max-w-2xl">
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                        Diviser <br /> <span className="text-[#e52424]">votre PDF.</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tighter">
                        Extrayez des pages ou divisez un document volumineux en plusieurs fichiers PDF de haute qualité.
                    </p>
                </div>
                <div className="w-full max-w-md flex flex-col items-center gap-6">
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
        <div className="flex-1 flex h-full overflow-hidden bg-slate-100 dark:bg-[#060912]">
            {/* Left Panel: Preview */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-black">Aperçu du PDF</h2>
                            <span className="px-3 py-1 bg-white/50 dark:bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {numPages} pages
                            </span>
                        </div>
                        <button onClick={reset} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-2">
                            <X size={14} /> Annuler
                        </button>
                    </div>

                    {isLoadingThumbnails ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
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
                        />
                    )}
                </div>
            </div>

            {/* Right Panel: Options */}
            <div className="w-[400px] bg-white dark:bg-[#0d1120] border-l border-slate-200 dark:border-white/5 flex flex-col shadow-2xl z-50">
                <div className="flex border-b border-slate-100 dark:border-white/5">
                    <button
                        onClick={() => setActiveTab('range')}
                        className={cn(
                            "flex-1 py-6 text-[11px] font-black uppercase tracking-widest transition-all relative group",
                            activeTab === 'range' ? "text-[#e52424] bg-red-50/50 dark:bg-red-500/5" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Layers size={18} />
                            Intervalle
                        </div>
                        {activeTab === 'range' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#e52424]" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('fixed')}
                        className={cn(
                            "flex-1 py-6 text-[11px] font-black uppercase tracking-widest transition-all relative group",
                            activeTab === 'fixed' ? "text-[#e52424] bg-red-50/50 dark:bg-red-500/5" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <LayoutGrid size={18} />
                            Fixe
                        </div>
                        {activeTab === 'fixed' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#e52424]" />}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase font-black">
                        Options de <br /> division
                    </h3>

                    {activeTab === 'range' ? (
                        <div className="space-y-6">
                            {ranges.map((range, idx) => (
                                <motion.div
                                    key={range.id}
                                    className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 space-y-6 relative group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#e52424]">Intervalle {idx + 1}</span>
                                        {ranges.length > 1 && (
                                            <button onClick={() => removeRange(range.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">De</label>
                                            <input
                                                type="number"
                                                value={range.from}
                                                onChange={(e) => updateRange(range.id, 'from', e.target.value)}
                                                className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">À</label>
                                            <input
                                                type="number"
                                                value={range.to}
                                                onChange={(e) => updateRange(range.id, 'to', e.target.value)}
                                                className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            <button onClick={addRange} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:border-blue-500/50 transition-all flex items-center justify-center gap-2">
                                <Plus size={16} /> Ajouter un intervalle
                            </button>
                        </div>
                    ) : (
                        <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[32px] border border-slate-100 dark:border-white/5 space-y-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pages par PDF</label>
                            <input
                                type="number"
                                value={fixedSize}
                                onChange={(e) => setFixedSize(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl px-4 text-2xl font-black outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="p-10">
                    <button
                        onClick={handleSplit}
                        disabled={isProcessing}
                        className="w-full h-20 bg-[#e52424] text-white rounded-[32px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                        <span className="flex items-center justify-center gap-4 relative min-h-[24px]">
                            <span className={`flex items-center gap-4 transition-all duration-300 ${isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute'}`}>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Traitement...</span>
                            </span>
                            <span className={`flex items-center gap-4 transition-all duration-300 ${!isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute'}`}>
                                <DownloadCloud size={20} />
                                <span>Diviser PDF</span>
                            </span>
                        </span>
                    </button>
                </div>
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
