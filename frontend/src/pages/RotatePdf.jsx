import React, { useState, useRef, useEffect } from 'react';
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
    const { jwt } = useAuth();
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
            wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/wasm//`,
            verbosity: 0
        });
        const pdf = await loadingTask.promise;

        for (let i = 0; i < pageCount; i++) {
            const pdfjsPage = await pdf.getPage(i + 1);
            const viewport = pdfjsPage.getViewport({ scale: 0.3 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await pdfjsPage.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const url = canvas.toDataURL('image/jpeg', 0.7);

            newPages.push({
                id: `${fileId}-${i}`,
                fileId,
                fileName: file.name,
                fileData: file,
                pageIndex: i,
                rotation: 0, 
                baseRotation: pdfDoc.getPage(i).getRotation().angle,
                selected: false,
                url // Provide the thumbnail URL for PageSlider
            });
        }
        return newPages;
    };

    const addFiles = async (newFiles) => {
        const pdfFiles = newFiles.filter(file => file.type === 'application/pdf');
        
        for (const file of pdfFiles) {
            const fileId = Math.random().toString(36).substr(2, 9);
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            
            const newPages = await generateThumbnails(pdfDoc, fileId, file);
            
            setFiles(prev => [...prev, { id: fileId, file, name: file.name }]);
            setPdfPages(prev => [...prev, ...newPages]);
        }
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
                        file_name: "SignFlow_rotated.pdf",
                        file_size: blob.size,
                        action: 'rotate',
                        pages_count: mergedPdfDoc.getPageCount()
                    });
                } catch (e) {
                    console.error("Logging error:", e);
                }
            }

            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `SignFlow_Rotation.pdf`;
            link.click();
            
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
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Votre document a été pivoté et téléchargé.</p>
                    </div>

                    <div className="flex flex-col gap-4 pt-4">
                        <button
                            onClick={() => {
                                setFiles([]);
                                setPdfPages([]);
                                setCompleted(false);
                            }}
                            className="w-full h-14 bg-red-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-3"
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
        <div className="flex-1 flex flex-col h-full overflow-hidden font-sans">
            <div className="flex-1 flex flex-col items-center justify-center relative p-4 md:p-8 bg-slate-50 dark:bg-[#060912]">
                {pdfPages.length === 0 ? (
                    <div className="text-center space-y-12 max-w-2xl px-4 animate-in fade-in duration-500">
                        <div className="space-y-6">
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
                                Faire pivoter <br />
                                <span className="text-red-600 underline underline-offset-8 decoration-red-600/20">vos PDF.</span>
                            </h1>
                        </div>

                        <FileDropzone 
                            onFileSelect={(selectedFiles) => {
                                const filesArray = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];
                                addFiles(filesArray);
                            }}
                            selectedFile={pdfPages.length > 0 ? pdfPages : null}
                            multiple={true}
                            label="Sélectionner les fichiers PDF"
                            description="Redressez vos documents facilement."
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-8 py-10 relative group/slider">
                        <header className="absolute top-0 left-0 right-0 z-40 bg-slate-50/50 dark:bg-[#060912]/50 backdrop-blur-md px-10 py-6 flex justify-between items-center w-full">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Aperçu Slider</h1>
                            
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setPdfPages(prev => prev.map(p => ({ ...p, selected: true })))}
                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                                >
                                    Sélectionner tout
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
                                >
                                    <FilePlus size={14} /> Ajouter PDF
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="application/pdf" className="hidden" />
                            </div>
                        </header>

                        <PageSlider 
                            pages={pdfPages.map(p => ({
                                ...p,
                                isSelected: p.selected
                            }))}
                            mode="rotate"
                            onPageSelect={togglePageSelection}
                            onPageRotate={(id) => rotatePage(id, 'right')}
                            onPageDelete={(id) => setPdfPages(prev => prev.filter(p => p.id !== id))}
                        />
                    </div>
                )}
            </div>

            {/* Float Bottom Controls - Mobile Friendly */}
            {pdfPages.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] p-6 pointer-events-none">
                    <div className="max-w-xl mx-auto flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
                        <button
                            onClick={() => rotateAll('right')}
                            className="flex-1 h-16 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20"
                        >
                            <RotateCw size={18} /> Pivoter tout
                        </button>
                        
                        <button
                            onClick={handleRotatePdf}
                            disabled={processing}
                            className={cn(
                                "flex-1 h-16 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-3 relative overflow-hidden",
                                processing && "opacity-80 scale-95"
                            )}
                        >
                            <div className="flex items-center justify-center gap-4 transition-all duration-300">
                                <div className="relative w-5 h-5 flex items-center justify-center">
                                    <div className={`absolute transition-all duration-300 transform ${processing ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}`}>
                                        <Loader2 className="animate-spin" size={20} />
                                    </div>
                                    <div className={`absolute transition-all duration-300 transform ${!processing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                                <span>{processing ? 'Chargement...' : 'Télécharger PDF'}</span>
                            </div>
                        </button>
                        
                        <button 
                            onClick={resetAll}
                            className="w-16 h-16 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 rounded-2xl transition-all flex items-center justify-center"
                            title="Reset"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
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
