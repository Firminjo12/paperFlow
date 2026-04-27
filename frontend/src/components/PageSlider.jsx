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
    AlertCircle
} from 'lucide-react';
import { cn } from '../components/FileDropzone';

const PageSlider = ({ 
    pages = [], 
    mode = 'view', 
    onPageSelect, 
    onPageDelete, 
    onPageRotate,
    onReorder 
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
        if (window.innerWidth >= 1280) return 4;
        if (window.innerWidth >= 768) return 2;
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
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                            <Scissors size={12} /> Intervalle {page.intervalId || 1}
                        </div>
                    </div>
                );
            case 'delete':
                return page.isSelected && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 bg-red-600/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-10"
                    >
                        <motion.div 
                            initial={{ y: 10 }}
                            animate={{ y: 0 }}
                            className="bg-white text-red-600 rounded-full p-4 shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                        >
                            <Trash2 size={32} strokeWidth={3} />
                        </motion.div>
                        <span className="text-[11px] font-black uppercase text-white tracking-[0.4em] drop-shadow-lg">Supprimer</span>
                        <div className="absolute -top-1 -right-1">
                            <AlertCircle className="text-white fill-red-600" size={24} />
                        </div>
                    </motion.div>
                );
            case 'extract':
                return page.isSelected && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-green-500/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-10"
                    >
                        <div className="bg-white text-green-600 rounded-full p-3 shadow-2xl">
                            <CheckCircle2 size={24} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-white tracking-[0.2em] drop-shadow-md">Sélectionné</span>
                    </motion.div>
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center z-10">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onPageRotate(page.id); }}
                            className="bg-white dark:bg-slate-800 text-blue-600 p-4 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                        >
                            <RotateCcw size={28} />
                        </button>
                    </div>
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
                            className="w-10 h-10 bg-white dark:bg-slate-800 text-red-600 rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all border border-slate-100 dark:border-white/5"
                        >
                            <Trash2 size={18} />
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
                    className="flex-shrink-0 w-full md:w-1/2 xl:w-1/4 px-6 snap-center relative group"
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                >
                    {children}
                </Reorder.Item>
            );
        }
        return (
            <div className="flex-shrink-0 w-full md:w-1/2 xl:w-1/4 px-6 snap-center relative group">
                {children}
            </div>
        );
    };

    const ContentBody = (
        <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar py-16 px-4 scroll-smooth min-h-[550px]"
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
                                "relative aspect-[3/4] bg-white dark:bg-slate-800 rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none border-[6px] transition-all cursor-pointer group",
                                mode === 'delete' && page.isSelected 
                                    ? "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)] scale-[0.98]" 
                                    : mode === 'extract' && page.isSelected 
                                    ? "border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
                                    : "border-transparent hover:border-blue-500/40 hover:shadow-[0_20px_55px_-12px_rgba(0,0,0,0.2)] hover:-translate-y-2"
                            )}
                            onClick={() => onPageSelect && onPageSelect(page.id)}
                        >
                            <img 
                                src={page.url} 
                                className={cn(
                                    "w-full h-full object-cover select-none pointer-events-none transition-transform duration-700",
                                    mode === 'delete' && page.isSelected ? "scale-110 blur-[1px]" : "group-hover:scale-105"
                                )}
                                alt={`Page ${index + 1}`} 
                                style={{ transform: `rotate(${page.rotation || 0}deg)` }}
                            />
                            
                            {renderOverlay(page, index)}
                            {renderControls(page)}

                            <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedPageForView(page.url); }}
                                className="absolute bottom-6 right-6 p-4 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-20 border border-slate-100 dark:border-white/5"
                            >
                                <Maximize2 size={20} />
                            </button>

                            <div className="absolute bottom-6 left-6 px-5 py-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black rounded-full shadow-lg z-20 tracking-widest border border-white/10 uppercase">
                                P. {index + 1}
                            </div>
                        </motion.div>
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
                        className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-8 overflow-hidden"
                        onClick={() => setSelectedPageForView(null)}
                    >
                        <button className="absolute top-10 right-10 text-white/30 hover:text-white p-4 transition-all hover:rotate-90">
                            <X size={56} strokeWidth={1} />
                        </button>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, rotateY: 20 }}
                            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-h-full max-w-5xl"
                        >
                            <img 
                                src={selectedPageForView} 
                                className="max-h-full max-w-full rounded-3xl shadow-2xl shadow-blue-500/10 object-contain ring-1 ring-white/10"
                                alt="Visualisation"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PageSlider;
