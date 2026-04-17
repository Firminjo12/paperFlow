import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileLock2, 
  Unlock, 
  Download, 
  Loader2, 
  RotateCcw,
  CheckCircle2, 
  AlertCircle,
  Lock,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FileDropzone from '../components/FileDropzone';

const UnlockTool = () => {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [finalPdfUrl, setFinalPdfUrl] = useState(null);

    const navigate = useNavigate();

    const onFileChange = (selectedFile) => {
        setFile(selectedFile);
        setError(null);
        setIsSuccess(false);
    };

    const handleUnlock = async (e) => {
        if (e) e.preventDefault();
        if (!file || !password) {
            setError("Veuillez fournir un fichier et le mot de passe.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('password', password); // On met le password EN PREMIER
            formData.append('file', file);

            const response = await fetch('http://localhost:5000/api/convert/unlock', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                console.error("Détails technique QPDF:", data.detail);
                throw new Error(data.message || "Impossible de déverrouiller le fichier.");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setFinalPdfUrl(url);
            setIsSuccess(true);
            
            // Auto-téléchargement
            const link = document.createElement('a');
            link.href = url;
            link.download = `Unlocked_${file.name}`;
            link.click();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPassword('');
        setIsSuccess(false);
        setError(null);
        setFinalPdfUrl(null);
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
                        <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">PDF Débloqué !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed">
                            Le mot de passe a été retiré. Vous pouvez maintenant modifier le fichier librement.
                        </p>
                    </div>
                    
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = finalPdfUrl;
                                link.download = `Unlocked_${file.name}`;
                                link.click();
                            }}
                            className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Download size={20} /> Télécharger
                        </button>
                        
                        <button
                            onClick={() => navigate('/censure')}
                            className="w-full h-16 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                        >
                            Aller à Censurer <ArrowRight size={16} />
                        </button>
                    </div>

                    <button onClick={reset} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold uppercase text-xs tracking-widest transition-colors block mx-auto">
                        Débloquer un autre fichier
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#0f172a] min-h-screen pt-20">
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase italic">
                    Débloquer <span className="text-blue-600">PDF</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                    Retirez définitivement le mot de passe de vos documents protégés pour pouvoir les modifier ou les imprimer sans contraintes.
                </p>
            </div>

            {!file ? (
                <FileDropzone 
                    onFileSelect={onFileChange}
                    selectedFile={file}
                    accept="application/pdf"
                    label="Choisir le PDF protégé"
                    description="pour retirer la sécurité"
                />
            ) : (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white dark:bg-[#1e293b] p-10 rounded-[40px] shadow-2xl border border-white dark:border-white/5 space-y-10"
                >
                    <div className="text-center space-y-2">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileLock2 size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Mot de passe requis</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest truncate max-w-full px-4">
                            {file.name}
                        </p>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                Mot de passe du PDF
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Saisissez ici..."
                                    className="w-full h-14 pl-12 pr-12 bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-2xl text-[11px] font-bold border border-red-100 dark:border-red-500/20 flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <button
                                type="submit"
                                disabled={isProcessing || !password}
                                className="w-full h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {isProcessing ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Unlock size={18} /> 
                                        <span>Débloquer le document</span>
                                    </>
                                )}
                            </button>
                            <button 
                                type="button"
                                onClick={reset}
                                className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} /> Annuler
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
        </div>
    );
};

export default UnlockTool;
