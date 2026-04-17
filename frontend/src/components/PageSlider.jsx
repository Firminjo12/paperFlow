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
    Files
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

    // Render the specific overlay/badge based on mode
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
                    <div className="absolute inset-0 bg-red-500/40 flex flex-col items-center justify-center gap-2 animate-in fade-in duration-300">
                        <div className="bg-white text-red-600 rounded-full p-3 shadow-2xl">
                            <Trash2 size={24} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-white tracking-[0.2em] drop-shadow-md">Supprimer</span>
                    </div>
                );
            case 'extract':
                return page.isSelected && (
                    <div className="absolute inset-0 bg-green-500/40 flex flex-col items-center justify-center gap-2 animate-in fade-in duration-300">
                        <div className="bg-white text-green-600 rounded-full p-3 shadow-2xl">
                            <CheckCircle2 size={24} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-white tracking-[0.2em] drop-shadow-md">Sélectionné</span>
                    </div>
                );
            case 'organize':
                return (
                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="w-10 h-10 bg-white/90 dark:bg-slate-800/90 text-slate-400 rounded-2xl flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing hover:text-blue-600 transition-colors">
                            <GripVertical size={20} />
                        </div>
                    </div>
                );
            case 'rotate':
                return (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
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
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {(mode === 'organize' || mode === 'rotate') && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onPageRotate(page.id); }}
                            className="w-10 h-10 bg-white dark:bg-slate-800 text-blue-600 rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                        >
                            <RotateCcw size={18} />
                        </button>
                    )}
                    {(mode === 'organize' || mode === 'delete') && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onPageDelete(page.id); }}
                            className="w-10 h-10 bg-white dark:bg-slate-800 text-red-600 rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            );
        }
        return null;
    };

    // Shared item component wrapper
    const ItemWrapper = ({ page, index, children }) => {
        if (mode === 'organize') {
            return (
                <Reorder.Item
                    value={page}
                    className="flex-shrink-0 w-full md:w-1/2 xl:w-1/4 px-4 snap-center relative group"
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                >
                    {children}
                </Reorder.Item>
            );
        }
        return (
            <div className="flex-shrink-0 w-full md:w-1/2 xl:w-1/4 px-4 snap-center relative group">
                {children}
            </div>
        );
    };

    const ContentBody = (
        <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar py-12 px-4 scroll-smooth min-h-[500px]"
        >
            <AnimatePresence mode="popLayout">
                {pages.map((page, index) => (
                    <ItemWrapper key={page.id} page={page} index={index}>
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={cn(
                                "relative aspect-[3/4] bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden shadow-2xl border-4 transition-all",
                                mode === 'delete' && page.isSelected ? "border-red-500 shadow-red-500/20" : 
                                mode === 'extract' && page.isSelected ? "border-green-500 shadow-green-500/20" :
                                "border-transparent hover:border-blue-500/30"
                            )}
                            onClick={() => onPageSelect && onPageSelect(page.id)}
                        >
                            <img 
                                src={page.url} 
                                className="w-full h-full object-cover select-none pointer-events-none" 
                                alt={`Page ${index + 1}`} 
                                style={{ transform: `rotate(${page.rotation || 0}deg)` }}
                            />
                            
                            {renderOverlay(page, index)}
                            {renderControls(page)}

                            {/* View Button */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedPageForView(page.url); }}
                                className="absolute bottom-4 right-4 p-3 bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                            >
                                <Maximize2 size={18} />
                            </button>

                            {/* Page Indicator Badge */}
                            <div className="absolute bottom-4 left-4 px-4 py-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black rounded-full shadow-lg">
                                PAGE {index + 1}
                            </div>
                        </motion.div>
                    </ItemWrapper>
                ))}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="relative w-full overflow-hidden group/slider">
            {/* Navigation Handles */}
            <div className="absolute top-1/2 -translate-y-1/2 left-4 z-40 transition-all">
                <button 
                    onClick={prev}
                    disabled={currentIndex === 0}
                    className="w-14 h-14 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 disabled:opacity-0 transition-all border border-slate-100 dark:border-white/5"
                >
                    <ChevronLeft size={32} />
                </button>
            </div>
            
            <div className="absolute top-1/2 -translate-y-1/2 right-4 z-40 transition-all">
                <button 
                    onClick={next}
                    disabled={currentIndex >= pages.length - getVisibleCount()}
                    className="w-14 h-14 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 disabled:opacity-0 transition-all border border-slate-100 dark:border-white/5"
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            {/* Indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-6 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-100 dark:border-white/5 shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                    Page <span className="text-blue-600">{pages.length > 0 ? currentIndex + 1 : 0}</span> / {pages.length}
                </p>
            </div>

            {/* Slider Content */}
            {mode === 'organize' ? (
                <Reorder.Group axis="x" values={pages} onReorder={onReorder}>
                    {ContentBody}
                </Reorder.Group>
            ) : ContentBody}

            {/* Modal View */}
            <AnimatePresence>
                {selectedPageForView && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 overflow-hidden"
                        onClick={() => setSelectedPageForView(null)}
                    >
                        <button className="absolute top-8 right-8 text-white/50 hover:text-white p-4 transition-colors">
                            <X size={48} />
                        </button>
                        <motion.img 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            src={selectedPageForView} 
                            className="max-h-full max-w-full rounded-2xl shadow-2xl shadow-blue-500/10 object-contain"
                            alt="Visualisation plein écran"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PageSlider;
