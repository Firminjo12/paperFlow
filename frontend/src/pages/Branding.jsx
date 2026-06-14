import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    Palette, 
    Upload, 
    RotateCcw, 
    Check, 
    Image as ImageIcon, 
    Trash2,
    Eye,
    Layout,
    Plus
} from 'lucide-react';
import { useBranding } from '../contexts/BrandingContext';

const Branding = () => {
    const { primaryColor, setPrimaryColor, logo, setLogo, resetBranding } = useBranding();
    const [previewColor, setPreviewColor] = useState(primaryColor);
    const fileInputRef = useRef(null);

    const handleColorChange = (e) => {
        const color = e.target.value;
        setPreviewColor(color);
        setPrimaryColor(color);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const popularColors = [
        '#2563eb', // Blue (Original)
        '#e11d48', // Rose
        '#059669', // Emerald
        '#7c3aed', // Violet
        '#ea580c', // Orange
        '#0891b2', // Cyan
        '#4f46e5', // Indigo
        '#dc2626', // Red
    ];

    return (
        <div className="min-h-screen pt-32 pb-20 px-6 bg-slate-50 dark:bg-[#060912] font-sans">
            <div className="max-w-6xl mx-auto space-y-12">
                <header className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none flex items-center gap-4">
                        Mode <span className="text-blue-600">PRO.</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-bold max-w-2xl">
                        Personnalisez votre plateforme paperFlow pour qu'elle ressemble à votre marque. Étonnez vos clients avec une interface à vos couleurs.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Settings Panel */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Primary Color Section */}
                        <section className="p-10 bg-white dark:bg-[#0d1120] rounded-[40px] border border-slate-100 dark:border-white/5 shadow-xl space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600">
                                    <Palette size={24} />
                                </div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tight">Couleur de la marque</h2>
                            </div>

                            <div className="space-y-6">
                                <p className="text-sm font-bold text-slate-500">Choisissez votre couleur principale. Elle sera appliquée aux boutons, liens et indicateurs d'état.</p>
                                
                                <div className="flex flex-wrap gap-4">
                                    {popularColors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => {
                                                setPreviewColor(color);
                                                setPrimaryColor(color);
                                            }}
                                            className={`w-12 h-12 rounded-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center`}
                                            style={{ backgroundColor: color }}
                                        >
                                            {primaryColor === color && <Check size={20} className="text-white" />}
                                        </button>
                                    ))}
                                    <div className="relative group">
                                        <input 
                                            type="color" 
                                            value={previewColor}
                                            onChange={handleColorChange}
                                            className="w-12 h-12 rounded-2xl cursor-pointer opacity-0 absolute inset-0 z-10"
                                        />
                                        <div 
                                            className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400"
                                            style={{ backgroundColor: !popularColors.includes(previewColor) ? previewColor : 'transparent' }}
                                        >
                                            {!popularColors.includes(previewColor) ? <Check size={20} className="text-white" /> : <Plus size={20} />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Logo Section */}
                        <section className="p-10 bg-white dark:bg-[#0d1120] rounded-[40px] border border-slate-100 dark:border-white/5 shadow-xl space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-600">
                                    <ImageIcon size={24} />
                                </div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tight">Identité Visuelle</h2>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-slate-50 dark:bg-black/20 p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center gap-6 group hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden"
                                     onClick={() => fileInputRef.current?.click()}>
                                    {logo ? (
                                        <div className="relative group/logo">
                                            <img src={logo} alt="Custom Logo" className="max-h-24 object-contain" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                <RotateCcw className="text-white" size={24} />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                                                <Upload size={32} />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-black uppercase text-xs tracking-widest">Télécharger votre logo</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1">PNG, JPG ou SVG (Max 2MB)</p>
                                            </div>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>

                                {logo && (
                                    <button 
                                        onClick={() => setLogo(null)}
                                        className="w-full h-14 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} /> Supprimer le logo personnalisé
                                    </button>
                                )}
                            </div>
                        </section>

                        <div className="flex justify-end">
                            <button 
                                onClick={resetBranding}
                                className="flex items-center gap-3 px-8 h-16 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all font-black text-xs uppercase tracking-widest"
                            >
                                <RotateCcw size={16} /> Réinitialiser par défaut
                            </button>
                        </div>
                    </div>

                    {/* Live Preview Panel */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-32 space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <Eye size={18} className="text-slate-400" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Aperçu en direct</h3>
                            </div>

                            <div className="bg-white dark:bg-[#0d1120] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl overflow-hidden aspect-[4/5] relative group">
                                {/* Header Preview */}
                                <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                                    {logo ? (
                                        <img src={logo} className="h-6 object-contain" alt="Preview Logo" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-600" style={{ backgroundColor: primaryColor }} />
                                            <span className="font-black uppercase tracking-tighter">paperFlow</span>
                                        </div>
                                    )}
                                    <div className="w-8 h-8 rounded-[10px] bg-slate-50 dark:bg-white/5" />
                                </div>

                                {/* Content Preview */}
                                <div className="p-10 space-y-8">
                                    <div className="space-y-4">
                                        <div className="h-4 w-2/3 bg-slate-50 dark:bg-white/5 rounded-full" />
                                        <div className="h-8 w-full bg-slate-50 dark:bg-white/5 rounded-xl" />
                                        <div className="h-4 w-1/2 bg-slate-50 dark:bg-white/5 rounded-full" />
                                    </div>

                                    {/* Action Button Preview */}
                                    <div 
                                        className="w-full h-16 rounded-3xl flex items-center justify-center gap-3 text-white font-black text-[10px] uppercase tracking-widest shadow-xl transition-all"
                                        style={{ 
                                            backgroundColor: primaryColor,
                                            boxShadow: `0 20px 40px -10px ${primaryColor}40`
                                        }}
                                    >
                                        <Layout size={18} /> Bouton d'action
                                    </div>

                                    {/* Grid Item Preview */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="p-6 bg-slate-50 dark:bg-black/20 rounded-[32px] border border-slate-100 dark:border-white/5 space-y-3">
                                                <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#0d1120] flex items-center justify-center shadow-md">
                                                    <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: primaryColor }} />
                                                </div>
                                                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Floating Badge */}
                                <div 
                                    className="absolute bottom-8 right-8 px-6 py-3 rounded-full flex items-center gap-2 text-white font-black text-[8px] uppercase tracking-widest shadow-2xl"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Check size={14} /> Design actif
                                </div>
                            </div>

                            <div className="p-6 bg-blue-600/5 dark:bg-blue-600/10 rounded-3xl border border-blue-500/10">
                                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 leading-relaxed text-center">
                                    <span className="font-black uppercase">Conseil :</span> Utilisez une couleur qui contraste bien avec le blanc (mode clair) et le noir (mode sombre) pour une meilleure accessibilité.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Branding;
