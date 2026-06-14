import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Mail, 
  User, 
  MessageSquare, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Github,
  Linkedin,
  MapPin,
  HelpCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import SEO from '../components/SEO';

const Contact = () => {
  const formRef = useRef();
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // 'success' | 'error' | null

  const faqs = [
    {
      question: "Mon PDF est-il sécurisé ?",
      answer: "Absolument. Nous utilisons un traitement 100% local dans votre navigateur. Vos documents ne sont jamais téléchargés sur nos serveurs.",
      icon: <ShieldCheck className="text-green-500" size={18} />
    },
    {
      question: "L'app est-elle gratuite ?",
      answer: "Oui, les fonctions de base de PaperFlow sont totalement gratuites pour tous les utilisateurs.",
      icon: <Clock className="text-blue-500" size={18} />
    },
    {
      question: "Comment signaler un bug ?",
      answer: "Utilisez simplement le formulaire ci-contre en sélectionnant 'Signaler un bug' dans le sujet.",
      icon: <AlertCircle className="text-orange-500" size={18} />
    }
  ];

  const sendEmail = (e) => {
    e.preventDefault();
    setIsSending(true);
    setSendStatus(null);

    // Initialisation d'EmailJS avec les credentials (à remplacer par les vôtres si nécessaire)
    // Pour l'instant, on utilise des placeholders pour la démonstration
    // Note: L'utilisateur devra configurer son propre Service ID, Template ID et Public Key sur emailjs.com
    emailjs.sendForm(
      'service_8fox4fq', // Votre Service ID configuré
      'template_xbuxjws', // Votre Template ID configuré
      formRef.current,
      'rHLfamwAfwAgHZm4W' // Votre Public Key configurée
    )
    .then((result) => {
        console.log(result.text);
        setSendStatus('success');
        formRef.current.reset();
    }, (error) => {
        console.error(error.text);
        // Même si la clé est un placeholder, on simule un succès pour la démo si l'utilisateur n'a pas encore configuré
        // Ou on affiche l'erreur réelle. Ici on affiche l'erreur car c'est plus propre.
        setSendStatus('error');
    })
    .finally(() => {
        setIsSending(false);
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#060912] pt-8 pb-20 px-6">
      <SEO 
        title="Contactez-nous | PaperFlow" 
        description="Une question ou une suggestion ? L'équipe PaperFlow est à votre écoute. Contactez Firmin YAMEOGO pour toute demande."
      />

      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <HelpCircle size={14} />
            Support & Contact
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic"
          >
            Parlons de <span className="text-red-600">votre projet.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto"
          >
            Que ce soit pour un bug, une suggestion ou un partenariat, nous sommes là pour vous aider à transformer votre flux de documents.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 bg-white dark:bg-[#0d1120] rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5"
          >
            <form ref={formRef} onSubmit={sendEmail} className="space-y-6">
              <input type="hidden" name="to_email" value="firminyameogo081@gmail.com" />
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom complet</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      name="name"
                      required
                      placeholder="Votre nom"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-red-500/50 transition-all font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                    <input 
                      type="email" 
                      name="user_email"
                      required
                      placeholder="votre@email.com"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-red-500/50 transition-all font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sujet</label>
                <select 
                  name="subject"
                  required
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl py-4 px-4 outline-none focus:border-red-500/50 transition-all font-bold text-slate-900 dark:text-white appearance-none"
                >
                  <option value="Question générale">Question générale</option>
                  <option value="Signaler un bug">Signaler un bug</option>
                  <option value="Suggestion d'amélioration">Suggestion d'amélioration</option>
                  <option value="Partenariat">Partenariat</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message</label>
                <div className="relative group">
                  <MessageSquare className="absolute left-4 top-6 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                  <textarea 
                    name="message"
                    required
                    placeholder="Comment pouvons-nous vous aider ?"
                    rows="5"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-red-500/50 transition-all font-medium text-slate-900 dark:text-white resize-none"
                  ></textarea>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSending}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-black uppercase text-[11px] tracking-[0.2em] py-5 rounded-[20px] shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send size={16} />
                    Envoyer le message
                  </>
                )}
              </button>

              <AnimatePresence>
                {sendStatus === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-4 rounded-2xl flex items-center gap-3 text-[11px] font-bold uppercase"
                  >
                    <CheckCircle2 size={18} />
                    Message envoyé avec succès ! Nous vous répondrons bientôt.
                  </motion.div>
                )}
                {sendStatus === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-[11px] font-bold uppercase"
                  >
                    <AlertCircle size={18} />
                    Une erreur est survenue lors de l'envoi. Veuillez réessayer.
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Side Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Direct Info Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-900 text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Firmin YAMEOGO</h3>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Fondateur & Développeur</p>
                </div>

                <div className="space-y-6">
                  <a href="mailto:firminyameogo081@gmail.com" className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors">
                      <Mail size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Contact Email</span>
                      <span className="text-[11px] font-black group-hover:text-red-400 transition-colors">firminyameogo081@gmail.com</span>
                    </div>
                  </a>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                      <MapPin size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Localisation</span>
                      <span className="text-[11px] font-black">Ouagadougou, Burkina Faso</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <a href="https://github.com/Firminjo12" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/10 hover:bg-white rounded-2xl flex items-center justify-center hover:text-slate-900 transition-all hover:-translate-y-1">
                    <Github size={20} />
                  </a>
                  <a href="https://linkedin.com/in/firmin-yameogo-59047a38b" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/10 hover:bg-white rounded-2xl flex items-center justify-center hover:text-slate-900 transition-all hover:-translate-y-1">
                    <Linkedin size={20} />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* FAQ Summary */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Questions rapides</h3>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
                    <div className="flex items-center gap-2 font-black text-[11px] text-slate-900 dark:text-white uppercase tracking-tight">
                      {faq.icon}
                      {faq.question}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
