import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Globe, 
    ArrowRight, 
    FileText, 
    CheckCircle2, 
    Loader2, 
    Sparkles, 
    Languages,
    AlertCircle,
    Crown,
    Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import api from '../services/api';
import FileDropzone, { cn } from '../components/FileDropzone';
import { pdfjs } from 'react-pdf';

const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'Anglais' },
    { code: 'es', name: 'Espagnol' },
    { code: 'de', name: 'Allemand' },
    { code: 'it', name: 'Italien' },
    { code: 'pt', name: 'Portugais' },
    { code: 'ar', name: 'Arabe' },
    { code: 'zh', name: 'Chinois' },
    { code: 'ja', name: 'Japonais' },
    { code: 'ru', name: 'Russe' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ko', name: 'Coréen' },
    { code: 'mos', name: 'Mooré' },
    { code: 'dyo', name: 'Dioula' }
];

const TranslateTool = () => {
    const [file, setFile] = useState(null);
    const [sourceLang, setSourceLang] = useState('auto');
    const defaultApiConfig = import.meta.env.VITE_TRANSLATE_API === 'libretranslate' ? 'libretranslate' : 'mymemory';
    const [translationProvider, setTranslationProvider] = useState(defaultApiConfig);
    const [targetLang, setTargetLang] = useState('en');
    const [engine, setEngine] = useState('ia'); // 'ia' (DeepL/GPT), 'libre' (LibreTranslate)
    const [libreUrl, setLibreUrl] = useState('https://libretranslate.com'); // Default public instance
    const [apiKey, setApiKey] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showSoon, setShowSoon] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setIsSuccess(false);
            setProgress(0);
        }
    };

    const handleTranslateClick = async () => {
        if (!file) return;
        
        if (engine === 'ia') {
            setShowSoon(true);
            return;
        }

        setIsProcessing(true);
        setProgress(0);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pageCount = pdfDoc.getPageCount();
            
            // Re-render PDF with pdfjs to extract text coordinates/content
            const loadingTask = pdfjs.getDocument({ 
                data: arrayBuffer,
                verbosity: 0 
            });
            const pdf = await loadingTask.promise;
            
            const translatedPdf = await PDFDocument.create();
            
            for (let i = 1; i <= pageCount; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const viewport = page.getViewport({ scale: 1 });
                const newPage = translatedPdf.addPage([viewport.width, viewport.height]);

                // Group text by lines or blocks for better translation? Simple for now: item by item
                // Actually, translating item by item is bad for grammar. 
                // Better: join all text, translate, but then we lose coords.
                // Compromise: 1 translation per page (if small) or 1 per block.
                
                const fullText = textContent.items.map(item => item.str).join(' ');
                
                let translatedText = '';
                
                if (fullText.trim()) {
                    if (translationProvider === 'mymemory') {
                        const source = sourceLang === 'auto' ? 'autodetect' : sourceLang;
                        const langpair = `${source}|${targetLang}`;
                        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(fullText)}&langpair=${langpair}`);
                        const data = await response.json();
                        
                        if (data.responseStatus === 429 || data.responseStatus === 403 || (data.responseDetails && data.responseDetails.includes('FREE TRANSLATIONS'))) {
                            throw new Error("Limite journalière atteinte, réessayez demain");
                        }
                        if (data.responseStatus !== 200) {
                            throw new Error(data.responseDetails || `Erreur MyMemory ${data.responseStatus}`);
                        }
                        translatedText = data.responseData.translatedText;
                    } else {
                        const payload = {
                            q: fullText,
                            source: sourceLang,
                            target: targetLang,
                            format: 'text'
                        };
                        if (apiKey) payload.api_key = apiKey;

                        const response = await fetch(`${libreUrl}/translate`, {
                            method: 'POST',
                            body: JSON.stringify(payload),
                            headers: { 'Content-Type': 'application/json' }
                        });
                        
                        if (!response.ok) {
                            const errData = await response.json().catch(() => ({}));
                            throw new Error(errData.error || `Erreur HTTP ${response.status}`);
                        }
                        const data = await response.json();
                        translatedText = data.translatedText;
                    }
                    
                    // Draw translated text (very basic approach: centered)
                    newPage.drawText(translatedText, {
                        x: 50,
                        y: viewport.height - 100,
                        size: 12,
                        maxWidth: viewport.width - 100,
                        lineHeight: 15
                    });
                }
                
                setProgress(Math.round((i / pageCount) * 100));
            }

            const pdfBytes = await translatedPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            // Log action if user is logged in
            const { jwt } = JSON.parse(localStorage.getItem('auth') || '{}');
            if (jwt) {
                try {
                    await api.logDocument(jwt, {
                        file_name: file.name.replace('.pdf', '_translated.pdf'),
                        file_size: blob.size,
                        action: 'translate',
                        pages_count: pageCount
                    });
                } catch (e) {
                    console.error("Logging error:", e);
                }
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name.replace('.pdf', '_translated.pdf');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setIsSuccess(true);
        } catch (error) {
            console.error('Translation error:', error);
            alert(`Erreur lors de la traduction : ${error.message}\n\nVérifiez votre clé API dans les paramètres.`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#060912] pt-20 pb-12 px-6">
            {/* Soon Modal */}
            <AnimatePresence>
                {showSoon && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowSoon(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-[#0c1120] rounded-[32px] p-10 max-w-md w-full shadow-2xl text-center space-y-6 border border-slate-100 dark:border-white/5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-600">
                                {engine === 'ia' ? <Sparkles size={40} /> : <Globe size={40} />}
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {engine === 'ia' ? 'IA en préparation !' : 'LibreTranslate arrive !'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    {engine === 'ia' 
                                        ? "La traduction haute précision par IA est en cours de déploiement. Elle sera disponible très bientôt."
                                        : `L'intégration avec LibreTranslate (${new URL(libreUrl).hostname}) est en cours de développement.`
                                    } Revenez nous voir !
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowSoon(false)}
                                className="w-full py-4 bg-slate-900 dark:bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-500/20"
                            >
                                J'ai compris
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-[#0c1120] rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6 border border-slate-100 dark:border-white/5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Configuration API</h3>
                                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                                    <AlertCircle size={20} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fournisseur de traduction</label>
                                    <select 
                                        value={translationProvider} 
                                        onChange={(e) => setTranslationProvider(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/10 rounded-xl text-slate-700 dark:text-white font-bold focus:border-red-500 transition-all shadow-sm"
                                    >
                                        <option value="mymemory">MyMemory (Gratuit, 1000 mots/jour)</option>
                                        <option value="libretranslate">LibreTranslate (Serveur privé ou clé API)</option>
                                    </select>
                                </div>
                                {translationProvider === 'libretranslate' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instance LibreTranslate</label>
                                        <input 
                                            type="text" 
                                            value={libreUrl} 
                                            onChange={(e) => setLibreUrl(e.target.value)}
                                            placeholder="https://votre-instance.com"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/10 rounded-xl text-slate-700 dark:text-white font-bold focus:border-red-500 transition-all shadow-sm"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clé API (Optionnelle / Selon instance)</label>
                                    <input 
                                        type="password" 
                                        value={apiKey} 
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="Votre clé API"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/10 rounded-xl text-slate-700 dark:text-white font-bold focus:border-red-500 transition-all shadow-sm"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                                    * L'utilisation de MyMemory est gratuite (limite ~1000 mots/j). LibreTranslate requiert votre propre instance backend ou une clé.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowSettings(false)}
                                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-500/20"
                            >
                                Enregistrer
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 pr-2 pl-4 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold mb-6 border border-red-100 dark:border-red-500/20 shadow-sm"
                    >
                        <Sparkles size={14} />
                        <span>Moteur de traduction</span>
                        <div className="flex bg-white dark:bg-slate-900 rounded-full p-0.5 ml-2 border border-red-100 dark:border-white/5">
                            <button 
                                onClick={() => setEngine('ia')}
                                className={cn("px-3 py-1 rounded-full transition-all", engine === 'ia' ? "bg-red-600 text-white" : "text-slate-400 hover:text-slate-600")}
                            >IA</button>
                            <button 
                                onClick={() => setEngine('libre')}
                                className={cn("px-3 py-1 rounded-full transition-all", engine === 'libre' ? "bg-red-600 text-white" : "text-slate-400 hover:text-slate-600")}
                            >Libre</button>
                        </div>
                        {engine === 'libre' && (
                            <button onClick={() => setShowSettings(true)} className="ml-1 p-1 hover:bg-red-100 rounded-full text-red-600">
                                <Settings size={14} />
                            </button>
                        )}
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight"
                    >
                        Traduire <span className="text-red-600">le PDF</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium"
                    >
                        Traduisez vos documents via {engine === 'ia' ? "nos serveurs IA" : "LibreTranslate (OpenSource)"} tout en conservant la mise en page originale.
                    </motion.p>
                </div>

                {/* Main Content */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-[#0c1120] rounded-[24px] shadow-2xl shadow-slate-200 dark:shadow-black/40 border border-slate-100 dark:border-white/5 overflow-hidden"
                >
                    {/* Language Selectors */}
                    <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                            {/* Source Language */}
                            <div className="w-full md:w-1/2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                    Document Original
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-red-500 transition-colors">
                                        <Globe size={18} />
                                    </div>
                                    <select 
                                        value={sourceLang}
                                        onChange={(e) => setSourceLang(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#151c2c] border-2 border-slate-100 dark:border-white/5 rounded-2xl text-slate-700 dark:text-white font-bold appearance-none focus:border-red-500 transition-all cursor-pointer shadow-sm"
                                    >
                                        <option value="auto">Détecter automatiquement</option>
                                        {languages.map(lang => (
                                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Arrow Spacer */}
                            <div className="hidden md:flex mt-6 bg-white dark:bg-[#151c2c] p-3 rounded-full border border-slate-100 dark:border-white/5 shadow-sm">
                                <ArrowRight size={20} className="text-red-600" />
                            </div>

                            {/* Target Language */}
                            <div className="w-full md:w-1/2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                    Traduire vers
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-red-500 transition-colors">
                                        <Languages size={18} />
                                    </div>
                                    <select 
                                        value={targetLang}
                                        onChange={(e) => setTargetLang(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#151c2c] border-2 border-slate-200 dark:border-white/10 rounded-2xl text-slate-700 dark:text-white font-bold appearance-none focus:border-red-500 transition-all cursor-pointer shadow-sm"
                                    >
                                        {languages.map(lang => (
                                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dropzone Area */}
                    <div className="p-10">
                        {!file ? (
                            <FileDropzone 
                                onFileSelect={(selectedFile) => setFile(selectedFile)}
                                maxFiles={1}
                                accept="application/pdf"
                                title="Déposez votre document ici"
                                description="Tous les formats PDF sont acceptés. Max 50 Mo."
                            />
                        ) : (
                            <div className="relative p-8 rounded-[20px] bg-red-50/30 dark:bg-red-500/5 border-2 border-dashed border-red-200 dark:border-red-500/20 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-white dark:bg-[#1a2335] rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/10 mb-6">
                                    <FileText size={40} className="text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{file.name}</h3>
                                <p className="text-slate-500 mb-8 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} Mo</p>
                                
                                <button 
                                    onClick={() => setFile(null)}
                                    className="text-red-600 font-bold hover:underline"
                                >
                                    Changer de document
                                </button>
                            </div>
                        )}

                        {/* Action Area */}
                        <div className="mt-10 pt-10 border-t border-slate-100 dark:border-white/5 flex flex-col items-center">
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-6 rounded-2xl flex items-start gap-4 mb-8 max-w-lg">
                                <div className="bg-amber-100 dark:bg-amber-500/20 p-2 rounded-lg shrink-0">
                                    <Crown size={20} className="text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="text-amber-800 dark:text-amber-400 font-black text-sm uppercase tracking-widest mb-1">Fonctionnalité Premium</h4>
                                    <p className="text-amber-700/80 dark:text-amber-400/60 text-sm leading-relaxed font-medium">
                                        La traduction par IA est en cours de développement. Elle sera disponible prochainement en exclusivité pour nos utilisateurs Premium.
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={handleTranslateClick}
                                disabled={!file || isProcessing}
                                className={cn(
                                    "group relative px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-4 overflow-hidden",
                                    file && !isProcessing
                                        ? "bg-red-600 text-white shadow-red-500/20 hover:scale-105 active:scale-95" 
                                        : "bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
                                )}
                            >
                                <div className="flex items-center justify-center gap-4 transition-all duration-300">
                                    <div className="relative w-6 h-6 flex items-center justify-center">
                                        <div className={`absolute transition-all duration-300 transform ${isProcessing ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}`}>
                                            <Loader2 className="animate-spin" size={24} />
                                        </div>
                                        <div className={`absolute transition-all duration-300 transform ${!isProcessing ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                            <Sparkles size={24} />
                                        </div>
                                    </div>
                                    <span>{isProcessing ? `Traduction ${progress}%` : isSuccess ? "Document Traduit" : "Traduire maintenant"}</span>
                                </div>
                                {isProcessing && (
                                    <motion.div 
                                        className="absolute bottom-0 left-0 h-1 bg-white/30"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                    />
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* FAQ / Info */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/40 dark:bg-white/[0.02] p-6 rounded-2xl border border-white dark:border-white/[0.05]">
                        <h4 className="text-slate-900 dark:text-white font-bold mb-3 flex items-center gap-2">
                            <Languages size={18} className="text-red-600" />
                            Qualité de traduction
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Nous utilisons les modèles d'IA les plus avancés (GPT-4 et DeepL) pour garantir une précision linguistique inégalée et un respect total du contexte.
                        </p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/[0.02] p-6 rounded-2xl border border-white dark:border-white/[0.05]">
                        <h4 className="text-slate-900 dark:text-white font-bold mb-3 flex items-center gap-2">
                            <Globe size={18} className="text-red-600" />
                            Mise en page préservée
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Contrairement aux traducteurs classiques, SignFlow reconstruit votre PDF pour que le texte traduit occupe exactement la même place que l'original.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TranslateTool;
