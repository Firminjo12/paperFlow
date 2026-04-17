import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Plus,
    FileText,
    Clock,
    Trash2,
    Download,
    MoreHorizontal,
    BarChart3,
    History,
    User,
    PenTool,
    ChevronRight,
    Search,
    Filter,
    Scissors,
    FileStack,
    Zap,
    FileType,
    RefreshCw,
    Maximize2,
    Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Dashboard = () => {
    const { user, jwt, signOut } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [signatures, setSignatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalDocs: 0, lastActivity: null });

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !jwt) return;
            setLoading(true);
            try {
                const [docsData, sigsData, statsData] = await Promise.all([
                    api.getHistory(jwt),
                    api.getSignatures(jwt),
                    api.getMyStats(jwt)
                ]);

                setDocuments(docsData || []);
                setSignatures(sigsData || []);
                setStats(statsData || {
                    total_signed: 0,
                    total_merged: 0,
                    total_split: 0,
                    total_compressed: 0,
                    total_converted: 0,
                    last_activity: null
                });

            } catch (error) {
                console.error("Dashboard Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id, jwt]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#060912] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#060912] text-slate-900 dark:text-white font-sans transition-colors duration-300">
            {/* Header Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                            Bonjour, <br />
                            <span className="text-blue-600 truncate inline-block max-w-[300px]">
                                {user?.full_name || user?.email?.split('@')[0]}
                            </span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold tracking-wide">
                            Gérez vos documents et signatures en un seul endroit.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-3 px-8 h-16 bg-slate-900 dark:bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.15em] shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all active:scale-95">
                            <Plus size={20} /> Nouveau PDF
                        </Link>
                        <Link to="/profile" className="flex items-center justify-center w-16 h-16 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white rounded-[24px] hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                            <User size={24} />
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
                    <div className="p-6 bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 rounded-[32px] flex flex-col gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
                            <PenTool size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black">{stats.total_signed || 0}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signés</div>
                        </div>
                    </div>
                    <div className="p-6 bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 rounded-[32px] flex flex-col gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-600">
                            <FileStack size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black">{stats.total_merged || 0}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fusionnés</div>
                        </div>
                    </div>
                    <div className="p-6 bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 rounded-[32px] flex flex-col gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-red-50 dark:bg-red-600/10 rounded-xl flex items-center justify-center text-red-600">
                            <Scissors size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black">{stats.total_split || 0}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Divisés</div>
                        </div>
                    </div>
                    <div className="p-6 bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 rounded-[32px] flex flex-col gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-600/10 rounded-xl flex items-center justify-center text-amber-600">
                            <Zap size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black">{stats.total_compressed || 0}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compressés</div>
                        </div>
                    </div>
                    <div className="p-6 bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 rounded-[32px] flex flex-col gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-600">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black">{stats.total_converted || 0}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Convertis</div>
                        </div>
                    </div>
                    <div className="p-6 bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/10 rounded-[32px] flex flex-col gap-3 shadow-sm border-dashed">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-black truncate">{stats.last_activity ? new Date(stats.last_activity).toLocaleDateString() : 'Aucune'}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activité</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Recent Documents */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <History size={24} className="text-blue-500" /> Historique récent
                            </h2>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-white/5 mx-6 hidden sm:block"></div>
                        </div>

                        {documents.length > 0 ? (
                            <div className="space-y-4">
                                {documents.slice(0, 10).map((doc) => {
                                    const getActionInfo = (action) => {
                                        switch(action) {
                                            case 'sign': return { icon: <PenTool size={18} />, label: '✍️ Signé', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' };
                                            case 'merge': return { icon: <FileStack size={18} />, label: '🔗 Fusionné', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' };
                                            case 'split': return { icon: <Scissors size={18} />, label: '✂️ Divisé', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' };
                                            case 'compress': return { icon: <Zap size={18} />, label: '🗜️ Compressé', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' };
                                            case 'convert': return { icon: <RefreshCw size={18} />, label: '🔄 Converti', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' };
                                            default: return { icon: <FileText size={18} />, label: 'Document', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-white/5' };
                                        }
                                    };
                                    const info = getActionInfo(doc.action);
                                    
                                    return (
                                        <div key={doc._id} className="group p-6 bg-white dark:bg-[#0d1120] border border-slate-100 dark:border-white/5 rounded-[32px] hover:border-blue-500/30 transition-all flex items-center justify-between shadow-sm hover:shadow-xl dark:hover:shadow-blue-500/5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 ${info.bg} ${info.color} rounded-2xl flex items-center justify-center transition-colors`}>
                                                    {info.icon}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                        <span className="truncate max-w-[180px]">{doc.file_name}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${info.bg} ${info.color}`}>
                                                            {info.label}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                                        {new Date(doc.createdAt || doc.signed_at).toLocaleString()} {doc.file_size ? `• ${(doc.file_size / 1024).toFixed(1)} KB` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {documents.length > 5 && (
                                    <button className="w-full py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
                                        Voir tous les documents
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white dark:bg-[#0d1120] border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[48px] space-y-4">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                    <FileText size={32} />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Aucun document</p>
                                    <p className="text-slate-400 text-xs font-bold">Vos documents signés apparaîtront ici.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Signatures & Account */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <PenTool size={24} className="text-purple-500" /> Vos signatures
                            </h2>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-white/5 mx-6 hidden sm:block"></div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {signatures.length > 0 ? (
                                signatures.map((sig) => (
                                    <div key={sig._id} className="p-6 bg-white dark:bg-[#0d1120] border border-slate-100 dark:border-white/5 rounded-[32px] overflow-hidden flex flex-col gap-4 shadow-sm">
                                        <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-2xl flex items-center justify-center min-h-[140px]">
                                            <img src={sig.signature_data} alt="Signature" className="max-h-[100px] object-contain dark:invert" />
                                        </div>
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enregistrée le {new Date(sig.created_at).toLocaleDateString()}</span>
                                            <button className="text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center bg-white dark:bg-[#0d1120] border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[48px] space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                        <PenTool size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Aucune signature</p>
                                        <p className="text-slate-400 text-xs font-bold">Sauvegardez une signature pour la réutiliser.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
