import React from 'react';
import { motion } from 'framer-motion';
import { 
    Shield, 
    Lock, 
    Eye, 
    FileText, 
    ChevronRight, 
    ArrowLeft, 
    Server, 
    Database, 
    Globe, 
    Mail, 
    Trash2,
    ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    const lastUpdate = "13 Mai 2026";

    const sections = [
        {
            title: "1. Notre engagement envers votre vie privée",
            icon: <ShieldCheck className="text-blue-500" size={24} />,
            content: "paperFlow s'engage à protéger la vie privée de tous les utilisateurs qui accèdent à nos outils PDF. Nous garantissons que vos fichiers ne sont jamais lus, consultés ou copiés par nous ou des tiers. Votre confiance est le moteur de notre service."
        },
        {
            title: "2. Traitement des fichiers téléchargés",
            icon: <FileText className="text-purple-500" size={24} />,
            content: "Lorsque vous utilisez nos outils (fusion, conversion, signature), vos fichiers sont téléchargés vers nos serveurs sécurisés uniquement pour le traitement. \n\n• Suppression automatique : Tous les fichiers sont définitivement supprimés de nos serveurs après un délai maximum de 2 heures. \n• Aucun accès humain : Aucun membre de notre équipe n'a accès à vos documents."
        },
        {
            title: "3. Données personnelles collectées",
            icon: <Database className="text-emerald-500" size={24} />,
            content: "Nous collectons des données minimales pour assurer le service : \n• Informations de compte : Email et nom pour les utilisateurs inscrits. \n• Données techniques : Adresse IP anonymisée, type de navigateur et statistiques d'utilisation globales pour améliorer notre plateforme."
        },
        {
            title: "4. Sécurité des données",
            icon: <Lock className="text-red-500" size={24} />,
            content: "Toutes les communications vers et depuis nos serveurs sont protégées par un chiffrement SSL (Secure Socket Layer) de niveau bancaire. Vos fichiers sont chiffrés au repos et en transit."
        },
        {
            title: "5. Cookies et traceurs",
            icon: <Globe className="text-amber-500" size={24} />,
            content: "Nous utilisons des cookies essentiels pour maintenir votre session et des outils d'analyse (comme Google Analytics) pour comprendre comment notre site est utilisé. Vous pouvez désactiver les cookies non-essentiels dans les réglages de votre navigateur."
        },
        {
            title: "6. Conformité RGPD (GDPR)",
            icon: <Shield className="text-indigo-500" size={24} />,
            content: "Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants : \n• Droit d'accès et de portabilité. \n• Droit de rectification ou de suppression. \n• Droit d'opposition au traitement."
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#060912] text-slate-900 dark:text-white font-sans transition-colors duration-300">
            {/* Header / Hero */}
            <section className="relative pt-32 pb-20 px-6 border-b border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-5xl mx-auto relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors text-[10px] font-black uppercase tracking-widest">
                            <ArrowLeft size={14} /> Retour à l'accueil
                        </Link>
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                            Privacy <br />
                            <span className="text-blue-600">Standard.</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 font-bold max-w-3xl leading-relaxed">
                            Découvrez comment nous protégeons vos documents avec les mêmes standards de sécurité que les plus grandes plateformes mondiales de traitement PDF.
                        </p>
                        <div className="flex flex-wrap items-center gap-6 pt-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Entièrement conforme RGPD
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                Chiffrement SSL 256-bit
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
                            className="p-10 bg-slate-50 dark:bg-white/5 rounded-[40px] border border-slate-100 dark:border-white/5 space-y-6 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group"
                        >
                            <div className="w-16 h-16 bg-white dark:bg-[#0d1120] rounded-[24px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                {section.icon}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xl font-black tracking-tight group-hover:text-blue-600 transition-colors uppercase italic">{section.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-sm whitespace-pre-line">
                                    {section.content}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Secure Badge Section */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="p-16 bg-blue-600 rounded-[64px] text-white flex flex-col md:flex-row items-center gap-12 shadow-3xl shadow-blue-500/40 overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
                    <div className="shrink-0 w-32 h-32 bg-white/20 rounded-[40px] flex items-center justify-center backdrop-blur-xl">
                        <Lock size={64} className="text-white" />
                    </div>
                    <div className="space-y-4 text-center md:text-left flex-1">
                        <h4 className="text-3xl font-black tracking-tight uppercase italic">Fichiers Supprimés. Toujours.</h4>
                        <p className="text-blue-50 font-medium text-lg leading-relaxed">
                            Nous ne faisons aucune exception. Vos fichiers sont votre propriété exclusive. paperFlow n'archive aucun document traité sans votre consentement explicite via le stockage utilisateur.
                        </p>
                    </div>
                </motion.div>

                {/* Footer Info */}
                <div className="mt-24 text-center space-y-8">
                    <div className="flex justify-center gap-12 filter grayscale opacity-30">
                        <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Server size={18} /> EU Servers</div>
                        <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><ShieldCheck size={18} /> Verified Security</div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        Questions ? <a href="mailto:privacy@paperflow.com" className="text-blue-500 border-b border-blue-500/20 pb-1">privacy@paperflow.com</a>
                    </p>
                </div>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
