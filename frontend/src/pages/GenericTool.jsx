import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle2, 
  Loader2,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FileDropzone, { cn } from '../components/FileDropzone';

const GenericTool = ({ title, description, icon: Icon, accept = "application/pdf" }) => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setIsSuccess(false);
            setError(null);
        }
    };

    const handleAction = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        
        setTimeout(() => {
            setIsProcessing(false);
            setError("Cette fonctionnalité sera disponible prochainement dans une version Premium de SignFlow.");
            setIsSuccess(false);
        }, 1500);
    };

    const reset = () => {
        setFile(null);
        setIsSuccess(false);
        setError(null);
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
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">Opération réussie !</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                    >
                        <Download size={20} /> Télécharger le résultat
                    </button>
                    <button onClick={reset} className="text-slate-500 hover:text-red-600 font-bold uppercase text-xs tracking-widest">
                        Recommencer
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#0f172a]">
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {title}
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                    {description}
                </p>
            </div>

            {!file ? (
                <FileDropzone 
                    onFileSelect={(selectedFile) => {
                        if (selectedFile) {
                            setFile(selectedFile);
                            setIsSuccess(false);
                            setError(description);
                        }
                    }}
                    selectedFile={file}
                    accept={accept}
                    label="Sélectionner le fichier"
                    description="ou déposez le fichier ici"
                />
            ) : (
                <div className="max-w-md w-full bg-white dark:bg-[#1e293b] p-8 rounded-[32px] shadow-xl text-center space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600">
                            <Icon size={48} />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white truncate w-full px-4">{file.name}</h4>
                    </div>
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center justify-center text-red-600 w-full mb-4">
                            <p className="text-sm font-bold text-center">{error}</p>
                        </div>
                    )}
                    <button
                        onClick={handleAction}
                        disabled={isProcessing || !!error}
                        className="w-full py-4 bg-[#e52424] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-[#d11f1f] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={20} /> : (error ? "Fonctionnalité Premium" : "Traiter le fichier")}
                    </button>
                    <button onClick={reset} className="text-slate-400 hover:text-red-500 text-xs font-bold uppercase disabled:opacity-50">Changer de fichier</button>
                </div>
            )}
        </div>
    );
};

export default GenericTool;
