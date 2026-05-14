import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ChevronLeft, 
    History, 
    Search, 
    FileText, 
    PenTool, 
    FileStack, 
    Scissors, 
    Zap, 
    RefreshCw,
    Download,
    Trash2,
    Calendar,
    Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Logs = () => {
    const { jwt } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchHistory = async () => {
        if (!jwt) return;
        try {
            const data = await api.getHistory(jwt);
            setDocuments(data || []);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();

        // Refresh when tab gets focus
        const handleFocus = () => fetchHistory();
        window.addEventListener('focus', handleFocus);
        
        return () => window.removeEventListener('focus', handleFocus);
    }, [jwt]);

    const getActionInfo = (action) => {
        switch(action) {
            case 'sign': return { icon: <PenTool size={18} />, label: 'Signé', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' };
            case 'merge': return { icon: <FileStack size={18} />, label: 'Fusionné', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' };
            case 'split': return { icon: <Scissors size={18} />, label: 'Divisé', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' };
            case 'compress': return { icon: <Zap size={18} />, label: 'Compressé', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' };
            case 'convert': return { icon: <RefreshCw size={18} />, label: 'Converti', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' };
            default: return { icon: <FileText size={18} />, label: 'Document', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-white/5' };
        }
    };

    const filteredDocs = documents
        .filter(doc => filter === 'all' || doc.action === filter)
        .filter(doc => doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#060912] text-slate-900 dark:text-white font-sans transition-colors duration-300">
            <div className="max-w-5xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div className="space-y-2">
                        <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors text-xs font-black uppercase tracking-widest mb-4">
                            <ChevronLeft size={16} /> Retour au Dashboard
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight">Archives Complètes</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold">Consultez l'historique complet de vos activités sur paperFlow.</p>
                    </div>
                    <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-[24px] flex items-center justify-center">
                        <History size={32} />
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Rechercher un fichier..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-16 pl-14 pr-6 bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 rounded-[24px] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {['all', 'sign', 'merge', 'split', 'convert'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex items-center gap-2 px-6 h-16 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filter === f 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                    : 'bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'
                                }`}
                            >
                                {f === 'all' ? 'Tout' : getActionInfo(f).label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Chargement de vos archives...</p>
                    </div>
                ) : filteredDocs.length > 0 ? (
                    <div className="space-y-4">
                        {filteredDocs.map((doc) => {
                            const info = getActionInfo(doc.action);
                            return (
                                <div key={doc._id} className="group p-6 bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 rounded-[32px] hover:border-blue-600/30 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 ${info.bg} ${info.color} rounded-[20px] flex items-center justify-center flex-shrink-0`}>
                                            {info.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-md font-black truncate max-w-[250px] md:max-w-[400px]">
                                                {doc.file_name}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400 mt-1">
                                                <span className="flex items-center gap-1.5 capita">
                                                    <Calendar size={12} /> {new Date(doc.createdAt || doc.signed_at).toLocaleDateString()}
                                                </span>
                                                <span>•</span>
                                                <span className="uppercase tracking-widest">{info.label}</span>
                                                <span>•</span>
                                                <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        {doc.file_url ? (
                                            <a 
                                                href={doc.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-12 px-6 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
                                            >
                                                <Download size={14} /> Re-télécharger
                                            </a>
                                        ) : (
                                            <button 
                                                title="Fichier non archivé"
                                                className="h-12 px-6 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed opacity-50 flex items-center gap-2"
                                            >
                                                <Download size={14} /> Indisponible
                                            </button>
                                        )}
                                        <button className="w-12 h-12 bg-red-50 dark:bg-red-500/5 text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-xl flex items-center justify-center transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-24 text-center bg-white dark:bg-[#0d1120] border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[48px] space-y-6">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <Search size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black uppercase tracking-widest">Aucun résultat</h3>
                            <p className="text-slate-400 text-sm font-bold">Nous n'avons trouvé aucun document correspondant à votre recherche.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Logs;
