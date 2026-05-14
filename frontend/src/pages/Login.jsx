import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/dashboard";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (error) {
            console.error(error);
            setError(error.message || "Email ou mot de passe incorrect.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate(from, { replace: true });
        } catch (error) {
            console.error(error);
            setError("Erreur lors de la connexion avec Google.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#060912] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex flex-col items-center gap-2 mb-8">
                    <img src="/logo.png" alt="paperFlow Logo" className="w-16 h-16 rounded-2xl shadow-2xl shadow-blue-500/20" />
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">paperFlow Connect.</h1>
                </div>

                <div className="bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-blue-500/20 rounded-[40px] p-8 md:p-10 shadow-2xl relative">
                    <div className="space-y-2 mb-8 text-center md:text-left">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">De retour ?</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Entrez vos identifiants pour continuer.</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 mb-6 text-sm font-medium"
                        >
                            <AlertCircle size={20} />
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-4 mb-8">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            type="button"
                            className="w-full flex items-center justify-center gap-3 h-14 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-2xl transition-all group active:scale-95 shadow-sm"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">Continuer avec Google</span>
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-white/5"></div></div>
                            <div className="relative flex justify-center"><span className="bg-white dark:bg-[#0d1120] px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ou via identifiants</span></div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="exemple@email.com"
                                    className="w-full h-14 bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Mot de passe</label>
                                <Link to="/forgot-password" size={14} className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors">Oublié ?</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full h-14 bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-12 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-[#388bfd] to-[#5e3aee] text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-[0_8px_30px_rgb(56,139,253,0.3)] hover:shadow-[0_8px_30px_rgb(56,139,253,0.5)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Se connecter"}
                        </button>
                    </form>

                </div>

                <p className="mt-8 text-center text-slate-400 font-bold text-sm">
                    Pas encore de compte ? <Link to="/register" className="text-blue-500 hover:text-blue-400 ml-1">Inscrivez-vous ici</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
