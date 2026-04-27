import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Settings, 
    X,
    Lock,
    Crown,
    AlertCircle,
    FileWarning,
    FileText,
    Loader2,
    Download,
    CheckCircle2,
    History
} from 'lucide-react';
import FileDropzone, { cn } from '../components/FileDropzone';

const RepairTool = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const handleFileSelect = (selectedFile) => {
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError(null);
            setIsSuccess(false);
        }
    };

    const handleRepair = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/convert/repair`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Erreur lors de la réparation.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            setDownloadUrl(url);
            setIsSuccess(true);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setIsSuccess(false);
        setError(null);
        setDownloadUrl(null);
    };

    if (isSuccess) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F8FAFC] dark:bg-[#060912]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-[540px] w-full bg-white dark:bg-[#0d1120] rounded-[60px] border border-slate-100 dark:border-white/5 shadow-2xl p-16 space-y-12 text-center"
                >
                    <div className="w-32 h-32 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50 dark:ring-green-900/10">
                        <CheckCircle2 size={56} />
                    </div>
                    
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Réparation terminée !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
                            Votre fichier PDF a été stabilisé et les erreurs de structure ont été corrigées.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <a
                            href={downloadUrl}
                            download={`Repaired_${file.name}`}
                            className="w-full h-20 bg-blue-600 text-white rounded-[28px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            <Download size={20} /> Télécharger le PDF
                        </a>
                        <button 
                            onClick={reset}
                            className="text-sm font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2 pt-4"
                        >
                            <History size={16} /> Réparer un autre fichier
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f3f0f1] dark:bg-[#060912] overflow-hidden">
            {!file ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
                    <div className="text-center space-y-4 max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] uppercase">
                            Réparer <br />
                            <span className="text-[#e52424] italic">PROpriétés perdues.</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-bold uppercase tracking-tighter">Réparez les documents PDF corrompus <br/> et récupérez vos données précieuses.</p>
                    </div>
                    <div className="w-full max-w-lg">
                        <FileDropzone 
                            onFileSelect={handleFileSelect} 
                            selectedFile={file} 
                            label="Sélectionner le PDF corrompu"
                            description="ou déposez le document ici"
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F8FAFC] dark:bg-[#060912]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-[540px] w-full bg-white dark:bg-[#0d1120] rounded-[60px] border border-slate-100 dark:border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-16 space-y-12 text-center"
                    >
                        <div className="relative mx-auto w-32 h-32">
                            <div className="absolute inset-0 bg-blue-100/50 dark:bg-blue-500/10 rounded-full animate-pulse" />
                            <div className="relative w-full h-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-[#0d1120]">
                                {isProcessing ? <Loader2 size={56} className="animate-spin" /> : <Settings size={56} className="animate-float" strokeWidth={1.5} />}
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/10">
                                <FileText size={14} className="text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{file.name}</span>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-5xl font-black text-[#0F172A] dark:text-white uppercase tracking-tighter leading-[0.95]">
                                    Analyse <br/>
                                    <span className="text-[#0F172A] dark:text-white">Profonde</span>
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-[17px] leading-relaxed max-w-[360px] mx-auto">
                                    {isProcessing 
                                        ? "Nous analysons la structure du fichier et réparons les tables XREF corrompues..."
                                        : "Prêt à lancer la réparation. Cet outil corrigera les erreurs de structure et tentera de récupérer tout le contenu possible."}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 text-sm font-bold uppercase tracking-tight">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6 pt-4">
                            <button
                                onClick={handleRepair}
                                disabled={isProcessing}
                                className="group w-full h-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Réparation en cours...</span>
                                    </>
                                ) : (
                                    <>
                                        <Settings size={20} />
                                        <span>Lancer la réparation</span>
                                    </>
                                )}
                            </button>
                            
                            <button 
                                onClick={reset}
                                disabled={isProcessing}
                                className="group flex items-center justify-center gap-2 mx-auto text-slate-400 hover:text-red-500 font-black text-sm uppercase tracking-[0.15em] transition-all disabled:opacity-30"
                            >
                                <X size={18} />
                                <span>Changer de fichier</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default RepairTool;
