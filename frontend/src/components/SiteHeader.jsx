import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  FileStack, 
  Scissors, 
  LayoutGrid, 
  Zap, 
  Signature, 
  FileText,
  Presentation,
  FileType,
  Files,
  FileEdit,
  Type,
  Settings,
  FileSearch,
  Globe,
  Hash,
  Unlock,
  Lock,
  User,
  LogOut,
  ChevronRight,
  RotateCcw,
  FileImage,
  Image as ImageIcon,
  Languages,
  Sparkles,
  Camera,
  ShieldCheck,
  Trash2,
  Palette,
  Sun,
  Moon,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { useTheme } from '../contexts/ThemeContext';

const SiteHeader = () => {
    const { user, signOut, loginWithGoogle } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const branding = useBranding() || {};
    const { logo, primaryColor } = branding;
    const [isAllToolsOpen, setIsAllToolsOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const allToolsRef = useRef(null);
    const userMenuRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoogleQuickLogin = async () => {
        try {
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
        }
    };

    const activeTab = location.pathname.split('/')[1] || 'home';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (allToolsRef.current && !allToolsRef.current.contains(event.target)) {
                setIsAllToolsOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allToolsMenu = {
        organize: {
            title: 'Organiser',
            items: [
                { label: 'Fusionner PDF', icon: <FileStack className="text-orange-500" size={18} />, path: '/merge' },
                { label: 'Diviser PDF', icon: <Scissors className="text-red-500" size={18} />, path: '/split' },
                { label: 'Supprimer pages', icon: <Trash2 className="text-red-400" size={18} />, path: '/remove-pages' },
                { label: 'Extraire pages', icon: <Files className="text-orange-400" size={18} />, path: '/extract-pages' },
                { label: 'Organiser PDF', icon: <LayoutGrid className="text-orange-600" size={18} />, path: '/organize' },
                { label: 'Pivoter PDF', icon: <RotateCcw className="text-pink-500" size={18} />, path: '/rotate' },
                { label: 'Numéroter', icon: <Hash className="text-purple-600" size={18} />, path: '/page-numbers' },
            ]
        },
        optimize: {
            title: 'Optimiser',
            items: [
                { label: 'Compresser PDF', icon: <Zap className="text-green-500" size={18} />, path: '/compress' },
                { label: 'Réparer PDF', icon: <Settings className="text-blue-400" size={18} />, path: '/repair' },
                { label: 'Protéger PDF', icon: <Lock className="text-gray-700" size={18} />, path: '/protect' },
                { label: 'Débloquer PDF', icon: <Unlock className="text-green-600" size={18} />, path: '/unlock' },
            ]
        },
        edit: {
            title: 'Modifier',
            items: [
                { label: 'Signer PDF', icon: <Signature className="text-blue-500" size={18} />, path: '/sign' },
                { label: 'Modifier PDF', icon: <FileEdit className="text-purple-500" size={18} />, path: '/edit' },
                { label: 'Filigrane', icon: <Type className="text-red-600" size={18} />, path: '/watermark' },
                { label: 'Censurer PDF', icon: <FileSearch className="text-blue-900" size={18} />, path: '/censure' },
                { label: 'Rogner PDF', icon: <Scissors className="text-purple-400" size={18} />, path: '/rogner' },
            ]
        },
        convert: {
            title: 'Convertir',
            items: [
                { label: 'Word en PDF', icon: <FileText className="text-blue-600" size={18} />, path: '/word-to-pdf' },
                { label: 'PPT en PDF', icon: <Presentation className="text-orange-600" size={18} />, path: '/ppt-to-pdf' },
                { label: 'PDF en Word', icon: <FileText className="text-blue-400" size={18} />, path: '/pdf-to-word' },
                { label: 'PDF en PPT', icon: <Presentation className="text-orange-400" size={18} />, path: '/pdf-to-ppt' },
                { label: 'JPG en PDF', icon: <FileImage className="text-yellow-500" size={18} />, path: '/jpg-to-pdf' },
                { label: 'PDF en JPG', icon: <ImageIcon className="text-yellow-400" size={18} />, path: '/pdf-to-jpg' },
                { label: 'HTML en PDF', icon: <Globe className="text-blue-500" size={18} />, path: '/html-to-pdf' },
            ]
        },
        advanced: {
            title: 'Avancé',
            items: [
                { label: 'OCR PDF', icon: <FileSearch className="text-green-400" size={18} />, path: '/ocr' },
                { label: 'Numériser PDF', icon: <Camera className="text-red-600" size={18} />, path: '/scan-to-pdf' },
            ]
        }
    };

    return (
        <header className="sticky top-0 w-full z-[100] bg-white/90 dark:bg-[#060912]/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
                {/* Logo */}
                <div 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-2 cursor-pointer group"
                >
                    {logo ? (
                        <img src={logo} alt="Custom Logo" className="h-8 object-contain transition-all" />
                    ) : (
                        <>
                            <div 
                                className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all duration-500"
                                style={{ 
                                    backgroundColor: primaryColor,
                                    boxShadow: `0 8px 20px -4px ${primaryColor}40`
                                }}
                            >
                                <Signature className="text-white" size={17} />
                            </div>
                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">paperFlow</span>
                        </>
                    )}
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-2">
                    <button
                        onClick={() => navigate('/merge')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'merge' ? 'text-red-600 bg-red-50/80 dark:bg-red-500/10' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Fusionner
                    </button>
                    <button
                        onClick={() => navigate('/split')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'split' ? 'text-red-600 bg-red-50/80 dark:bg-red-500/10' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Diviser
                    </button>
                    <button
                        onClick={() => navigate('/compress')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'compress' ? 'text-red-600 bg-red-50/80 dark:bg-red-500/10' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Compresser
                    </button>
                    <button
                        onClick={() => navigate('/contact')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'contact' ? 'text-red-600 bg-red-50/80 dark:bg-red-500/10' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Contact
                    </button>

                    <div className="relative ml-1" ref={allToolsRef}>
                        <button
                            onClick={() => setIsAllToolsOpen(!isAllToolsOpen)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${isAllToolsOpen ? 'bg-red-600 text-white shadow-red-500/20' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                            Outils <ChevronDown size={11} className={isAllToolsOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                        </button>

                        {isAllToolsOpen && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[calc(100vw-2rem)] lg:w-[1000px] max-h-[85vh] overflow-y-auto bg-white dark:bg-[#0d1120] shadow-2xl rounded-[32px] border border-slate-100 dark:border-white/5 p-6 lg:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8 z-[110] animate-in fade-in slide-in-from-top-4 duration-300">
                                {Object.entries(allToolsMenu).map(([key, category]) => (
                                    <div key={key} className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                            {category.title}
                                        </h4>
                                        <div className="space-y-0.5">
                                            {category.items.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => { navigate(item.path); setIsAllToolsOpen(false); }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group/item text-left relative ${item.isSoon ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                                                >
                                                    <div className="shrink-0 transition-transform group-hover/item:scale-110">
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 group-hover/item:text-red-600 transition-colors uppercase tracking-wider truncate">{item.label}</span>
                                                        {item.isSoon && (
                                                            <span className="text-[7px] font-black bg-blue-500 text-white px-1 py-0.5 rounded-sm absolute right-2 top-2">SOON</span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>

                {/* User Section */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={toggleTheme}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-600 dark:text-yellow-400 transition-all hover:scale-110 active:scale-95 shadow-sm"
                        title={isDarkMode ? "Passer au mode clair" : "Passer au mode sombre"}
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {user ? (
                        <div className="relative" ref={userMenuRef}>
                            <button 
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 pl-1 pr-2.5 py-1 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 transition-all hover:border-red-500/30"
                            >
                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-black text-[9px] uppercase shadow-lg shadow-red-500/15">
                                    {user.name?.charAt(0) || user.email?.charAt(0)}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Espace</p>
                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate max-w-[80px]">Compte</p>
                                </div>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute top-full right-0 mt-4 w-64 bg-white dark:bg-[#0d1120] shadow-2xl rounded-[24px] border border-slate-100 dark:border-white/5 p-3 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 mb-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Connecté en tant que</p>
                                        <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{user.email}</p>
                                    </div>
                                    <button 
                                        onClick={() => { navigate('/dashboard'); setIsUserMenuOpen(false); }}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <LayoutGrid size={16} className="text-blue-500" />
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">Tableau de bord</span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button 
                                        onClick={() => { navigate('/branding'); setIsUserMenuOpen(false); }}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Palette size={16} className="text-purple-500" />
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">Mode PRO (Branding)</span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    {user?.role === 'admin' && (
                                        <>
                                            <button 
                                                onClick={() => { navigate('/admin/newsletter'); setIsUserMenuOpen(false); }}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group bg-red-500/5 mt-1"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Mail size={16} className="text-red-500" />
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-red-600">Admin Newsletter</span>
                                                </div>
                                                <ChevronRight size={14} className="text-red-300 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                            <button 
                                                onClick={() => { navigate('/admin/reviews'); setIsUserMenuOpen(false); }}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all group bg-blue-500/5 mt-1"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <MessageSquare size={16} className="text-blue-500" />
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">Admin Avis</span>
                                                </div>
                                                <ChevronRight size={14} className="text-blue-300 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-red-600"
                                    >
                                        <LogOut size={16} />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Déconnexion</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleGoogleQuickLogin}
                                className="hidden md:flex items-center justify-center w-8 h-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg hover:border-blue-500/30 transition-all hover:scale-105 active:scale-95"
                                title="Connexion rapide avec Google"
                            >
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => navigate('/login')}
                                className="hidden md:block px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-red-600 transition-colors"
                            >
                                Connexion
                            </button>
                            <button 
                                onClick={() => navigate('/register')}
                                className="px-4 py-1.5 bg-[#e52424] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                S'inscrire
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default SiteHeader;
