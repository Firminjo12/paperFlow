import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FileImage, 
  CheckCircle2, 
  Loader2,
  Download,
  ArrowLeft,
  Plus,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FileDropzone, { cn } from '../components/FileDropzone';
import { PDFDocument } from 'pdf-lib';

const JpgToPdf = () => {
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const onFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            setPdfUrl(null);
        }
    };

    const handleConvert = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        
        try {
            const pdfDoc = await PDFDocument.create();
            
            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                let image;
                
                if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                    image = await pdfDoc.embedJpg(arrayBuffer);
                } else if (file.type === 'image/png') {
                    image = await pdfDoc.embedPng(arrayBuffer);
                } else {
                    continue;
                }

                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (error) {
            console.error('Error during conversion:', error);
            alert('Une erreur est survenue lors de la conversion.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) return;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = files.length === 1 ? `${files[0].name.split('.')[0]}.pdf` : 'signflow_images.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        if (files.length === 1) setPdfUrl(null);
    };

    const reset = () => {
        setFiles([]);
        setPdfUrl(null);
    };

    if (pdfUrl) {
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
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white"><span>Conversion réussie !</span></h2>
                    <div className="space-y-3">
                        <button
                            onClick={handleDownload}
                            className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                        >
                            <Download size={20} /> Télécharger le PDF
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full h-14 border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                        >
                            <span>Retour à l'accueil</span>
                        </button>
                    </div>
                    <button onClick={reset} className="text-slate-500 hover:text-red-600 font-bold uppercase text-xs tracking-widest">
                        <span>Convertir d'autres images</span>
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#0f172a]">
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
                    JPG en PDF
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                    Convertissez vos images JPG et PNG en PDF en quelques secondes. Local, sécurisé et rapide.
                </p>
            </div>

            {files.length === 0 ? (
                <FileDropzone 
                    onFileSelect={(selectedFiles) => {
                        const validFiles = Array.from(selectedFiles).filter(file => file.type.startsWith('image/'));
                        if (validFiles.length > 0) {
                            setFiles(prev => [...prev, ...validFiles]);
                            setPdfUrl(null);
                        }
                    }}
                    selectedFile={files.length > 0 ? files : null}
                    multiple={true}
                    accept="image/*"
                    label="Sélectionner les images"
                    description="ou déposez vos images ici"
                />
            ) : (
                <div className="max-w-2xl w-full space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6 bg-white dark:bg-[#1e293b] rounded-[32px] shadow-xl border border-slate-100 dark:border-white/5">
                        {files.map((f, i) => (
                            <div key={i} className="relative group aspect-square">
                                <img 
                                    src={URL.createObjectURL(f)} 
                                    alt="preview" 
                                    className="w-full h-full object-cover rounded-2xl border border-slate-100 dark:border-white/10"
                                />
                                <button 
                                    onClick={() => removeFile(i)}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            className="aspect-square border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all gap-2"
                        >
                            <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" multiple className="hidden" />
                            <Plus size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Ajouter</span>
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <button
                            onClick={handleConvert}
                            disabled={isProcessing}
                            className="w-full max-w-md py-5 bg-[#e52424] text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:bg-[#d11f1f] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <span className="relative flex items-center justify-center min-h-[24px] w-full">
                                <span className={`absolute flex items-center gap-3 transition-all duration-300 ${isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                    <Loader2 className="animate-spin" size={24} /> <span>Conversion...</span>
                                </span>
                                <span className={`transition-all duration-300 ${!isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                    <span>Convertir en PDF</span>
                                </span>
                            </span>
                        </button>
                        <button onClick={reset} className="text-slate-400 hover:text-red-500 font-black uppercase text-xs tracking-[0.15em] transition-colors"><span>Tout supprimer</span></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JpgToPdf;
