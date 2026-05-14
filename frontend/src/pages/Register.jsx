import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0); // 0-4

    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Simple indicator for password strength
        let strength = 0;
        if (password.length > 6) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^A-Za-z0-9]/)) strength++;
        setPasswordStrength(strength);
    }, [password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError("Les mots de passe ne correspondent pas.");
        }

        if (password.length < 6) {
            return setError("Le mot de passe doit faire au moins 6 caractères.");
        }

        setLoading(true);

        try {
            await register(email, password, fullName);
            navigate('/login', { state: { message: "Inscription réussie ! Vous pouvez maintenant vous connecter." } });
        } catch (error) {
            console.error(error);
            setError(error.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate('/dashboard', { replace: true });
        } catch (error) {
            console.error(error);
            setError("Erreur lors de l'inscription avec Google. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const getStrengthLabel = () => {
        if (passwordStrength === 0) return { label: 'Faible', color: 'bg-red-500' };
        if (passwordStrength === 1) return { label: 'Moyen', color: 'bg-orange-500' };
        if (passwordStrength === 2) return { label: 'Bon', color: 'bg-yellow-500' };
        if (passwordStrength === 3) return { label: 'Fort', color: 'bg-blue-500' };
        return { label: 'Excellent', color: 'bg-green-500' };
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#060912] flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                {/* Logo */}
                <div className="flex flex-col items-center gap-2 mb-8">
                    <img src="/logo.png" alt="paperFlow Logo" className="w-16 h-16 rounded-2xl shadow-2xl shadow-blue-500/20" />
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">paperFlow Connect.</h1>
                </div>

                <div className="bg-white dark:bg-[#0d1120] border border-slate-200 dark:border-blue-500/20 rounded-[40px] p-8 md:p-10 shadow-2xl relative">
                    <div className="space-y-2 mb-8 text-center md:text-left">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Bienvenue !</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Créez votre compte pour commencer à signer.</p>
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
                            onClick={handleGoogleRegister}
                            disabled={loading}
                            type="button"
                            className="w-full flex items-center justify-center gap-3 h-14 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-2xl transition-all group active:scale-95 shadow-sm"
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">S'inscrire avec Google</span>
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-white/5"></div></div>
                            <div className="relative flex justify-center"><span className="bg-white dark:bg-[#0d1120] px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ou via email</span></div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Nom complet</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    placeholder="Ex: Jean Paul Dupont"
                                    className="w-full h-14 bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Mot de passe</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full h-14 bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-white/5 rounded-2xl pl-11 pr-11 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Confirmation</label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full h-14 bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-white/5 rounded-2xl pl-11 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password strength bar */}
                        {password && (
                            <div className="space-y-2 px-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500 tracking-widest">Sécurité</span>
                                    <span className={getStrengthLabel().color.replace('bg-', 'text-')}>{getStrengthLabel().label}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className={`h-full flex-1 rounded-full transition-all duration-500 ${i <= passwordStrength + 1 ? getStrengthLabel().color : 'opacity-20 translate-x-10'}`} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-[#388bfd] to-[#5e3aee] text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-[0_8px_30px_rgb(56,139,253,0.3)] hover:shadow-[0_8px_30px_rgb(56,139,253,0.5)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center mt-4"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Créer mon compte"}
                        </button>
                    </form>

                </div>

                <p className="mt-8 text-center text-slate-400 font-bold text-sm">
                    Déjà un compte ? <Link to="/login" className="text-blue-500 hover:text-blue-400 ml-1">Connectez-vous</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
