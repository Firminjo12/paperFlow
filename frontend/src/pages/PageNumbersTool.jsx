import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Hash, 
    Settings2, 
    Download, 
    CheckCircle2, 
    Loader2, 
    Layout, 
    RotateCcw,
    X,
    Eye,
    Type,
    Maximize2
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import FileDropzone, { cn } from '../components/FileDropzone';
import PageSlider from '../components/PageSlider';
import { pdfjs as pdfjsLib } from 'react-pdf';

const PageNumbersTool = () => {
    const { jwt } = useAuth();
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [thumbnails, setThumbnails] = useState([]);
    const [numPages, setNumPages] = useState(0);

    // Page Number Settings
    const [position, setPosition] = useState('bottom-center'); // 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'
    const [startNumber, setStartNumber] = useState(1);
    const [format, setFormat] = useState('{n}'); // '{n}', '{n} / {total}', 'Page {n}'
    const [fontSize, setFontSize] = useState(12);
    const [color, setColor] = useState('#666666');
    const [margin, setMargin] = useState(30);

    const generateThumbnails = async (pdfFile) => {
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ 
                data: arrayBuffer,
                wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/wasm/`,
                verbosity: 0 
            });
            const pdf = await loadingTask.promise;
            setNumPages(pdf.numPages);
            
            const thumbs = [];
            const count = Math.min(pdf.numPages, 5); // Only first few for preview
            for (let i = 1; i <= count; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                thumbs.push({ id: `p-${i}`, url: canvas.toDataURL('image/jpeg', 0.7) });
            }
            setThumbnails(thumbs);
        } catch (error) {
            console.error("Thumbnails error:", error);
        }
    };

    const handleFileChange = (selectedFile) => {
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setIsSuccess(false);
            generateThumbnails(selectedFile);
        }
    };

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0.4, g: 0.4, b: 0.4 };
    };

    const addPageNumbers = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();
            const totalPages = pages.length;
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const { r, g, b } = hexToRgb(color);

            for (let i = 0; i < totalPages; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();
                
                const currentPageNum = startNumber + i;
                let text = format
                    .replace('{n}', currentPageNum.toString())
                    .replace('{total}', totalPages.toString());

                const textWidth = font.widthOfTextAtSize(text, fontSize);
                const textHeight = fontSize;

                let x = margin;
                let y = margin;

                // X Position
                if (position.includes('center')) {
                    x = width / 2 - textWidth / 2;
                } else if (position.includes('right')) {
                    x = width - textWidth - margin;
                } else { // left
                    x = margin;
                }

                // Y Position
                if (position.includes('top')) {
                    y = height - margin - textHeight;
                } else { // bottom
                    y = margin;
                }

                page.drawText(text, {
                    x,
                    y,
                    size: fontSize,
                    font,
                    color: rgb(r, g, b),
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            if (jwt) {
                await api.logDocument(jwt, {
                    file_name: `paperFlow_numerote_${file.name}`,
                    file_size: blob.size,
                    action: 'page_numbers',
                    pages_count: totalPages
                });
            }

            setIsSuccess(true);
            setIsProcessing(false);
        } catch (error) {
            console.error("Page numbering error:", error);
            setIsProcessing(false);
            alert("Une erreur est survenue lors de l'ajout des numéros de pages.");
        }
    };

    const reset = () => {
        setFile(null);
        setThumbnails([]);
        setIsSuccess(false);
        setDownloadUrl(null);
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
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight"><span>Numérotation terminée !</span></h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium"><span>Votre PDF est prêt à être téléchargé.</span></p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <a
                            href={downloadUrl}
                            download={`numerote_${file.name}`}
                            className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-3"
                        >
                            <Download size={20} /> <span>Télécharger le PDF</span>
                        </a>
                        <button
                            onClick={reset}
                            className="w-full h-16 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
                        >
                            <RotateCcw size={20} /> <span>Recommencer</span>
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
                            <span>Numéros <br /></span>
                            <span className="text-blue-600 italic">de PAGES.</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-bold uppercase tracking-tighter"><span>Insérez les numéros de pages dans les documents PDF <br/> en toute simplicité. Choisissez leur emplacement.</span></p>
                    </div>
                    <div className="w-full max-w-lg">
                        <FileDropzone 
                            onFileSelect={handleFileChange} 
                            selectedFile={file} 
                            label="Sélectionner le PDF"
                            description="ou déposez le document ici"
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center relative p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
                    <header className="absolute top-0 left-0 right-0 z-40 bg-white/50 dark:bg-[#060912]/50 backdrop-blur-md px-10 py-6 flex justify-between items-center w-full border-b border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight"><span>Configuration Numérotation</span></h2>
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/10 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600">
                                <span>{numPages} pages</span>
                            </span>
                        </div>
                        <button onClick={reset} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-2">
                            <X size={16} /> <span>Changer PDF</span>
                        </button>
                    </header>

                    <div className="w-full h-full flex flex-col lg:flex-row items-center justify-between gap-12 mt-16 overflow-hidden">
                        {/* Preview Slider */}
                        <div className="flex-1 w-full max-w-5xl h-full flex flex-col justify-center items-center gap-6">
                            <div className="w-full bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-200 dark:border-white/5 p-6 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <PageSlider pages={thumbnails} mode="view" />
                                
                                <div className="mt-8 flex justify-center items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <Eye size={14} className="text-blue-500" />
                                    <span>Aperçu des premières pages</span>
                                </div>
                            </div>
                        </div>

                        {/* Options Panel */}
                        <div className="w-full lg:w-[450px] h-full overflow-y-auto custom-scrollbar bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 p-10 rounded-[48px] shadow-2xl space-y-10">
                            
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Layout size={16} className="text-blue-500" /> <span>Emplacement</span>
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'top-left', label: '↖️' }, { id: 'top-center', label: '⬆️' }, { id: 'top-right', label: '↗️' },
                                        { id: 'bottom-left', label: '↙️' }, { id: 'bottom-center', label: '⬇️' }, { id: 'bottom-right', label: '↘️' }
                                    ].map(pos => (
                                        <button
                                            key={pos.id}
                                            onClick={() => setPosition(pos.id)}
                                            className={`h-14 rounded-xl flex items-center justify-center text-lg transition-all ${position === pos.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-black/20 hover:bg-slate-100 text-slate-400'}`}
                                        >
                                            {pos.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Type size={16} className="text-blue-500" /> <span>Format et Style</span>
                                </h3>
                                
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><span>Format du texte</span></p>
                                    <select 
                                        value={format}
                                        onChange={(e) => setFormat(e.target.value)}
                                        className="w-full h-14 px-4 bg-slate-50 dark:bg-black/20 rounded-xl font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                    >
                                        <option value="{n}">1, 2, 3...</option>
                                        <option value="Page {n}">Page 1, Page 2...</option>
                                        <option value="{n} / {total}">1 / 10, 2 / 10...</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><span>Débuter à</span></p>
                                        <input 
                                            type="number" 
                                            value={startNumber} 
                                            onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)} 
                                            className="w-full h-14 px-4 bg-slate-50 dark:bg-black/20 rounded-xl font-bold text-slate-900 dark:text-white border-none outline-none"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><span>Taille police</span></p>
                                        <input 
                                            type="number" 
                                            value={fontSize} 
                                            onChange={(e) => setFontSize(parseInt(e.target.value) || 12)} 
                                            className="w-full h-14 px-4 bg-slate-50 dark:bg-black/20 rounded-xl font-bold text-slate-900 dark:text-white border-none outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><span>Marges ({margin}px)</span></p>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="100" 
                                        step="5" 
                                        value={margin} 
                                        onChange={(e) => setMargin(parseInt(e.target.value))} 
                                        className="w-full h-2 bg-slate-100 dark:bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                                    />
                                </div>
                                
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><span>Couleur</span></p>
                                    <input 
                                        type="color" 
                                        value={color} 
                                        onChange={(e) => setColor(e.target.value)} 
                                        className="w-full h-14 bg-slate-50 dark:bg-black/20 rounded-xl border-none p-1 cursor-pointer" 
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={addPageNumbers}
                                disabled={isProcessing}
                                className="w-full h-20 bg-blue-600 text-white rounded-[28px] font-black text-[13px] uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 relative overflow-hidden"
                            >
                                <div className="flex items-center justify-center gap-4 transition-all duration-300">
                                    <div className="relative w-6 h-6 flex items-center justify-center">
                                        <div className={`absolute transition-all duration-300 transform ${isProcessing ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}`}>
                                            <Loader2 className="animate-spin" size={24} />
                                        </div>
                                        <div className={`absolute transition-all duration-300 transform ${!isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                            <Hash size={24} />
                                        </div>
                                    </div>
                                    <span>{isProcessing ? 'Traitement...' : 'Numéroter les pages'}</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageNumbersTool;
