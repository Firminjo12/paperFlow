import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    FilePlus,
    FileText,
    Trash2,
    GripVertical,
    Link,
    X,
    Download,
    CheckCircle2,
    PenTool,
    Loader2,
    ArrowRight
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import api from '../services/api';
import FileDropzone, { cn } from '../components/FileDropzone';
import GoogleAd from '../components/GoogleAd';
import { ADS_CONFIG } from '../config/ads.config';
import AdLockModal from '../components/AdLockModal';
import PageSlider from '../components/PageSlider';
import { pdfjs as pdfjsLib } from 'react-pdf';
import { uploadToStorage } from '../utils/storage';
import SEO from '../components/SEO';

const MergeTool = ({ onStartSigning }) => {
    const [files, setFiles] = useState([]);
    const [merging, setMerging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [mergedFile, setMergedFile] = useState(null);
    const [finalPdfUrl, setFinalPdfUrl] = useState(null);
    const fileInputRef = useRef(null);
    const { jwt, user } = useAuth();
    const navigate = useNavigate();

    const generateFileThumbnail = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ 
                data: arrayBuffer.slice(0),
                wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/wasm/`,
                verbosity: 0 
            });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            return canvas.toDataURL('image/jpeg', 0.7);
        } catch (error) {
            console.error("Thumbnail error:", error);
            return null;
        }
    };

    const addFiles = async (newFiles) => {
        const pdfFiles = newFiles.filter(file => file.type === 'application/pdf');
        const newFilesWithThumbs = [];
        
        for (const file of pdfFiles) {
            const thumbUrl = await generateFileThumbnail(file);
            newFilesWithThumbs.push({
                id: Math.random().toString(36).substr(2, 9),
                file: file,
                name: file.name,
                url: thumbUrl, // Required for PageSlider
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
            });
        }
        setFiles(prev => [...prev, ...newFilesWithThumbs]);
    };

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(Array.from(e.target.files));
        }
    };

    const mergePDFFiles = async () => {
        if (files.length < 2) return;

        setMerging(true);
        setProgress(10);

        try {
            const mergedPdf = await PDFDocument.create();

            for (let i = 0; i < files.length; i++) {
                const fileBytes = await files[i].file.arrayBuffer();
                const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));

                // Update progress
                setProgress(Math.round(10 + (i + 1) / files.length * 80));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const finalFile = new File([blob], "paperFlow_merged.pdf", { type: 'application/pdf' });
            setMergedFile(finalFile);
            setFinalPdfUrl(url); // Mémoriser l'URL pour téléchargement manuel
            setProgress(100);

            // Log action to DB
            if (jwt) {
                try {
                    // Upload to storage
                    const userId = user?.id || user?._id || 'anonymous';
                    const downloadURL = await uploadToStorage(blob, userId, 'merged');

                    await api.logDocument(jwt, {
                        file_name: "paperFlow_merged.pdf",
                        file_size: blob.size,
                        action: 'merge',
                        pages_count: mergedPdf.getPageCount(),
                        file_url: downloadURL
                    });
                } catch (err) {
                    console.error("Erreur lors du logging de la fusion :", err);
                    // Tentative de log sans URL si storage échoue
                    try {
                        await api.logDocument(jwt, {
                            file_name: "paperFlow_merged.pdf",
                            file_size: blob.size,
                            action: 'merge',
                            pages_count: mergedPdf.getPageCount(),
                            file_url: null
                        });
                    } catch (e) {}
                }
            }

            setMergedFile(new File([blob], "paperFlow_merged.pdf", { type: 'application/pdf' }));

        } catch (error) {
            console.error("Erreur lors de la fusion :", error);
        } finally {
            setMerging(false);
        }
    };

    const resetMerged = () => {
        setFiles([]);
        setMergedFile(null);
        setProgress(0);
    };

    const goToSign = () => {
        if (onStartSigning && mergedFile) {
            onStartSigning(mergedFile);
        }
    };

    const [showAdModal, setShowAdModal] = useState(false);

    if (mergedFile) {
        const handleFinalDownload = () => {
            const link = document.createElement('a');
            link.href = finalPdfUrl;
            link.download = "paperFlow_merged.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50 dark:bg-black/20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-8 p-12 bg-white dark:bg-[#0d1120] rounded-[48px] border border-white/5 shadow-2xl"
                >
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Fusion Terminée !</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Votre fichier fusionné est prêt à être téléchargé.</p>
                    </div>

                    <GoogleAd 
                        slot={ADS_CONFIG.SLOTS.HOME_HERO} 
                        className="my-4" 
                        style={{ display: 'block', height: '100px', width: '100%' }}
                    />

                    <div className="flex flex-col gap-4 pt-4">
                        <button
                            onClick={() => setShowAdModal(true)}
                            className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Download size={20} /> Télécharger PDF
                        </button>

                        <button
                            onClick={resetMerged}
                            className="w-full h-16 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            Fusionner d'autres PDFs
                        </button>
                    </div>
                </motion.div>

                <AdLockModal 
                    isOpen={showAdModal}
                    onClose={() => setShowAdModal(false)}
                    onDownload={handleFinalDownload}
                    fileName="paperFlow_merged.pdf"
                />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-6 md:p-12 space-y-12">
            <SEO 
                title="Fusionner PDF"
                description="Fusionnez plusieurs fichiers PDF en un seul document gratuitement. Glissez-déposez vos fichiers pour les combiner dans l'ordre que vous voulez."
                keywords="fusionner pdf, combiner pdf, joindre pdf, regrouper pdf"
            />
            <div className="max-w-4xl w-full space-y-4 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Fusionnez vos documents <br />
                    <span className="text-blue-600">en un clic.</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                    Combinez plusieurs fichiers PDF dans l'ordre de votre choix. Rapide, sécurisé et 100% local.
                </p>
            </div>

            <div className="max-w-5xl w-full flex flex-col gap-8">
                {/* Custom Dropzone */}
                {files.length === 0 ? (
                    <FileDropzone 
                        onFileSelect={addFiles}
                        selectedFile={files.length > 0 ? files : null}
                        multiple={true}
                        label="Sélectionner les fichiers PDF"
                        description="ou déposez des fichiers PDF ici"
                    />
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <FileText className="text-blue-600" /> {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
                            </h3>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                            >
                                <FilePlus size={16} /> Ajouter plus
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                multiple
                                accept="application/pdf"
                                className="hidden"
                            />
                        </div>

                        <PageSlider 
                            pages={files}
                            mode="organize"
                            onReorder={setFiles}
                            onPageDelete={removeFile}
                        />

                        {/* Progress Bar during Merge */}
                        {merging && (
                            <div key="merge-progress-container" className="space-y-4 pt-8">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-blue-600">Fusion en cours...</p>
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white">Préparation du document final</h4>
                                    </div>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{progress}%</span>
                                </div>
                                <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/50"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Merge Action Button */}
                        <div className="pt-12 text-center">
                            <button
                                onClick={mergePDFFiles}
                                disabled={files.length < 2 || merging}
                                className={`px-12 py-5 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 mx-auto ${files.length < 2
                                        ? 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed shadow-none'
                                        : 'bg-blue-600 text-white shadow-blue-500/30 hover:scale-105 hover:shadow-blue-500/50'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-4 relative min-h-[24px]">
                                    <span className={`flex items-center gap-4 transition-all duration-300 ${merging ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute'}`}>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Fusion en cours...</span>
                                    </span>
                                    <span className={`flex items-center gap-4 transition-all duration-300 ${!merging ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute'}`}>
                                        <Link size={20} />
                                        <span>Fusionner ces documents</span>
                                    </span>
                                </div>
                            </button>
                            {files.length < 2 && !merging && (
                                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ajoutez au moins 2 fichiers pour fusionner</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MergeTool;
