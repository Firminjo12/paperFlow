import React, { useState, useRef, useEffect } from 'react';
import { useFeedback } from '../contexts/FeedbackContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FilePlus,
    RotateCw,
    RotateCcw,
    Trash2,
    Download,
    CheckCircle2,
    Loader2,
    ArrowRight,
    Info,
    X,
    FileText,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import FileDropzone, { cn } from '../components/FileDropzone';
import PageSlider from '../components/PageSlider';
import { pdfjs as pdfjsLib } from 'react-pdf';

const RotatePdf = () => {
    const [files, setFiles] = useState([]);
    const [pdfPages, setPdfPages] = useState([]); // Array of { id, fileId, pageIndex, rotation, baseRotation, selected }
    const [processing, setProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [finalPdfUrl, setFinalPdfUrl] = useState(null);
    const { jwt } = useAuth();
    const { triggerFeedback } = useFeedback();
    const fileInputRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const navigate = useNavigate();

    const handleFileChange = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        await addFiles(selectedFiles);
    };

    const generateThumbnails = async (pdfDoc, fileId, file) => {
        const pageCount = pdfDoc.getPageCount();
        const newPages = [];
        const loadingTask = pdfjsLib.getDocument({ 
            data: await file.arrayBuffer(),
            wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/wasm/`,
            verbosity: 0
        });
        const pdf = await loadingTask.promise;

        const BATCH_SIZE = 4;
        for (let i = 0; i < pageCount; i += BATCH_SIZE) {
            const batchPromises = [];
            const end = Math.min(i + BATCH_SIZE, pageCount);
            
            for (let j = i; j < end; j++) {
                batchPromises.push((async (idx) => {
                    const pdfjsPage = await pdf.getPage(idx + 1);
                    const viewport = pdfjsPage.getViewport({ scale: 0.3 }); // Reduit
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d', { alpha: false });
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await pdfjsPage.render({
                        canvasContext: context,
                        viewport: viewport,
                        intent: 'display'
                    }).promise;

                    const url = canvas.toDataURL('image/jpeg', 0.6); // Compression

                    // Nettoyage
                    canvas.width = 0;
                    canvas.height = 0;

                    return {
                        id: `${fileId}-${idx}`,
                        fileId,
                        fileName: file.name,
                        fileData: file,
                        pageIndex: idx,
                        rotation: 0, 
                        baseRotation: pdfDoc.getPage(idx).getRotation().angle,
                        selected: false,
                        url
                    };
                })(j));
            }
            
            const results = await Promise.all(batchPromises);
            newPages.push(...results);
        }
        return newPages;
    };

    const addFiles = async (newFiles) => {
        const pdfFiles = newFiles.filter(file => file.type === 'application/pdf');
        
        // Parallélisation des fichiers
        const results = await Promise.all(pdfFiles.map(async (file) => {
            const fileId = Math.random().toString(36).substr(2, 9);
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const newPages = await generateThumbnails(pdfDoc, fileId, file);
            return {
                fileInfo: { id: fileId, file, name: file.name },
                pages: newPages
            };
        }));
        
        results.forEach(res => {
            setFiles(prev => [...prev, res.fileInfo]);
            setPdfPages(prev => [...prev, ...res.pages]);
        });
    };

    const togglePageSelection = (id) => {
        setPdfPages(prev => prev.map(p => 
            p.id === id ? { ...p, selected: !p.selected } : p
        ));
    };

    const rotateAll = (angle) => {
        const hasSelection = pdfPages.some(p => p.selected);
        setPdfPages(prev => prev.map(page => {
            if (hasSelection && !page.selected) return page;
            
            let newRotation;
            if (angle === 'left') newRotation = (page.rotation - 90 + 360) % 360;
            else if (angle === 'right') newRotation = (page.rotation + 90) % 360;
            else if (angle === 180) newRotation = (page.rotation + 180) % 360;
            else newRotation = page.rotation;

            return { ...page, rotation: newRotation };
        }));
    };

    const rotatePage = (id, direction) => {
        setPdfPages(prev => prev.map(page => 
            page.id === id 
                ? { ...page, rotation: (page.rotation + (direction === 'right' ? 90 : -90) + 360) % 360 }
                : page
        ));
    };

    const resetAll = () => {
        setPdfPages(prev => prev.map(page => ({ ...page, rotation: 0, selected: false })));
    };

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
            scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    const generateHighResPreview = async (id) => {
        const page = pdfPages.find(p => p.id === id);
        if (!page) return null;

        try {
            const arrayBuffer = await page.fileData.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ 
                data: arrayBuffer,
                verbosity: 0 
            });
            const pdf = await loadingTask.promise;
            const pdfPage = await pdf.getPage(page.pageIndex + 1);
            
            const viewport = pdfPage.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await pdfPage.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            return canvas.toDataURL('image/jpeg', 0.9);
        } catch (err) {
            console.error("High-res error:", err);
            return page.url;
        }
    };

    const handleRotatePdf = async () => {
        if (pdfPages.length === 0) return;
        setProcessing(true);
        try {
            const mergedPdfDoc = await PDFDocument.create();

            for (const fileObj of files) {
                const arrayBuffer = await fileObj.file.arrayBuffer();
                const sourcePdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                const pagesForThisFile = pdfPages.filter(p => p.fileId === fileObj.id);
                
                const indicesToCopy = pagesForThisFile
                    .sort((a, b) => a.pageIndex - b.pageIndex)
                    .map(p => p.pageIndex);
                
                if (indicesToCopy.length === 0) continue;

                const copiedPages = await mergedPdfDoc.copyPages(sourcePdfDoc, indicesToCopy);
                
                copiedPages.forEach((page, idx) => {
                    const pageData = pagesForThisFile[idx];
                    const finalRotation = (pageData.baseRotation + pageData.rotation) % 360;
                    page.setRotation(degrees(finalRotation));
                    mergedPdfDoc.addPage(page);
                });
            }

            const pdfBytes = await mergedPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            // Log action if user is logged in
            if (jwt) {
                try {
                    await api.logDocument(jwt, {
                        file_name: "paperFlow_rotated.pdf",
                        file_size: blob.size,
                        action: 'rotate',
                        pages_count: mergedPdfDoc.getPageCount()
                    });
                } catch (e) {
                    console.error("Logging error:", e);
                }
            }

            const url = URL.createObjectURL(blob);
            setFinalPdfUrl(url);
            
            setCompleted(true);
        } catch (error) {
            console.error("Error during rotation process:", error);
        } finally {
            setProcessing(false);
        }
    };

    if (completed) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50 dark:bg-black/20 font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-8 p-10 bg-white dark:bg-[#0d1120] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl"
                >
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Opération réussie !</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Votre document pivoté est prêt à être téléchargé.</p>
                    </div>

                    <div className="flex flex-col gap-4 pt-4">
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = finalPdfUrl;
                                link.download = `paperFlow_Rotation.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                triggerFeedback();
                            }}
                            className="w-full h-14 bg-red-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-500/20 hover:shadow-red-500/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Download size={18} /> Télécharger
                        </button>
                        <button
                            onClick={() => {
                                setFiles([]);
                                setPdfPages([]);
                                setCompleted(false);
                            }}
                            className="w-full h-14 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            <FilePlus size={18} /> Recommencer
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const hasSelection = pdfPages.some(p => p.selected);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060912] flex flex-col relative">
            {/* Main Preview Area */}
            <div className="flex-1 overflow-y-auto pb-60 lg:pb-40">
                <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10">
                    {pdfPages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-center space-y-4 max-w-2xl px-4"
                            >
                                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                                    Faire pivoter <br /> <span className="text-red-600">vos PDF.</span>
                                </h1>
                                <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tighter">
                                    Redressez vos documents facilement. Sélectionnez des pages spécifiques ou faites pivoter tout le fichier.
                                </p>
                            </motion.div>

                            <div className="w-full max-w-md px-4">
                                <FileDropzone 
                                    onFileSelect={(selectedFiles) => {
                                        const filesArray = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];
                                        addFiles(filesArray);
                                    }}
                                    selectedFile={pdfPages.length > 0 ? pdfPages : null}
                                    multiple={true}
                                    label="Sélectionner les PDF"
                                    description="Déposez vos fichiers ici"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-200 dark:border-white/5 shadow-2xl p-6 md:p-10 transition-all relative">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-white/5 gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center">
                                        <RotateCw size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                            {pdfPages.length > 0 ? (files.length > 1 ? `${files.length} fichiers` : files[0].name) : ''}
                                        </h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                                            {pdfPages.length} Pages • {pdfPages.filter(p => p.selected).length} sélectionnées
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setPdfPages(prev => prev.map(p => ({ ...p, selected: true })))}
                                        className="h-12 px-6 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-red-500 transition-all"
                                    >
                                        Tout sélectionner
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-12 px-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                                    >
                                        <FilePlus size={14} /> Ajouter
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="application/pdf" className="hidden" />
                                    <button onClick={() => { setFiles([]); setPdfPages([]); }} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <PageSlider 
                                pages={pdfPages.map(p => ({
                                    ...p,
                                    isSelected: p.selected
                                }))}
                                mode="rotate"
                                onPageSelect={togglePageSelection}
                                onPageRotate={(id) => rotatePage(id, 'right')}
                                onPageDelete={(id) => setPdfPages(prev => prev.filter(p => p.id !== id))}
                                onPreview={generateHighResPreview}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Bar */}
            {pdfPages.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-8 pointer-events-none">
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="max-w-5xl mx-auto bg-slate-900/95 dark:bg-black/90 backdrop-blur-2xl px-6 md:px-10 py-5 md:py-6 rounded-[32px] md:rounded-[40px] border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-auto"
                    >
                        <div className="flex items-center gap-6 md:gap-10 text-white">
                            <div className="flex flex-col">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 italic">Action de rotation</p>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => rotateAll('left')}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                                        title="Pivoter à gauche"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                    <button 
                                        onClick={() => rotateAll('right')}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                                        title="Pivoter à droite"
                                    >
                                        <RotateCw size={18} />
                                    </button>
                                    <button 
                                        onClick={resetAll}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-red-400"
                                        title="Réinitialiser"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="flex flex-col">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 italic">Cible</p>
                                <span className="text-xl md:text-2xl font-black italic">
                                    {pdfPages.some(p => p.selected) ? `${pdfPages.filter(p => p.selected).length} sélectionnée(s)` : 'Toutes les pages'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleRotatePdf}
                            disabled={processing}
                            className={cn(
                                "w-full md:w-auto h-16 md:h-20 px-8 md:px-12 rounded-[24px] md:rounded-[32px] font-black text-xs md:text-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 relative overflow-hidden shadow-xl",
                                "bg-red-600 text-white hover:scale-[1.02] active:scale-95 shadow-red-500/30"
                            )}
                        >
                            {processing ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <Download size={24} strokeWidth={3} />
                            )}
                            <span>{processing ? 'Traitement...' : 'Télécharger PDF'}</span>
                        </button>
                    </motion.div>
                </div>
            )}
                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
            </div>
    );
};

export default RotatePdf;
