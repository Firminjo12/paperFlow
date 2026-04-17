import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Settings, 
    X,
    Lock,
    Crown,
    AlertCircle,
    FileWarning,
    FileText
} from 'lucide-react';
import FileDropzone, { cn } from '../components/FileDropzone';

const RepairTool = () => {
    const [file, setFile] = useState(null);

    const handleFileSelect = (selectedFile) => {
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        }
    };

    const reset = () => {
        setFile(null);
    };

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
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-[#060912]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl w-full bg-white dark:bg-[#0d1120] rounded-[64px] border border-slate-100 dark:border-white/5 shadow-2xl p-16 space-y-10 text-center"
                    >
                        <div className="w-24 h-24 bg-amber-100 dark:bg-amber-600/10 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50 dark:ring-amber-900/10">
                            <FileWarning size={48} />
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-slate-100 dark:bg-white/5 w-fit mx-auto rounded-full text-slate-400">
                                <FileText size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{file.name}</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">Fonctionnalité <br/> Premium</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed max-w-md mx-auto">
                                La réparation de fichiers corrompus nécessite une analyse profonde. Cette fonctionnalité sera disponible <strong>prochainement</strong> dans une version Premium.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button
                                disabled
                                className="w-full h-20 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-[28px] font-black text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 cursor-not-allowed border-2 border-dashed border-slate-200 dark:border-white/10"
                            >
                                <Lock size={20} /> Traiter Indisponible
                            </button>
                            <button 
                                onClick={reset}
                                className="text-sm font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center justify-center gap-2 pt-4"
                            >
                                <Crown size={16} className="text-amber-500" /> Essayer un autre fichier
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default RepairTool;
