import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Presentation, 
  CheckCircle2, 
  Loader2,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FileDropzone, { cn } from '../components/FileDropzone';
import api from '../services/api';

const PdfToPpt = () => {
    const { jwt } = useAuth();
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
        if (selectedFile && selectedFile.type === 'application/pdf') {
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
            // Utilise l'endpoint pdf-to-pptx configuré sur le backend
            const blob = await api.convertFile(jwt, 'pdf-to-pptx', file, () => setIsWakingUp(true));
            const url = URL.createObjectURL(blob);
            
            setResult({
                url,
                name: `${file.name.split('.')[0]}.pptx`
            });
            setIsSuccess(true);
        } catch (err) {
            console.error(err);
            setError(err.message || "Impossible de convertir ce PDF en présentation PowerPoint.");
        } finally {
            setIsProcessing(false);
            setIsWakingUp(false);
        }
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
        }, 1000);
    };

    const reset = () => {
        setFile(null);
        setIsSuccess(false);
        setError(null);
        setResult(null);
    };

    if (isSuccess) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-[#f3f0f1] dark:bg-[#0f172a]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-8 p-12 bg-white dark:bg-[#1e293b] rounded-[48px] shadow-2xl"
                >
                    <div className="w-24 h-24 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">C'est prêt !</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Votre présentation PowerPoint est prête à être téléchargée.</p>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={downloadResult}
                            className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                        >
                            <Download size={20} /> Télécharger le PPTX
                        </button>
                        <button onClick={reset} className="text-slate-500 hover:text-red-500 font-bold uppercase text-xs tracking-widest transition-colors">
                            Convertir un autre PDF
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#0f172a]">
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] uppercase">
                    PDF en <br />
                    <span className="text-orange-600 italic">PowerPoint.</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-bold uppercase tracking-tighter">
                    Transformez vos fichiers PDF en présentations PPTX faciles à éditer.
                </p>
            </div>

            {!file ? (
                <div className="w-full max-w-lg">
                    <FileDropzone 
                        onFileSelect={(selectedFile) => {
                            if (selectedFile && selectedFile.type === 'application/pdf') {
                                setFile(selectedFile);
                                setIsSuccess(false);
                                setError(null);
                                setResult(null);
                            }
                        }}
                        selectedFile={file}
                        label="Sélectionner le PDF à convertir"
                        description="ou déposez le document ici"
                    />
                </div>
            ) : (
                <div className="max-w-md w-full bg-white dark:bg-[#1e293b] p-10 rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl text-center space-y-8">
                    <div className="flex flex-col items-center gap-6">
                        <div className="p-5 bg-orange-100 dark:bg-orange-600/20 text-orange-600 rounded-2xl">
                            <Presentation size={48} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg truncate w-full px-4">{file.name}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-center justify-center text-red-600 w-full animate-in fade-in zoom-in-95 duration-300">
                            <p className="text-sm font-bold text-center uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={handleConvert}
                            disabled={isProcessing}
                            className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>CONVERSION...</span>
                                </div>
                            ) : (
                                <><span>CONVERTIR EN PPTX</span></>
                            )}
                        </button>
                        
                        {isWakingUp && (
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">
                                Serveur en veille, réveil en cours... (~30s)
                            </p>
                        ) || (
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Conversion haute fidélité
                            </p>
                        )}
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
        </div>
    );
};

export default PdfToPpt;
