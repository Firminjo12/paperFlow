import React, { useState, useRef } from 'react';
import { useFeedback } from '../contexts/FeedbackContext';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle2, 
  Loader2,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FileDropzone, { cn } from '../components/FileDropzone';
import api from '../services/api';

const WordToPdf = () => {
    const { jwt } = useAuth();
    const { triggerFeedback } = useFeedback();
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isWakingUp, setIsWakingUp] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.name.endsWith('.doc') || selectedFile.name.endsWith('.docx'))) {
            setFile(selectedFile);
            setIsSuccess(false);
            setError(null);
            setResult(null);
        }
    };

    const handleConvert = async () => {
        if (!file) return;
        setIsProcessing(true);
        setIsWakingUp(false);
        setError(null);
        
        try {
            const blob = await api.convertFile(jwt, 'word-to-pdf', file, () => setIsWakingUp(true));
            const url = URL.createObjectURL(blob);
            
            setResult({
                url,
                name: `${file.name.split('.')[0]}.pdf`
            });
            setIsSuccess(true);
        } catch (err) {
            console.error(err);
            setError(err.message || "Une erreur est survenue lors de la conversion de haute qualité.");
        } finally {
            setIsProcessing(false);
            setIsWakingUp(false);
        }
    };

    const reset = () => {
        setFile(null);
        setIsSuccess(false);
        setError(null);
        setResult(null);
    };

    const downloadResult = () => {
        if (!result) return;
        const link = document.createElement('a');
        link.href = result.url;
        link.download = result.name;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            if (document.body.contains(link)) document.body.removeChild(link);
            triggerFeedback();
        }, 1000);
    };

    if (isSuccess) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-[#f3f0f1] dark:bg-[#0f172a]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-8 p-12 bg-white dark:bg-[#1e293b] rounded-[48px] shadow-2xl"
                >
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white"><span>Conversion Word en PDF réussie !</span></h2>
                    <button
                        onClick={downloadResult}
                        className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                    >
                        <Download size={20} /> <span>Télécharger le PDF</span>
                    </button>
                    <button onClick={reset} className="text-slate-500 hover:text-red-600 font-bold uppercase text-xs tracking-widest">
                        <span>Convertir un autre document Word</span>
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#0f172a]">
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Word en PDF
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                    Convertissez vos documents Word en PDF avec la meilleure qualité possible. Simple, rapide et 100% gratuit.
                </p>
            </div>

            {!file ? (
                <FileDropzone 
                    onFileSelect={(selectedFile) => {
                        if (selectedFile && (selectedFile.name.endsWith('.doc') || selectedFile.name.endsWith('.docx'))) {
                            setFile(selectedFile);
                            setIsSuccess(false);
                            setError(null);
                            setResult(null);
                        }
                    }}
                    selectedFile={file}
                    accept=".doc,.docx"
                    label="Sélectionner les documents Word"
                    description="ou déposez les documents Word ici"
                />
            ) : (
                <div className="max-w-md w-full bg-white dark:bg-[#1e293b] p-8 rounded-[32px] shadow-xl text-center space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600">
                            <FileText size={48} />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white truncate w-full px-4">{file.name}</h4>
                    </div>
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center justify-center text-red-600 w-full">
                            <p className="text-sm font-bold text-center">{error}</p>
                        </div>
                    )}
                    <button
                        onClick={handleConvert}
                        disabled={isProcessing}
                        className="w-full py-4 bg-[#e52424] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-[#d11f1f] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="relative flex items-center justify-center min-h-[24px] w-full">
                            <span className={`absolute flex items-center gap-2 transition-all duration-300 ${isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                <Loader2 className="animate-spin" size={20} /> <span>Conversion...</span>
                            </span>
                            <span className={`transition-all duration-300 ${!isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                <span>Convertir en PDF</span>
                            </span>
                        </span>
                    </button>
                    {isWakingUp && (
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-2 text-center animate-pulse">
                            <span>Démarrage du serveur en cours, veuillez patienter (~30s)...</span>
                        </p>
                    )}
                    <button onClick={reset} className="text-slate-400 hover:text-red-500 text-xs font-bold uppercase disabled:opacity-50"><span>Changer de document</span></button>
                </div>
            )}
        </div>
    );
};

export default WordToPdf;
