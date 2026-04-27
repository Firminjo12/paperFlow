import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    FileEdit, 
    X,
    CheckCircle2,
    ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import FileDropzone, { cn } from '../components/FileDropzone';
import PdfEditor from '../components/PdfEditor';

const EditPdfTool = () => {
    const [file, setFile] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const editorRef = useRef(null);

    const handleFileSelect = (selectedFile) => {
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setIsSuccess(false);
        }
    };

    const reset = () => {
        setFile(null);
        setIsSuccess(false);
    };

    if (isSuccess) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-[#060912]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl p-12 text-center space-y-8"
                >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">Document prêt !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Vos modifications ont été appliquées avec succès.</p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = isSuccess.url;
                                link.download = isSuccess.name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="w-full h-16 bg-red-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-500/20 hover:shadow-red-500/40 transition-all flex items-center justify-center gap-3"
                        >
                             Télécharger
                        </button>
                        <button
                            onClick={reset}
                            className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-3"
                        >
                            <ArrowLeft size={20} /> Modifier un autre PDF
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
                            Modifier <br />
                            <span className="text-[#e52424] italic">PROprement vos PDF.</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-bold uppercase tracking-tighter">Ajoutez du texte, des images ou des formes <br/> directement dans votre navigateur.</p>
                    </div>
                    <div className="w-full max-w-lg">
                        <FileDropzone 
                            onFileSelect={handleFileSelect} 
                            selectedFile={file} 
                            label="Sélectionner le PDF à modifier"
                            description="ou déposez le document ici"
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col h-full bg-slate-200">
                    <header className="bg-white/90 dark:bg-[#0d1120]/90 backdrop-blur-md px-10 py-4 flex justify-between items-center w-full border-b border-slate-200 dark:border-white/5 z-40">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-600/20 text-blue-600 rounded-xl">
                                <FileEdit size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[200px] md:max-w-md">{file.name}</h2>
                        </div>
                        <button onClick={reset} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-2">
                            <X size={16} /> Fermer
                        </button>
                    </header>

                    <div className="flex-1 relative overflow-hidden">
                        <PdfEditor 
                            ref={editorRef} 
                            file={file} 
                            action="edit"
                            onComplete={(url, name) => setIsSuccess({ url, name })} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditPdfTool;
