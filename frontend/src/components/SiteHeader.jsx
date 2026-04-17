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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SiteHeader = () => {
    const { user, logout } = useAuth();
    const [isAllToolsOpen, setIsAllToolsOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const allToolsRef = useRef(null);
    const userMenuRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

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
        organize: [
            { label: 'Fusionner PDF', icon: <FileStack className="text-orange-500" size={18} />, path: '/merge' },
            { label: 'Diviser PDF', icon: <Scissors className="text-red-500" size={18} />, path: '/split' },
            { label: 'Supprimer pages', icon: <Scissors className="text-red-400" size={18} />, path: '/remove-pages' },
            { label: 'Organiser PDF', icon: <LayoutGrid className="text-orange-600" size={18} />, path: '/organize' },
        ],
        optimize: [
            { label: 'Compresser PDF', icon: <Zap className="text-green-500" size={18} />, path: '/compress' },
            { label: 'Réparer PDF', icon: <Zap className="text-blue-400" size={18} />, path: '/repair' },
        ],
        edit: [
            { label: 'Signer PDF', icon: <Signature className="text-blue-500" size={18} />, path: '/sign' },
            { label: 'Modifier PDF', icon: <FileText className="text-purple-500" size={18} />, path: '/edit' },
            { label: 'Filigrane', icon: <FileText className="text-red-600" size={18} />, path: '/watermark' },
            { label: 'Censurer PDF', icon: <Lock className="text-blue-900" size={18} />, path: '/censure' },
            { label: 'Rogner PDF', icon: <Scissors className="text-purple-400" size={18} />, path: '/rogner' },
            { label: 'Débloquer PDF', icon: <Unlock className="text-green-600" size={18} />, path: '/unlock' },
        ]
    };

    return (
        <header className="sticky top-0 w-full z-[100] bg-white/90 dark:bg-[#060912]/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
                {/* Logo */}
                <div 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-2 cursor-pointer group"
                >
                    <div className="w-7 h-7 bg-[#e52424] rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:rotate-12 transition-all duration-500">
                        <Signature className="text-white" size={17} />
                    </div>
                    <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">SignFlow</span>
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

                    <div className="relative ml-1" ref={allToolsRef}>
                        <button
                            onClick={() => setIsAllToolsOpen(!isAllToolsOpen)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${isAllToolsOpen ? 'bg-red-600 text-white shadow-red-500/20' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                            Outils <ChevronDown size={11} className={isAllToolsOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                        </button>

                        {isAllToolsOpen && (
                            <div className="absolute top-full right-0 mt-4 w-[650px] bg-white dark:bg-[#0d1120] shadow-2xl rounded-[32px] border border-slate-100 dark:border-white/5 p-8 grid grid-cols-3 gap-8 z-[110] animate-in fade-in slide-in-from-top-4 duration-300">
                                {Object.entries(allToolsMenu).map(([key, tools]) => (
                                    <div key={key}>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 px-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                            {key === 'organize' ? 'Organiser' : key === 'optimize' ? 'Optimiser' : 'Modifier'}
                                        </h4>
                                        <div className="space-y-1">
                                            {tools.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => { navigate(item.path); setIsAllToolsOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group/item text-left"
                                                >
                                                    <div className="shrink-0 transition-transform group-hover/item:scale-110">
                                                        {item.icon}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover/item:text-red-600 transition-colors uppercase tracking-wider">{item.label}</span>
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
                                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
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
