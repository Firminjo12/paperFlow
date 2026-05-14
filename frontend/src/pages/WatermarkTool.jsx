import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Type, 
    Image as ImageIcon, 
    Settings2, 
    Download, 
    CheckCircle2, 
    Loader2, 
    Layout, 
    RotateCcw,
    Trash2,
    Plus,
    X,
    Maximize2,
    Eye
} from 'lucide-react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import FileDropzone, { cn } from '../components/FileDropzone';
import PageSlider from '../components/PageSlider';
import { pdfjs as pdfjsLib } from 'react-pdf';

const WatermarkTool = () => {
    const { jwt } = useAuth();
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [thumbnails, setThumbnails] = useState([]);
    const [numPages, setNumPages] = useState(0);

    // Watermark Settings
    const [type, setType] = useState('text'); // 'text' | 'image'
    const [text, setText] = useState('paperFlow');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [opacity, setOpacity] = useState(0.5);
    const [rotation, setRotation] = useState(45);
    const [fontSize, setFontSize] = useState(50);
    const [color, setColor] = useState('#ff0000');
    const [position, setPosition] = useState('center'); // 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'

    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

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

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    };

    const applyWatermark = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const rgbColor = hexToRgb(color);

            let watermarkImage = null;
            if (type === 'image' && image) {
                const imageBytes = await image.arrayBuffer();
                if (image.type === 'image/jpeg' || image.type === 'image/jpg') {
                    watermarkImage = await pdfDoc.embedJpg(imageBytes);
                } else {
                    watermarkImage = await pdfDoc.embedPng(imageBytes);
                }
            }

            for (const page of pages) {
                const { width, height } = page.getSize();
                
                if (type === 'text') {
                    const textWidth = font.widthOfTextAtSize(text, fontSize);
                    const textHeight = fontSize;
                    
                    let x = 0, y = 0;
                    if (position === 'center') {
                        x = width / 2 - textWidth / 2;
                        y = height / 2 - textHeight / 2;
                    } else if (position === 'top-left') {
                        x = 50; y = height - 50;
                    } else if (position === 'top-right') {
                        x = width - textWidth - 50; y = height - 50;
                    } else if (position === 'bottom-left') {
                        x = 50; y = 50;
                    } else if (position === 'bottom-right') {
                        x = width - textWidth - 50; y = 50;
                    }

                    page.drawText(text, {
                        x,
                        y,
                        size: fontSize,
                        font,
                        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                        opacity: opacity,
                        rotate: degrees(rotation),
                    });
                } else if (watermarkImage) {
                    const imgDims = watermarkImage.scale(0.5);
                    let x = 0, y = 0;
                    if (position === 'center') {
                        x = width / 2 - imgDims.width / 2;
                        y = height / 2 - imgDims.height / 2;
                    } else if (position === 'top-left') {
                        x = 50; y = height - imgDims.height - 50;
                    } else if (position === 'top-right') {
                        x = width - imgDims.width - 50; y = height - imgDims.height - 50;
                    } else if (position === 'bottom-left') {
                        x = 50; y = 50;
                    } else if (position === 'bottom-right') {
                        x = width - imgDims.width - 50; y = 50;
                    }

                    page.drawImage(watermarkImage, {
                        x,
                        y,
                        width: imgDims.width,
                        height: imgDims.height,
                        opacity: opacity,
                        rotate: degrees(rotation),
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            if (jwt) {
                await api.logDocument(jwt, {
                    file_name: "paperFlow_watermark.pdf",
                    file_size: blob.size,
                    action: 'watermark',
                    pages_count: pdfDoc.getPageCount()
                });
            }

            setIsSuccess(true);
            setIsProcessing(false);
        } catch (error) {
            console.error("Watermark error:", error);
            setIsProcessing(false);
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
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight"><span>Filigrane appliqué !</span></h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium"><span>Votre PDF est prêt à être téléchargé.</span></p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <a
                            href={downloadUrl}
                            download="paperFlow_watermark.pdf"
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
                            <span>Filigrane <br /></span>
                            <span className="text-[#e52424] italic">PROtégez vos PDF.</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-bold uppercase tracking-tighter"><span>Ajoutez un texte ou une image en filigrane <br/> sur toutes les pages de façon professionnelle.</span></p>
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
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight"><span>Configuration Filigrane</span></h2>
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
                                    Aperçu dynamique des premières pages
                                </div>
                            </div>
                        </div>

                        {/* Options Panel */}
                        <div className="w-full lg:w-[450px] h-full overflow-y-auto custom-scrollbar bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 p-10 rounded-[48px] shadow-2xl space-y-10">
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Layout size={16} className="text-blue-500" /> <span>Type de filigrane</span>
                                </h3>
                                <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                                    <button 
                                        onClick={() => setType('text')}
                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${type === 'text' ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Type size={14} className="inline mr-2" /> <span>Texte</span>
                                    </button>
                                    <button 
                                        onClick={() => setType('image')}
                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${type === 'image' ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <ImageIcon size={14} className="inline mr-2" /> <span>Image</span>
                                    </button>
                                </div>
                            </div>

                            {type === 'text' ? (
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Contenu du texte</h3>
                                    <input 
                                        type="text" 
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        className="w-full h-16 px-6 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-blue-600 rounded-3xl font-bold text-lg text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Filigrane..."
                                    />
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taille</p>
                                            <input type="number" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 dark:bg-black/20 rounded-xl font-bold text-slate-900 dark:text-white border-none" />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couleur</p>
                                            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-14 bg-slate-50 dark:bg-black/20 rounded-xl border-none p-1 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Choisir Image</h3>
                                    {imagePreview ? (
                                        <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 group">
                                            <img src={imagePreview} className="w-full h-full object-contain" alt="Watermark preview" />
                                            <button 
                                                onClick={() => { setImage(null); setImagePreview(null); }}
                                                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => imageInputRef.current?.click()}
                                            className="w-full aspect-video border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-600/5 transition-all text-slate-400 group"
                                        >
                                            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <Plus size={24} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Uploader Logo / Image</span>
                                        </button>
                                    )}
                                    <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                </div>
                            )}

                            <div className="space-y-10 border-t border-slate-100 dark:border-white/5 pt-10">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Positionnement</h3>
                                        <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 dark:bg-blue-600/10 px-2 py-0.5 rounded-md">{position}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'top-left', label: '↖️' }, { id: 'top-center', label: '⬆️', disabled: true }, { id: 'top-right', label: '↗️' },
                                            { id: 'left', label: '⬅️', disabled: true }, { id: 'center', label: '⏺️' }, { id: 'right', label: '➡️', disabled: true },
                                            { id: 'bottom-left', label: '↙️' }, { id: 'bottom-center', label: '⬇️', disabled: true }, { id: 'bottom-right', label: '↘️' }
                                        ].map(pos => (
                                            <button
                                                key={pos.id}
                                                disabled={pos.disabled}
                                                onClick={() => setPosition(pos.id)}
                                                className={`h-14 rounded-xl flex items-center justify-center text-lg transition-all ${position === pos.id ? 'bg-blue-600 text-white shadow-lg' : pos.disabled ? 'opacity-20 cursor-not-allowed' : 'bg-slate-50 dark:bg-black/20 hover:bg-slate-100 text-slate-400'}`}
                                            >
                                                {pos.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Transparence</h3>
                                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{Math.round(opacity * 100)}%</span>
                                    </div>
                                    <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full h-2 bg-slate-100 dark:bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Rotation</h3>
                                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{rotation}°</span>
                                    </div>
                                    <input type="range" min="-180" max="180" step="1" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 dark:bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                </div>

                                 <button 
                                    onClick={applyWatermark}
                                    disabled={isProcessing || (type === 'image' && !image)}
                                    className="w-full h-20 bg-blue-600 text-white rounded-[28px] font-black text-[13px] uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-center gap-4 transition-all duration-300">
                                        <div className="relative w-6 h-6 flex items-center justify-center">
                                            <div className={`absolute transition-all duration-300 transform ${isProcessing ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}`}>
                                                <Loader2 className="animate-spin" size={24} />
                                            </div>
                                            <div className={`absolute transition-all duration-300 transform ${!isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                                <Settings2 size={24} />
                                            </div>
                                        </div>
                                        <span>{isProcessing ? 'Application...' : 'Appliquer Filigrane'}</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WatermarkTool;
