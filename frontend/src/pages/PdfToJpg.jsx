import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Image as ImageIcon, 
  CheckCircle2, 
  Loader2,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FileDropzone, { cn } from '../components/FileDropzone';
import { pdfjs } from 'react-pdf';

// La configuration du worker est gérée globalement dans main.jsx

const PdfToJpg = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [images, setImages] = useState([]); // Liste des dataURLs des images
    const [quality, setQuality] = useState(0.8);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
                setError("Le fichier est trop lourd (max 50 Mo).");
                return;
            }
            setFile(selectedFile);
            setImages([]);
            setError(null);
            setProgress(0);
        } else {
            setError("Veuillez sélectionner un fichier PDF valide.");
        }
    };

    const handleConvert = async () => {
        if (!file) return;
        setIsProcessing(true);
        setImages([]);
        setProgress(0);
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ 
                data: arrayBuffer,
                wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`
            });
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;
            const tempImages = [];

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 }); // Haute résolution
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                // Conversion du canvas en JPG avec la qualité choisie
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                tempImages.push(dataUrl);
                setProgress(Math.round((i / totalPages) * 100));
            }

            setImages(tempImages);
        } catch (err) {
            console.error(err);
            setError("Une erreur est survenue lors de la conversion du PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadImage = (url, index) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `page-${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAll = () => {
        images.forEach((url, i) => {
            // Un petit délai pour éviter de bloquer le navigateur sur les gros PDF
            setTimeout(() => downloadImage(url, i), i * 200);
        });
    };

    const reset = () => {
        setFile(null);
        setImages([]);
        setError(null);
        setProgress(0);
    };

    if (images.length > 0) {
        return (
            <div className="flex-1 flex flex-col items-center p-8 bg-[#f3f0f1] dark:bg-[#0f172a] space-y-8">
                <div className="max-w-4xl w-full text-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white"><span>Conversion terminée !</span></h2>
                    <p className="text-slate-500 font-bold"><span>{images.length} page(s) convertie(s) en JPG.</span></p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={downloadAll}
                        className="px-8 h-14 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center gap-3"
                    >
                        <Download size={20} /> Tout télécharger
                    </button>
                    <button
                        onClick={reset}
                        className="px-8 h-14 bg-white dark:bg-white/5 text-slate-600 dark:text-white border border-slate-200 dark:border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        <span>Nouveau PDF</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                    {images.map((img, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-[#1e293b] p-4 rounded-[32px] shadow-xl border border-slate-100 dark:border-white/5 space-y-4 group"
                        >
                            <img src={img} alt={`Page ${i + 1}`} className="w-full h-auto rounded-2xl shadow-sm" />
                            <div className="flex items-center justify-between px-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Page {i + 1}</span>
                                <button 
                                    onClick={() => downloadImage(img, i)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                                >
                                    <Download size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#0f172a]">
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    PDF en JPG
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                    Convertissez chaque page de votre PDF en image JPG de haute qualité sans aucun envoi sur serveur.
                </p>
            </div>

            {error && (
                <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-center font-bold text-sm">
                    {error}
                </div>
            )}

            {!file ? (
                <FileDropzone 
                    onFileSelect={(selectedFile) => {
                        if (selectedFile && selectedFile.type === 'application/pdf') {
                            if (selectedFile.size > 50 * 1024 * 1024) {
                                setError("Le fichier est trop lourd (max 50 Mo).");
                                return;
                            }
                            setFile(selectedFile);
                            setImages([]);
                            setError(null);
                            setProgress(0);
                        } else {
                            setError("Veuillez sélectionner un fichier PDF valide.");
                        }
                    }}
                    selectedFile={file}
                    label="Sélectionner le fichier PDF"
                    description="ou déposez le PDF ici"
                />
            ) : (
                <div className="max-w-md w-full bg-white dark:bg-[#1e293b] p-10 rounded-[48px] shadow-2xl text-center space-y-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-5 bg-yellow-50 dark:bg-yellow-500/10 rounded-[24px] text-yellow-500">
                            <ImageIcon size={56} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black text-slate-900 dark:text-white truncate w-full px-4">{file.name}</h4>
                            <p className="text-xs text-slate-400 font-bold">{(file.size / (1024 * 1024)).toFixed(2)} Mo</p>
                        </div>
                    </div>

                    <div className="space-y-4 px-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Qualité JPG</span>
                            <span className="text-blue-600">{Math.round(quality * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0.1" max="1" step="0.1" 
                            value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    <button
                        onClick={handleConvert}
                        disabled={isProcessing}
                        className="w-full py-5 bg-[#e52424] text-white rounded-3xl font-black uppercase tracking-widest hover:bg-[#d11f1f] shadow-xl shadow-red-500/20 transition-all flex flex-col items-center justify-center gap-2"
                    >
                        <span className="relative flex items-center justify-center min-h-[40px] w-full">
                            <span className={`absolute flex flex-col items-center gap-1 transition-all duration-300 ${isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                <Loader2 className="animate-spin" size={24} />
                                <span className="text-[10px]">Traitement : {progress}%</span>
                            </span>
                            <span className={`transition-all duration-300 ${!isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                <span>Lancer la conversion</span>
                            </span>
                        </span>
                    </button>
                    <button onClick={reset} className="text-slate-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest"><span>Changer de PDF</span></button>
                </div>
            )}
        </div>
    );
};

export default PdfToJpg;
