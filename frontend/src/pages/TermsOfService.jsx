import React from 'react';
import { motion } from 'framer-motion';
import { 
    FileText, 
    Shield, 
    Scale, 
    AlertTriangle, 
    CheckCircle, 
    ArrowLeft,
    Clock,
    UserCheck,
    Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
    const lastUpdate = "30 Mai 2026";

    const sections = [
        {
            title: "1. Acceptation des conditions",
            icon: <CheckCircle className="text-blue-500" size={24} />,
            content: "En accédant et en utilisant paperFlow, vous acceptez d'être lié par les présentes conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services."
        },
        {
            title: "2. Description du service",
            icon: <Globe className="text-purple-500" size={24} />,
            content: "paperFlow fournit une suite d'outils de manipulation de fichiers PDF (fusion, compression, signature, conversion). Le service est fourni 'en l'état' et peut être modifié ou interrompu à tout moment."
        },
        {
            title: "3. Utilisation acceptable",
            icon: <UserCheck className="text-emerald-500" size={24} />,
            content: "Vous vous engagez à ne pas utiliser le service pour traiter des documents illégaux, malveillants ou portant atteinte aux droits de tiers. Nous nous réservons le droit de bloquer l'accès aux utilisateurs abusant du système."
        },
        {
            title: "4. Propriété intellectuelle",
            icon: <Scale className="text-amber-500" size={24} />,
            content: "Tous les droits sur la plateforme paperFlow appartiennent à ses créateurs. Vos fichiers restent votre propriété exclusive. Nous ne revendiquons aucun droit sur les documents que vous traitez via nos outils."
        },
        {
            title: "5. Limitation de responsabilité",
            icon: <AlertTriangle className="text-red-500" size={24} />,
            content: "paperFlow ne pourra être tenu responsable de toute perte de données ou dommage résultant de l'utilisation de nos outils. Il est de votre responsabilité de conserver des sauvegardes de vos documents originaux."
        },
        {
            title: "6. Modifications des conditions",
            icon: <Clock className="text-indigo-500" size={24} />,
            content: "Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur cette page. Votre utilisation continue du service constitue votre acceptation des nouvelles conditions."
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#060912] text-slate-900 dark:text-white font-sans transition-colors duration-300">
            {/* Header / Hero */}
            <section className="relative pt-32 pb-20 px-6 border-b border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-5xl mx-auto relative text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-500 transition-colors text-[10px] font-black uppercase tracking-widest">
                            <ArrowLeft size={14} /> Retour à l'accueil
                        </Link>
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                            Terms of <br />
                            <span className="text-purple-600">Service.</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 font-bold max-w-3xl leading-relaxed">
                            Les règles du jeu. Transparence totale sur l'utilisation de nos outils et vos responsabilités en tant qu'utilisateur.
                        </p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Dernière mise à jour : {lastUpdate}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Content Section */}
            <section className="max-w-5xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-10 bg-slate-50 dark:bg-white/5 rounded-[40px] border border-slate-100 dark:border-white/5 space-y-6 hover:shadow-2xl hover:shadow-purple-500/5 transition-all group"
                        >
                            <div className="w-16 h-16 bg-white dark:bg-[#0d1120] rounded-[24px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                {section.icon}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xl font-black tracking-tight group-hover:text-purple-600 transition-colors uppercase italic">{section.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-sm">
                                    {section.content}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="p-16 bg-slate-900 rounded-[64px] text-white space-y-8 relative overflow-hidden border border-white/5">
                    <div className="relative z-10 space-y-4">
                        <h4 className="text-3xl font-black tracking-tight uppercase italic text-purple-400">Contact Juridique</h4>
                        <p className="text-slate-400 font-medium text-lg max-w-2xl">
                            Si vous avez des questions concernant nos conditions générales, vous pouvez nous contacter à l'adresse suivante :
                        </p>
                        <div className="pt-4">
                            <a href="mailto:firminyameogo081@gmail.com" className="text-white font-black text-2xl border-b-4 border-purple-600 pb-1 hover:text-purple-400 transition-colors">
                                firminyameogo081@gmail.com
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TermsOfService;
