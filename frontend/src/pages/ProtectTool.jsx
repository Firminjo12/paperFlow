import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2,
  Download,
  Lock,
  KeyRound,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import FileDropzone, { cn } from '../components/FileDropzone';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { uploadToStorage } from '../utils/storage';

const ProtectTool = () => {
    const [file, setFile] = useState(null);
    const [fileBytes, setFileBytes] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('');
    const { jwt, user } = useAuth();
    const [finalPdfUrl, setFinalPdfUrl] = useState(null);

    const onFileChange = async (selectedFile) => {
        if (selectedFile) {
            setFile(selectedFile);
            setIsSuccess(false);
            setError(null);
            setPassword('');
            
            try {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                
                // Vérifier si on peut le lire (et s'il n'est pas déjà protégé)
                await PDFDocument.load(bytes);
                setFileBytes(bytes);
            } catch (e) {
                const msg = (e.message || "").toLowerCase();
                const name = (e.name || "").toLowerCase();
                if (msg.includes('encrypt') || msg.includes('password') || name.includes('encrypt')) {
                    setError("Le fichier est déjà protégé par un mot de passe. Déverrouillez-le d'abord.");
                    setFileBytes(null);
                } else {
                    setError("Impossible de lire ce PDF. Il est peut-être corrompu.");
                    setFileBytes(null);
                }
            }
        }
    };

    const handleProtect = async () => {
        if (!fileBytes || !password) {
            setError("Veuillez saisir un mot de passe.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        
        try {
            // Lazy load package because of webcrypto usage
            const { encryptPDF } = await import('@pdfsmaller/pdf-encrypt');
            
            const encryptedBytes = await encryptPDF(fileBytes, password, {
                ownerPassword: password, // Identique au mot de passe utilisateur
                allowPrinting: true,     // Souvent autorisé pour impression
                allowModifying: false,
                allowCopying: false,
                allowAnnotating: false,
                allowFillingForms: false,
                allowExtraction: false,
                allowAssembly: false,
            });

            const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setFinalPdfUrl(url);

            // Log to Backend
            if (jwt) {
                try {
                    const userId = user?.id || user?._id || 'anonymous';
                    const downloadURL = await uploadToStorage(blob, userId, 'protected');

                    await api.logDocument(jwt, {
                        file_name: `Protected_${file.name}`,
                        file_size: blob.size,
                        action: 'protect',
                        file_url: downloadURL
                    });
                } catch (err) {
                    console.error("Logging failed:", err);
                }
            }

            setIsSuccess(true);
            
        } catch (e) {
            setError(e.message || "Une erreur s'est produite lors de la protection du PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setFileBytes(null);
        setIsSuccess(false);
        setError(null);
        setPassword('');
        if (finalPdfUrl) {
            URL.revokeObjectURL(finalPdfUrl);
            setFinalPdfUrl(null);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-[#f3f0f1] dark:bg-[#0f172a] min-h-screen pt-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-8 p-12 bg-white dark:bg-[#1e293b] rounded-[48px] shadow-2xl"
                >
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Lock size={48} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">PDF Protégé !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Votre document est maintenant chiffré et sécurisé.</p>
                    </div>
                    <button
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = finalPdfUrl;
                            link.download = "paperFlow_protected.pdf";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        <Download size={20} /> Télécharger à nouveau
                    </button>
                    <button onClick={reset} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold uppercase text-xs tracking-widest transition-colors">
                        Protéger un autre PDF
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#0f172a] min-h-screen pt-20">
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Protéger PDF
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                    Sécurisez vos fichiers PDF en ajoutant un mot de passe. Chiffrez vos documents pour éviter tout accès non autorisé.
                </p>
            </div>

            {!file ? (
                <FileDropzone 
                    onFileSelect={onFileChange}
                    selectedFile={file}
                    accept="application/pdf"
                    label="Sélectionner le fichier"
                    description="ou déposez le PDF ici"
                />
            ) : (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white dark:bg-[#1e293b] p-8 rounded-[32px] shadow-xl text-center space-y-6"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600">
                            <FileText size={48} />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white truncate w-full px-4">{file.name}</h4>
                    </div>
                    
                    <AnimatePresence>
                        {fileBytes && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4"
                            >
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl text-left border border-blue-100 dark:border-blue-900/30">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                        Nouveau Mot de passe
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <KeyRound size={20} />
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="Saisissez un mot de passe sécurisé"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleProtect();
                                            }}
                                            disabled={isProcessing}
                                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center justify-center text-red-600 w-full mb-4 shadow-sm"
                        >
                            <p className="text-sm font-bold text-center">{error}</p>
                        </motion.div>
                    )}
                    
                    <button
                        onClick={handleProtect}
                        disabled={isProcessing || !password || !fileBytes}
                        className={cn(
                            "w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg",
                            fileBytes && password && !isProcessing
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                        )}
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={20} /> : "Chiffrer le document"}
                    </button>
                    
                    <button onClick={reset} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold uppercase transition-colors">
                        Annuler / Changer de fichier
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default ProtectTool;
