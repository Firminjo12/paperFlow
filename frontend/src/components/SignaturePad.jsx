import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Check, X, Type, Pen, Upload, Sparkles, Wand2, Clock } from 'lucide-react';

const HANDWRITING_FONTS = [
    { name: 'Satisfy', family: "'Satisfy', cursive" },
    { name: 'Dancing Script', family: "'Dancing Script', cursive" },
    { name: 'Pinyon Script', family: "'Pinyon Script', cursive" },
    { name: 'Parisienne', family: "'Parisienne', cursive" },
    { name: 'Caveat', family: "'Caveat', cursive" }
];

const SignaturePad = ({ onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const [mode, setMode] = useState('draw');
    const [isSaving, setIsSaving] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [points, setPoints] = useState([]);
    const [recentSignatures, setRecentSignatures] = useState([]);

    // Type mode states
    const [typedName, setTypedName] = useState('');
    const [selectedFont, setSelectedFont] = useState(HANDWRITING_FONTS[0]);

    // Upload mode states
    const [uploadedImage, setUploadedImage] = useState(null);
    const fileInputRef = useRef(null);

    // Initialisation robuste du canvas
    useEffect(() => {
        if (mode === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3.5; // Augmenté pour plus de "noirceur"
        }
    }, [mode]);

    // Charger les signatures récentes au montage
    useEffect(() => {
        const saved = localStorage.getItem('recentSignatures');
        if (saved) {
            try {
                setRecentSignatures(JSON.parse(saved));
            } catch (e) {
                console.error("Erreur lecture historique", e);
            }
        }
    }, []);

    const saveRecentSignature = (dataURL) => {
        const current = [...recentSignatures];
        const updated = [dataURL, ...current.filter(s => s !== dataURL)].slice(0, 3);
        setRecentSignatures(updated);
        localStorage.setItem('recentSignatures', JSON.stringify(updated));
    };

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        setHasDrawn(true);
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.strokeStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(x, y);
        setPoints([{ x, y }]);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        if (e.cancelable) e.preventDefault();
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        setPoints(prev => [...prev, { x, y }]);
    };

    const stopDrawing = () => setIsDrawing(false);

    // Amélioration IA Synchrone (Très rapide)
    const runInstantEnhancement = () => {
        if (!canvasRef.current || points.length < 4) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        ctx.lineWidth = 3.8; // Plus épais pour un rendu plus intense
        ctx.stroke();
    };

    const save = () => {
        // Étape 1: Protection immédiate
        if (isSaving) return;

        // Étape 2: Capture synchrone des données AVANT tout changement d'état
        let finalDataURL = null;
        try {
            if (mode === 'draw') {
                if (!canvasRef.current) return;
                runInstantEnhancement(); // Améliore instantanément le trait
                finalDataURL = canvasRef.current.toDataURL('image/png');
            } else if (mode === 'type') {
                if (!typedName) return;
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 600;
                tempCanvas.height = 200;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.font = `bold 65px ${selectedFont.family.replace(/'/g, "")}`;
                tempCtx.fillStyle = '#000000';
                tempCtx.textAlign = 'center';
                tempCtx.textBaseline = 'middle';
                tempCtx.fillText(typedName, 300, 100);
                finalDataURL = tempCanvas.toDataURL('image/png');
            } else if (mode === 'upload') {
                if (!uploadedImage) return;
                finalDataURL = uploadedImage;
            }

            if (finalDataURL) {
                setIsSaving(true);
                saveRecentSignature(finalDataURL);
                // Utiliser setTimeout pour assurer que SignaturePad a fini ses mises à jour d'état
                // avant d'être démonté par le changement d'étape dans le parent.
                setTimeout(() => {
                    onSave(finalDataURL);
                }, 100);
            }
        } catch (err) {
            console.error("Erreur critique SignaturePad:", err);
            alert("Erreur lors de la capture de la signature.");
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-10 glass-card rounded-[2.5rem] w-full max-w-2xl shadow-2xl border-white select-none">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Signer</h2>
                        <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={10} /> AI Enhanced
                        </span>
                    </div>
                    <p className="text-slate-500 font-medium text-sm">Votre tracé est lissé en temps réel.</p>
                </div>
                <button onClick={onCancel} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400">
                    <X size={28} />
                </button>
            </div>

            <div className="flex p-1.5 bg-slate-100/80 rounded-2xl gap-2">
                {['draw', 'type', 'upload'].map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {m === 'draw' ? 'Dessiner' : m === 'type' ? 'Taper' : 'Importer'}
                    </button>
                ))}
            </div>

            <div
                className="border-2 rounded-[1.8rem] h-[360px] relative overflow-hidden shadow-inner group"
                style={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9' }}
            >
                {mode === 'draw' && (
                    <>
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="w-full h-full cursor-crosshair touch-none"
                        />
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <Wand2 size={14} className="text-blue-500" />
                            <span className="text-[10px] font-bold text-slate-600 uppercase">AI Smoothing ON</span>
                        </div>
                    </>
                )}

                {/* Autre modes restent identiques */}
                {mode === 'type' && (
                    <div
                        className="absolute inset-0 p-12 flex flex-col items-center justify-center gap-8"
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        <input
                            type="text"
                            value={typedName}
                            onChange={(e) => setTypedName(e.target.value)}
                            placeholder="Votre nom..."
                            className="w-full text-center text-6xl bg-transparent border-b-2 border-slate-100 outline-none focus:border-blue-500 py-6 font-medium text-slate-900"
                            style={{ fontFamily: selectedFont.family }}
                        />
                        <div className="flex flex-wrap justify-center gap-2">
                            {HANDWRITING_FONTS.map(f => (
                                <button
                                    key={f.name}
                                    onClick={() => setSelectedFont(f)}
                                    className={`px-4 py-2 rounded-xl border-2 text-sm font-medium ${selectedFont.name === f.name ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-50 text-slate-400'}`}
                                    style={{ fontFamily: f.family }}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {mode === 'upload' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer px-10" onClick={() => fileInputRef.current.click()} style={{ backgroundColor: '#ffffff' }}>
                        {uploadedImage ? <img src={uploadedImage} alt="Signature" className="max-h-full object-contain" /> : <div className="text-slate-300 flex flex-col items-center gap-6"><Upload size={48} /><p className="font-bold text-slate-600">Importer une image</p></div>}
                        <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setUploadedImage(ev.target.result); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
                    </div>
                )}
            </div>

            {/* Section Signatures Récentes */}
            {
                recentSignatures.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Clock size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">Récentes</span>
                        </div>
                        <div className="flex gap-3">
                            {recentSignatures.map((sig, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => onSave(sig)}
                                    className="h-16 flex-1 bg-white border-2 border-slate-100 rounded-xl cursor-pointer hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-center overflow-hidden p-2 group"
                                >
                                    <img src={sig} alt="Signature récente" className="max-h-full opacity-60 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            <div className="flex gap-4">
                <button onClick={() => { if (mode === 'draw') { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); setHasDrawn(false); setPoints([]); } else if (mode === 'type') setTypedName(''); else setUploadedImage(null); }} className="px-6 py-4 font-bold text-slate-400 border-2 border-slate-50 rounded-2xl hover:bg-slate-50">
                    <Trash2 size={22} />
                </button>
                <button
                    onClick={save}
                    disabled={isSaving || (mode === 'draw' && !hasDrawn) || (mode === 'type' && !typedName) || (mode === 'upload' && !uploadedImage)}
                    className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 text-lg relative overflow-hidden"
                >
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isSaving ? 'opacity-100 z-10' : 'opacity-0 -z-10'}`}>
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                    <div className={`flex items-center justify-center gap-3 transition-opacity duration-200 ${isSaving ? 'opacity-0 -z-10' : 'opacity-100 z-10'}`}>
                        <Check size={24} />
                        Confirmer la signature
                    </div>
                </button>
            </div>
        </div >
    );
};

export default SignaturePad;
