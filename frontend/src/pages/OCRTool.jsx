import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    FileSearch, 
    FileUp, 
    CheckCircle2, 
    Download, 
    Loader2, 
    History,
    FileCheck,
    Type
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { pdfjs as pdfjsLib } from 'react-pdf';
import FileDropzone, { cn } from '../components/FileDropzone';

// Tesseract sera chargé dynamiquement pour éviter les erreurs de résolution au build

const OCRTool = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [ocrText, setOcrText] = useState('');

    const onFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setIsSuccess(false);
        setOcrText('');
        setProgress(0);
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true);
        setOcrText('');
        setProgress(0);
        setStatus('Initialisation de l\'OCR...');

        try {
            // Utilisation du Tesseract global (chargé via script tag pour stabilité)
            const TesseractObj = window.Tesseract;
            if (!TesseractObj) {
                throw new Error("Tesseract n'a pas pu être chargé. Vérifiez votre connexion.");
            }

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ 
                data: arrayBuffer,
                wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/wasm/`,
                verbosity: 0 
            });
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;
            
            // On crée un scheduler pour le parallélisme
            const scheduler = TesseractObj.createScheduler();
            const numWorkers = Math.min(navigator.hardwareConcurrency || 4, numPages, 4);
            
            setStatus(`Initialisation de ${numWorkers} coeurs de traitement...`);
            for (let i = 0; i < numWorkers; i++) {
                const w = await TesseractObj.createWorker('fra+eng', 1);
                scheduler.addWorker(w);
            }

            const pagePromises = [];
            const results = new Array(numPages);
            let completedPages = 0;

            for (let i = 1; i <= numPages; i++) {
                const pageNum = i;
                const pageTask = (async () => {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.5 }); // Optimisation : 1.5 au lieu de 2.0
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;

                    const imageData = canvas.toDataURL('image/png');
                    
                    // On ajoute la tâche au scheduler
                    const result = await scheduler.addJob('recognize', imageData);
                    
                    completedPages++;
                    setProgress(Math.floor((completedPages / numPages) * 100));
                    setStatus(`Traitement... ${completedPages}/${numPages} pages terminées`);
                    
                    return { 
                        index: pageNum - 1, 
                        text: result.data.text, 
                        words: result.data.words, // Ajout des données de position
                        imageData, 
                        width: viewport.width, 
                        height: viewport.height 
                    };
                })();
                pagePromises.push(pageTask);
            }

            const pageResults = await Promise.all(pagePromises);
            // On trie les résultats par index pour garder l'ordre original
            pageResults.sort((a, b) => a.index - b.index);

            const newPdf = await PDFDocument.create();
            let fullText = '';

            const font = await newPdf.embedFont('Helvetica');

            for (const res of pageResults) {
                fullText += `--- Page ${res.index + 1} ---\n${res.text}\n\n`;
                const newPage = newPdf.addPage([res.width, res.height]);
                const image = await newPdf.embedPng(res.imageData);
                
                // Dessiner l'image originale
                newPage.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: res.width,
                    height: res.height,
                });

                // Dessiner le texte invisible pour la recherche et la mise en page
                for (const word of res.words) {
                    const { x0, y0, x1, y1 } = word.bbox;
                    const wordHeight = y1 - y0;
                    
                    // Conversion des coordonnées (Top-Down -> Bottom-Up)
                    const pdfX = x0;
                    const pdfY = res.height - y1;
                    
                    try {
                        newPage.drawText(word.text, {
                            x: pdfX,
                            y: pdfY,
                            size: Math.max(wordHeight, 2),
                            font: font,
                            opacity: 0, // Invisible
                        });
                    } catch (e) {
                        // Ignorer les caractères incompatibles avec Helvetica standard
                    }
                }
            }

            await scheduler.terminate();
            setOcrText(fullText);

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            setIsSuccess(true);
            setIsProcessing(false);
        } catch (error) {
            console.error("OCR Error:", error);
            setStatus('Erreur lors du traitement OCR.');
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setIsSuccess(false);
        setDownloadUrl(null);
        setOcrText('');
        setProgress(0);
    };

    if (isSuccess) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-[#f3f0f1] dark:bg-[#060912]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl w-full bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl p-10 md:p-16 space-y-10"
                >
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase"><span>OCR Terminé !</span></h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg uppercase tracking-tight"><span>Le texte a été extrait avec succès.</span></p>
                    </div>

                    <div className="bg-slate-50 dark:bg-black/20 rounded-[32px] p-6 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400"><span>Aperçu du texte</span></h3>
                        <div className="max-h-40 overflow-y-auto text-sm text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap">
                            {ocrText}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <a
                            href={downloadUrl}
                            download={`paperFlow_OCR_${file.name}`}
                            className="flex-1 h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Download size={20} /> <span>Télécharger le PDF</span>
                        </a>
                        <button
                            onClick={reset}
                            className="px-8 h-16 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            <History size={20} /> <span>Autre PDF</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#060912]">
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
                    <span>OCR </span><span className="text-blue-600 font-black italic">PDF.</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium tracking-tighter uppercase">
                    <span>Transformez vos documents scannés en texte sélectionnable et indexable. Gratuit et local.</span>
                </p>
            </div>

            {!file ? (
                <FileDropzone 
                    onFileSelect={onFileSelect}
                    selectedFile={file}
                    label="Sélectionner le PDF scanné"
                    description="ou déposez le PDF ici"
                    accept="application/pdf"
                />
            ) : (
                <div className="max-w-2xl w-full bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl p-10 space-y-8">
                    <div className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-black/20 rounded-[32px]">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-600/20 text-blue-600 rounded-2xl flex items-center justify-center">
                            <FileSearch size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-900 dark:text-white truncate">{file.name}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                        </div>
                        <button onClick={reset} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <History size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isProcessing ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400"><span>Progression</span></p>
                                        <p className="text-2xl font-black text-blue-600"><span>{progress}%</span></p>
                                    </div>
                                    <Loader2 className="animate-spin text-blue-600 mb-1" size={24} />
                                </div>
                                <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-blue-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-center text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">{status}</p>
                            </div>
                        ) : (
                            <button
                                onClick={handleProcess}
                                className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <Type size={20} strokeWidth={3} />
                                    <span>Lancer l'OCR</span>
                                </div>
                            </button>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col items-center gap-4 text-center">
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                            <FileCheck size={12} className="text-green-500" /> Traitement 100% Navigateur (Tesseract.js)
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OCRTool;
