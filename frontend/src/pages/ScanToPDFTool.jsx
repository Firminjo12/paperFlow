import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Camera, 
    Download, 
    CheckCircle2, 
    Loader2, 
    FileSearch,
    RefreshCw,
    X,
    Plus
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import SEO from '../components/SEO';

const ScanToPDFTool = () => {
    const [stream, setStream] = useState(null);
    const [capturedImages, setCapturedImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [error, setError] = useState(null);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const startCamera = async () => {
        setIsCameraActive(true);
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setError("Accès caméra refusé ou non disponible. Assurez-vous d'avoir autorisé l'appareil.");
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraActive(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImages(prev => [...prev, imageData]);
    };

    const removeImage = (index) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleProcess = async () => {
        if (capturedImages.length === 0) return;
        setIsProcessing(true);

        try {
            const pdfDoc = await PDFDocument.create();
            
            for (const imgUrl of capturedImages) {
                const image = await pdfDoc.embedJpg(imgUrl);
                const { width, height } = image.scale(1);
                const page = pdfDoc.addPage([width, height]);
                
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            setTimeout(() => {
                setIsSuccess(true);
                setIsProcessing(false);
                stopCamera();
            }, 800);
        } catch (error) {
            console.error("Scan Error:", error);
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setCapturedImages([]);
        setIsSuccess(false);
        setDownloadUrl(null);
        startCamera();
    };

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

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
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">Numérisation Terminée !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg uppercase tracking-tight">Votre document ({capturedImages.length} {capturedImages.length > 1 ? 'pages' : 'page'}) a été converti en PDF.</p>
                    </div>

                    <div className="rounded-[32px] overflow-hidden border border-slate-100 dark:border-white/5 shadow-2xl bg-slate-50 dark:bg-black/20 p-6 flex flex-wrap gap-4 justify-center items-center h-64 overflow-y-auto">
                        {capturedImages.map((img, index) => (
                            <div key={index} className="w-32 h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md relative">
                                <img src={img} alt={`Scanned ${index+1}`} className="w-full h-full object-cover" />
                                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-lg">
                                    {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <a
                            href={downloadUrl}
                            download={`paperFlow_Scan_${new Date().getTime()}.pdf`}
                            className="flex-1 h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Download size={20} /> <span>Télécharger le PDF</span>
                        </a>
                        <button
                            onClick={reset}
                            className="px-8 h-16 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            <RefreshCw size={20} /> <span>Nouveau Scanner</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12 bg-[#f3f0f1] dark:bg-[#060912]">
            <SEO 
                title="Scanner au format PDF"
                description="Numérisez vos documents papier en fichiers PDF numériques directement depuis votre navigateur ou mobile. Capturez plusieurs pages et générez votre PDF gratuitement."
                keywords="scanner pdf, numériser pdf, capture doc pdf, cam to pdf"
            />
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
                    Scanner au format <span className="text-blue-600 font-black italic">PDF.</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium tracking-tighter uppercase">
                    Utilisez votre caméra pour capturer et convertir vos documents en PDF numériques instantanément. Vous pouvez ajouter plusieurs pages.
                </p>
            </div>

            {!isCameraActive && capturedImages.length === 0 ? (
                <div className="max-w-xl w-full">
                    {error && (
                        <div className="mb-8 p-6 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-[32px] text-center font-bold text-sm border border-red-100 dark:border-red-500/20 uppercase tracking-tighter">
                            {error}
                        </div>
                    )}
                    <button
                        onClick={startCamera}
                        className="w-full py-12 bg-white dark:bg-[#0d1120] border-4 border-dashed border-slate-200 dark:border-white/5 rounded-[48px] shadow-2xl group transition-all hover:border-blue-500 active:scale-[0.98]"
                    >
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-600/10 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-all">
                                <Camera size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Activer la Caméra</h3>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Scanner des pages</p>
                            </div>
                        </div>
                    </button>
                </div>
            ) : (
                <div className="max-w-4xl w-full flex flex-col lg:flex-row gap-10 items-start">
                    {/* Viewport Area */}
                    <div className="flex-1 bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl p-4 md:p-6 w-full relative flex flex-col">
                        <div className="aspect-[3/4] rounded-[36px] overflow-hidden bg-black relative flex-1 min-h-[400px]">
                            {isCameraActive ? (
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-8 text-center space-y-4">
                                    <Camera size={48} className="text-slate-700" />
                                    <p className="text-slate-400 font-medium">La caméra est désactivée.</p>
                                </div>
                            )}
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-x-0 bottom-0 p-8 flex justify-center pointer-events-none">
                                {isCameraActive && (
                                    <button
                                        onClick={capturePhoto}
                                        className="w-20 h-20 bg-white rounded-full border-8 border-white/30 shadow-2xl pointer-events-auto active:scale-90 transition-all flex items-center justify-center overflow-hidden relative group"
                                    >
                                        <div className="w-16 h-16 bg-white border-2 border-slate-900/10 rounded-full group-hover:scale-95 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Thumbnails Row */}
                        {capturedImages.length > 0 && (
                            <div className="mt-6 flex gap-4 overflow-x-auto pb-4 px-2 snap-x items-center">
                                {capturedImages.map((img, index) => (
                                    <div key={index} className="relative flex-shrink-0 w-24 h-32 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-lg snap-center group">
                                        <img src={img} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => removeImage(index)}
                                                className="bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 active:scale-95"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-lg">
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-8 flex items-center justify-between pb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center">
                                    <FileSearch size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Scanner</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {capturedImages.length > 0 ? `${capturedImages.length} page(s) capturée(s)` : 'Prêt pour capture'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => {
                                stopCamera();
                                setCapturedImages([]);
                                setError(null);
                            }} className="p-3 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 dark:bg-white/5 rounded-2xl">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Controls Side Panel */}
                    <AnimatePresence>
                        {capturedImages.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="w-full lg:w-[350px] space-y-6 lg:sticky lg:top-24"
                            >
                                <div className="p-8 bg-white dark:bg-[#0d1120] rounded-[40px] border border-slate-100 dark:border-white/5 shadow-2xl space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Vérification</h3>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Vous avez capturé {capturedImages.length} page(s). Vous pouvez en ajouter d'autres ou générer le PDF.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <button
                                            onClick={handleProcess}
                                            disabled={isProcessing || capturedImages.length === 0}
                                            className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                        >
                                            <span className="flex items-center justify-center gap-4 relative min-h-[24px]">
                                                <span className={`flex items-center gap-4 transition-all duration-300 ${isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute'}`}>
                                                    <Loader2 className="animate-spin" size={20} />
                                                    <span>Conversion...</span>
                                                </span>
                                                <span className={`flex items-center gap-4 transition-all duration-300 ${!isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute'}`}>
                                                    <Download size={20} strokeWidth={3} />
                                                    <span>Générer le PDF</span>
                                                </span>
                                            </span>
                                        </button>
                                        
                                        {!isCameraActive && (
                                            <button
                                                onClick={startCamera}
                                                className="w-full py-6 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 hover:bg-green-200 dark:hover:bg-green-500/20"
                                            >
                                                <Plus size={20} />
                                                <span>Ajouter une page</span>
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={() => {
                                                setCapturedImages([]);
                                                startCamera();
                                            }}
                                            className="w-full py-6 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                        >
                                            <RefreshCw size={20} />
                                            <span>Tout Effacer</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default ScanToPDFTool;
