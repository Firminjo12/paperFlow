import React from 'react';
import { motion } from 'framer-motion';
import { 
    Users, 
    ShieldCheck, 
    Target, 
    Heart, 
    ArrowLeft,
    Coffee,
    FileText,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReviewsSection from '../components/ReviewsSection';

const About = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-[#060912] text-slate-900 dark:text-white font-sans transition-colors duration-300">
            {/* Header / Hero */}
            <section className="relative pt-32 pb-20 px-6 border-b border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-5xl mx-auto relative text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-widest">
                            <ArrowLeft size={14} /> Retour à l'accueil
                        </Link>
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                            À propos de <br />
                            <span className="text-red-600">paperFlow.</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed pt-4">
                            Nous avons créé paperFlow avec une mission simple : rendre la manipulation des documents PDF accessible, rapide et sécurisée pour tout le monde.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Our Story */}
            <section className="max-w-4xl mx-auto px-6 py-24 space-y-12">
                <div className="space-y-6">
                    <h2 className="text-3xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">Notre Histoire</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        Trop souvent, gérer des PDF signifie payer des abonnements coûteux ou utiliser des sites remplis de publicités invasives et de risques pour la sécurité. paperFlow est né de la frustration face à ces solutions. Nous avons voulu construire un outil "Next-Gen" qui respecte l'utilisateur et ses données.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-10 bg-slate-50 dark:bg-white/5 rounded-[40px] border border-slate-100 dark:border-white/5 space-y-6">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
                            <ShieldCheck size={24} />
                        </div>
                        <h3 className="text-xl font-black uppercase italic">Confidentialité Totale</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Contrairement à d'autres plateformes, nous ne stockons pas vos fichiers à long terme. Vos documents sont traités dans un environnement sécurisé et supprimés automatiquement.
                        </p>
                    </div>
                    <div className="p-10 bg-slate-50 dark:bg-white/5 rounded-[40px] border border-slate-100 dark:border-white/5 space-y-6">
                        <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-xl font-black uppercase italic">Vitesse de Pointe</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Nous utilisons les dernières technologies web pour garantir que vos fusions, compressions et signatures soient terminées en un clin d'œil.
                        </p>
                    </div>
                </div>

                <div className="pt-12 text-center border-t border-slate-100 dark:border-white/5">
                    <div className="flex justify-center gap-12 mb-8">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">100%</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gratuit</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">25+</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Outils</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">0</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inscription requise</span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 font-bold max-w-xl mx-auto">
                        paperFlow est maintenu par une équipe passionnée de développeurs qui croient en un web plus simple et plus ouvert.
                    </p>
                </div>
            </section>
            
            <ReviewsSection />
        </div>
    );
};

export default About;
