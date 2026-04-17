import React from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const NavigationBar = ({
    currentStep,
    onBack,
    onNext,
    nextDisabled,
    isLastStep
}) => {
    // Le bouton retour n'est affiché qu'à partir de l'étape 2
    const showBack = currentStep > 1 && currentStep < 4;
    // Le bouton suivant n'est affiché que pour les étapes 1, 2, 3
    const showNext = currentStep < 4;

    if (currentStep === 4) return null; // Le RatingModal gère sa propre navigation

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 z-[60] safe-area-bottom">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 md:items-center justify-between">

                {/* Bouton Retour */}
                <div className="flex-1 order-2 md:order-1">
                    {showBack && (
                        <button
                            onClick={onBack}
                            className="w-full md:w-auto px-6 py-4 md:py-3 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 shadow-sm"
                        >
                            <ChevronLeft size={20} />
                            <span>Retour</span>
                        </button>
                    )}
                </div>

                {/* Bouton Suivant / Terminer */}
                <div className="flex-1 flex justify-end order-1 md:order-2">
                    {showNext && (
                        <button
                            disabled={nextDisabled}
                            onClick={onNext}
                            className={`
                w-full md:w-auto px-8 py-4 md:py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-95 shadow-lg shadow-blue-500/20
                ${nextDisabled
                                    ? 'opacity-40 cursor-not-allowed bg-slate-400 shadow-none'
                                    : 'bg-gradient-to-r from-[#388bfd] to-[#5e3aee] hover:shadow-blue-500/40 hover:scale-[1.02]'
                                }
              `}
                        >
                            <span className="text-base">{isLastStep ? 'Terminer' : 'Suivant'}</span>
                            {isLastStep ? <Check size={20} /> : <ChevronRight size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NavigationBar;
