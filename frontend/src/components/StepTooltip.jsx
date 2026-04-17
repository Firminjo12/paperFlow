import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

const StepTooltip = ({ text, children, placement = 'bottom' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef(null);

    // Close on click outside for mobile support
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setIsVisible(false);
            }
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isVisible]);

    const isBottom = placement === 'bottom';

    return (
        <div
            className="relative inline-flex items-center group cursor-help"
            ref={tooltipRef}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsVisible(!isVisible);
                }}
                className="ml-1.5 text-slate-300 hover:text-blue-500 transition-colors focus:outline-none"
                aria-label="Informations"
            >
                <HelpCircle size={14} />
            </button>

            <AnimatePresence>
                {isVisible && (
                    <>
                        {/* Backdrop for mobile to handle click-outside better */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
                            onClick={() => setIsVisible(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: isBottom ? 20 : -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: isBottom ? 20 : -20 }}
                            className={`fixed md:absolute ${isBottom ? 'bottom-6 md:bottom-full md:mb-3' : 'bottom-6 md:top-full md:mt-3'} left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-80 p-6 dark:bg-slate-900 bg-white dark:text-white text-slate-900 rounded-3xl shadow-2xl z-[60] text-[15px] font-medium leading-relaxed border dark:border-white/10 border-slate-200`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Arrow reversed based on placement */}
                            <div className={`hidden md:block absolute ${isBottom ? 'top-full border-t-white dark:border-t-slate-900' : 'bottom-full border-b-white dark:border-b-slate-900'} left-1/2 -translate-x-1/2 ${isBottom ? '-mt-1' : '-mb-1'} border-8 border-transparent`} />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-1.5 bg-blue-500 rounded-full" />
                                    <button
                                        onClick={() => setIsVisible(false)}
                                        className="md:hidden p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <HelpCircle size={18} className="text-slate-400" />
                                    </button>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                    {typeof text === 'string' ? <p className="dark:text-slate-200 text-slate-700">{text}</p> : text}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StepTooltip;
