import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
    ChevronLeft, 
    ChevronRight, 
    Maximize2, 
    X, 
    RotateCcw, 
    Trash2, 
    GripVertical,
    CheckCircle2,
    Scissors,
    Files,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { cn } from './FileDropzone';

const PageSlider = ({ 
    pages = [], 
    mode = 'view', 
    onPageSelect, 
    onPageDelete, 
    onPageRotate,
    onReorder,
    onPreview
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedPageForView, setSelectedPageForView] = useState(null);
    const scrollRef = useRef(null);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const scrollPosition = scrollRef.current.scrollLeft;
        const pageWidth = scrollRef.current.offsetWidth / getVisibleCount();
        const index = Math.round(scrollPosition / pageWidth);
        setCurrentIndex(index);
    };

    const getVisibleCount = () => {
        if (window.innerWidth >= 1280) return 5;
        if (window.innerWidth >= 768) return 3;
        return 1;
    };

    const scrollToIndex = (index) => {
        if (!scrollRef.current) return;
        const pageWidth = scrollRef.current.offsetWidth / getVisibleCount();
        scrollRef.current.scrollTo({
            left: index * pageWidth,
            behavior: 'smooth'
        });
    };

    const next = () => scrollToIndex(currentIndex + 1);
    const prev = () => scrollToIndex(currentIndex - 1);

    const renderOverlay = (page, index) => {
        switch (mode) {
            case 'split':
                return (
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                        <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                            <Scissors size={12} /> Intervalle {page.intervalId || 1}
                        </div>
                    </div>
                );
            case 'delete':
                return (
                    <>
                        <div 
                            className="absolute top-4 left-4 z-40"
                            onClick={(e) => { e.stopPropagation(); onPageSelect(page.id); }}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border-2",
                                page.isSelected 
                                    ? "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]" 
                                    : "bg-white/90 border-slate-200 text-slate-300 hover:border-red-400"
                            )}>
                                {page.isSelected ? <AlertCircle size={24} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                            </div>
                        </div>
                        {page.isSelected && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-red-600/10 backdrop-blur-[1px] pointer-events-none z-10"
                            />
                        )}
                    </>
                );
            case 'extract':
                return (
                    <>
                        <div 
                            className="absolute top-4 left-4 z-40"
                            onClick={(e) => { e.stopPropagation(); onPageSelect(page.id); }}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border-2",
                                page.isSelected 
                                    ? "bg-green-600 border-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]" 
                                    : "bg-white/90 border-slate-200 text-slate-300 hover:border-green-400"
                            )}>
                                {page.isSelected ? <CheckCircle2 size={24} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                            </div>
                        </div>
                        {page.isSelected && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-green-500/10 backdrop-blur-[1px] pointer-events-none z-10"
                            />
                        )}
                    </>
                );
            case 'organize':
                return (
                    <div className="absolute top-4 left-4 flex gap-2 z-20">
                        <div className="w-10 h-10 bg-white/90 dark:bg-slate-800/90 text-slate-400 rounded-2xl flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing hover:text-blue-600 transition-all border border-slate-100 dark:border-white/5">
                            <GripVertical size={20} />
                        </div>
                    </div>
                );
            case 'rotate':
                return (
                    <>
                        <div 
                            className="absolute top-4 left-4 z-40"
                            onClick={(e) => { e.stopPropagation(); onPageSelect(page.id); }}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border-2",
                                page.isSelected 
                                    ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                                    : "bg-white/90 border-slate-200 text-slate-300 hover:border-blue-400"
                            )}>
                                {page.isSelected ? <CheckCircle2 size={24} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center z-10 pointer-events-none">
                            <div className="bg-white dark:bg-slate-800 text-blue-600 p-4 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 pointer-events-auto">
                                <button onClick={(e) => { e.stopPropagation(); onPageRotate(page.id); }}>
                                    <RotateCcw size={28} />
                                </button>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    const renderControls = (page) => {
        if (mode === 'organize' || mode === 'rotate' || mode === 'delete') {
            return (
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-30">
                    {(mode === 'organize' || mode === 'rotate') && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onPageRotate(page.id); }}
                            className="w-10 h-10 bg-white dark:bg-slate-800 text-blue-600 rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all border border-slate-100 dark:border-white/5"
                        >
                            <RotateCcw size={18} />
                        </button>
                    )}
                    {(mode === 'organize' || mode === 'delete') && (
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (onPageDelete) {
                                    onPageDelete(page.id);
                                } else if (onPageSelect) {
                                    onPageSelect(page.id);
                                }
                            }}
                            className="w-8 h-8 bg-white dark:bg-slate-800 text-red-600 rounded-xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all border border-slate-100 dark:border-white/5"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            );
        }
        return null;
    };

    const ItemWrapper = ({ page, index, children }) => {
        if (mode === 'organize') {
            return (
                <Reorder.Item
                    value={page}
                    className="flex-shrink-0 w-full md:w-1/3 xl:w-[20%] px-4 snap-center relative group flex flex-col items-center"
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                >
                    {children}
                </Reorder.Item>
            );
        }
        return (
            <div className="flex-shrink-0 w-full md:w-1/3 xl:w-[20%] px-4 snap-center relative group flex flex-col items-center">
                {children}
            </div>
        );
    };

    const handlePreview = async (e, page) => {
        e.stopPropagation();
        if (onPreview) {
            setSelectedPageForView('loading');
            try {
                const highRes = await onPreview(page.id);
                setSelectedPageForView(highRes);
            } catch (err) {
                console.error("Preview error:", err);
                setSelectedPageForView(page.url);
            }
        } else {
            setSelectedPageForView(page.url);
        }
    };

    const ContentBody = (
        <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar py-10 px-4 scroll-smooth min-h-[380px]"
        >
            <AnimatePresence mode="popLayout">
                {pages.map((page, index) => (
                    <ItemWrapper key={page.id} page={page} index={index}>
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className={cn(
                                "relative h-[260px] w-full max-w-[200px] bg-white dark:bg-slate-800 rounded-[28px] overflow-hidden shadow-[0_20px_45px_rgba(0,0,0,0.12)] dark:shadow-none border-[3px] transition-all cursor-pointer group",
                                mode === 'delete' && page.isSelected 
                                    ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.3)] scale-[0.98]" 
                                    : mode === 'extract' && page.isSelected 
                                    ? "border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.3)]"
                                    : "border-transparent hover:border-blue-500/40 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] hover:-translate-y-1"
                            )}
                            onClick={() => onPreview ? handlePreview({ stopPropagation: () => {} }, page) : onPageSelect && onPageSelect(page.id)}
                        >
                            <img 
                                src={page.url} 
                                className={cn(
                                    "w-full h-full object-contain select-none pointer-events-none transition-transform duration-700 bg-slate-50 dark:bg-slate-900/50",
                                    mode === 'delete' && page.isSelected ? "scale-105" : "group-hover:scale-105"
                                )}
                                alt={`Page ${index + 1}`} 
                                style={{ transform: `rotate(${page.rotation || 0}deg)` }}
                            />
                            
                            {renderOverlay(page, index)}
                            {renderControls(page)}

                            <div className="absolute bottom-4 right-4 p-3 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-40 border border-slate-100 dark:border-white/5">
                                <Maximize2 size={16} />
                            </div>
                        </motion.div>

                        <div className="mt-4 px-4 py-1.5 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-full shadow-sm tracking-widest border border-slate-100 dark:border-white/10 uppercase transition-all group-hover:text-blue-600 group-hover:border-blue-500/30">
                            Page {index + 1}
                        </div>
                    </ItemWrapper>
                ))}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="relative w-full overflow-hidden group/slider">
            <div className="absolute top-1/2 -translate-y-1/2 left-4 z-40">
                <button 
                    onClick={prev}
                    disabled={currentIndex === 0}
                    className="w-16 h-16 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 disabled:opacity-0 transition-all border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    <ChevronLeft size={36} />
                </button>
            </div>
            
            <div className="absolute top-1/2 -translate-y-1/2 right-4 z-40">
                <button 
                    onClick={next}
                    disabled={currentIndex >= pages.length - getVisibleCount()}
                    className="w-16 h-16 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 disabled:opacity-0 transition-all border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    <ChevronRight size={36} />
                </button>
            </div>

            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-8 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-full border border-slate-200 dark:border-white/10 shadow-xl">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
                    SÉQUENCE <span className="text-blue-600 tabular-nums">{pages.length > 0 ? currentIndex + 1 : 0}</span> / {pages.length}
                </p>
            </div>

            {mode === 'organize' ? (
                <Reorder.Group axis="x" values={pages} onReorder={onReorder}>
                    {ContentBody}
                </Reorder.Group>
            ) : ContentBody}

            <AnimatePresence>
                {selectedPageForView && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
                        onClick={() => setSelectedPageForView(null)}
                    >
                        <button 
                            className="absolute top-6 right-6 text-white/50 hover:text-white p-4 transition-all z-[210]"
                            onClick={(e) => { e.stopPropagation(); setSelectedPageForView(null); }}
                        >
                            <X size={48} strokeWidth={1.5} />
                        </button>
                        
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative max-h-[90vh] max-w-[95vw] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {selectedPageForView === 'loading' ? (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                                        <div className="absolute inset-0 blur-xl bg-blue-500/20 rounded-full animate-pulse"></div>
                                    </div>
                                    <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">Chargement HD...</p>
                                </div>
                            ) : (
                                <div className="relative group/preview">
                                    <img 
                                        src={selectedPageForView} 
                                        className="max-h-[85vh] w-auto rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] object-contain border border-white/10"
                                        alt="Aperçu document"
                                    />
                                    <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] pointer-events-none"></div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PageSlider;
