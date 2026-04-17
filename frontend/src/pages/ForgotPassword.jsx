import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await resetPassword(email);
            setMessage("Vérifiez votre boîte mail pour les instructions de réinitialisation.");
        } catch (error) {
            console.error(error);
            setError(error.message || "Impossible d'envoyer l'e-mail de réinitialisation.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#060912] flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center gap-2 mb-8">
                    <img src="/logo.png" alt="SignFlow Logo" className="w-16 h-16 rounded-2xl shadow-xl" />
                </div>

                <div className="bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-blue-500/20 rounded-[40px] p-8 md:p-10 shadow-2xl relative">
                    <div className="space-y-2 mb-8">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mot de passe oublié ?</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Pas de panique, nous allons vous aider.</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 mb-6 text-sm font-medium">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl flex items-center gap-3 mb-6 text-sm font-medium">
                            <CheckCircle size={20} />
                            {message}
                        </div>
                    )}

                    {!message ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="votre@email.com"
                                        className="w-full h-14 bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-gradient-to-r from-[#388bfd] to-[#5e3aee] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? "Envoi..." : "Réinitialiser mon mot de passe"}
                            </button>
                        </form>
                    ) : (
                        <Link
                            to="/login"
                            className="w-full h-14 bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all"
                        >
                            Retourner à la connexion
                        </Link>
                    )}

                    <div className="mt-8 text-center">
                        <Link to="/login" className="text-slate-500 hover:text-white flex items-center justify-center gap-2 text-sm font-bold transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
