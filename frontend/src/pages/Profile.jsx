import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User, Mail, Camera, Save, ArrowLeft, Lock, Trash2, ShieldCheck,
    Bell, Languages, LogOut, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
    const { user, signOut, fetchProfile, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) setFullName(user.full_name || '');
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setMessage('');

        try {
            await updateProfile({
                full_name: fullName
            });

            setMessage("Profil mis à jour avec succès !");
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setError("Erreur lors de la mise à jour du profil.");
        } finally {
            setUpdating(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#060912] text-slate-900 dark:text-white font-sans p-6 md:p-12 lg:p-20 relative overflow-hidden transition-colors duration-300">
            <div className="max-w-4xl mx-auto space-y-12 relative">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4">
                        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
                            <ArrowLeft size={16} /> Retour au tableau de bord
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">Mon Profil.</h1>
                    </div>
                    <button onClick={handleSignOut} className="flex items-center gap-3 px-6 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95">
                        <LogOut size={18} /> Se déconnecter
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Lateral Info */}
                    <div className="space-y-8">
                        <div className="p-8 bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 rounded-[48px] shadow-xl dark:shadow-2xl shadow-blue-500/5 dark:shadow-black/20 text-center space-y-6">
                            <div className="relative inline-block group">
                                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[32px] flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-blue-500/30">
                                    {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                                </div>
                                <button className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-slate-800 text-blue-600 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                                    <Camera size={18} />
                                </button>
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{fullName || "Compte SignFlow"}</h2>
                                <p className="text-sm font-bold text-slate-400 truncate">{user?.email}</p>
                            </div>
                            <div className="pt-4 flex justify-center gap-4">
                                <div className="text-center">
                                    <div className="text-lg font-black text-slate-900 dark:text-white">Pro</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan</div>
                                </div>
                                <div className="w-px bg-slate-100 dark:bg-white/5" />
                                <div className="text-center">
                                    <div className="text-lg font-black text-slate-900 dark:text-white">FR</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Langue</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900 dark:bg-blue-600 rounded-[48px] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                            <div className="relative space-y-4">
                                <h3 className="text-lg font-black leading-tight">Sécurité SignFlow</h3>
                                <p className="text-sm text-blue-100/70 font-medium">Vos documents sont protégés par le chiffrement de bout en bout.</p>
                                <button className="text-[10px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-xl transition-all">En savoir plus</button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="p-8 md:p-12 bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 rounded-[56px] shadow-xl dark:shadow-2xl shadow-blue-500/5 dark:shadow-black/20">
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-8 flex items-center gap-4">
                                <User size={24} className="text-blue-500" /> Informations Personnelles
                            </h3>

                            {message && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-500 text-sm font-bold">
                                    <CheckCircle size={20} /> {message}
                                </motion.div>
                            )}

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                                    <AlertCircle size={20} /> {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleUpdateProfile} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Nom Complet</label>
                                        <div className="relative">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full h-16 bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-white/5 rounded-[24px] pl-16 pr-6 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Email (Non modifiable)</label>
                                        <div className="relative opacity-50 cursor-not-allowed">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={20} />
                                            <input
                                                type="email"
                                                value={user?.email}
                                                readOnly
                                                className="w-full h-16 bg-slate-100 dark:bg-[#0a0f1e]/50 border border-slate-200 dark:border-white/5 rounded-[24px] pl-16 pr-6 text-slate-500 dark:text-slate-600 focus:outline-none transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex items-center justify-center gap-3 px-10 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-blue-500/10 hover:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {updating ? "Mise à jour..." : <><Save size={20} /> Sauvegarder les modifications</>}
                                </button>
                            </form>
                        </section>

                        <section className="p-8 md:p-12 bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-white/5 rounded-[56px] shadow-xl dark:shadow-2xl shadow-blue-500/5 dark:shadow-black/20">
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-8 flex items-center gap-4">
                                <Lock size={24} className="text-purple-500" /> Sécurité du compte
                            </h3>

                            <div className="space-y-6">
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Il est recommandé de changer votre mot de passe régulièrement pour assurer la sécurité de vos documents.</p>
                                <button className="flex items-center gap-3 px-8 h-14 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95">
                                    <ShieldCheck size={18} /> Changer le mot de passe
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
