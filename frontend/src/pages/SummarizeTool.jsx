import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import FileDropzone from '../components/FileDropzone';
import api from '../services/api';

const SummarizeTool = () => {
    const { jwt } = useAuth();
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [summary, setSummary] = useState("");
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleFileSelect = (selectedFile) => {
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setSummary("");
            setError(null);
        }
    };

    const handleSummarize = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = jwt || localStorage.getItem('jwt_token');
            if (!token) throw new Error("Veuillez vous connecter pour utiliser l'IA.");

            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/ai/summarize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Erreur lors de la génération du résumé.");
            }

            setSummary(data.summary);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const reset = () => {
        setFile(null);
        setSummary("");
        setError(null);
    };

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#0f172a]">
            {/* Header section */}
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] uppercase">
                    Résumé par <br />
                    <span className="text-purple-600 italic">IA.</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-bold uppercase tracking-tighter">
                    Obtenez une synthèse intelligente de vos documents PDF en quelques secondes.
                </p>
            </div>

            <div className="w-full max-w-4xl flex flex-col items-center">
                <AnimatePresence mode="wait">
                    {!summary ? (
                        <motion.div 
                            key="input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-lg space-y-8"
                        >
                            {!file ? (
                                <FileDropzone 
                                    onFileSelect={handleFileSelect}
                                    selectedFile={file}
                                    label="Sélectionner le PDF à résumer"
                                    description="L'IA analysera le contenu pour vous"
                                />
                            ) : (
                                <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl text-center space-y-8">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="p-5 bg-purple-100 dark:bg-purple-600/20 text-purple-600 rounded-2xl">
                                            <FileText size={48} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg truncate w-full px-4 text-center">{file.name}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">ANALYSE PRÊTE</p>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 animate-in fade-in zoom-in-95">
                                            <p className="text-sm font-bold uppercase tracking-tight text-center">{error}</p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <button
                                            onClick={handleSummarize}
                                            disabled={isProcessing}
                                            className="w-full h-16 bg-purple-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isProcessing ? (
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="animate-spin" size={24} />
                                                    <span>ANALYSE...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Sparkles size={20} />
                                                    <span>GÉNÉRER LE RÉSUMÉ</span>
                                                </>
                                            )}
                                        </button>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                            Propulsé par Google Gemini Pro
                                        </p>
                                    </div>

                                    <button 
                                        onClick={reset} 
                                        disabled={isProcessing}
                                        className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                                    >
                                        Changer de fichier
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full bg-white dark:bg-[#1e293b] p-8 md:p-12 rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-100 dark:bg-green-600/20 text-green-600 rounded-xl">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Résumé généré</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={copyToClipboard}
                                        className="p-3 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-600/10 rounded-2xl transition-all"
                                        title="Copier le résumé"
                                    >
                                        {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="prose dark:prose-invert max-w-none">
                                <div className="p-6 md:p-8 bg-slate-50 dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-white/5 whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                    {summary}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                <button
                                    onClick={reset}
                                    className="flex-1 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3"
                                >
                                    Faire un autre résumé
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SummarizeTool;
