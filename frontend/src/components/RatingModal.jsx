import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, CheckCircle2, AlertCircle, WifiOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const RatingModal = ({ isOpen, onClose, onReset }) => {
    const { jwt } = useAuth();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");
    const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState("");

    // Reset state whenever the modal opens
    useEffect(() => {
        if (isOpen) {
            setRating(0);
            setHover(0);
            setComment("");
            setStatus('idle');
            setErrorMessage("");
        }
    }, [isOpen]);

    const handleActionAndClose = () => {
        onClose();
        if (onReset) onReset();
    };

    const handleSubmit = async () => {
        if (rating === 0 || status === 'submitting') return;

        setStatus('submitting');
        setErrorMessage("");

        try {
            if (!jwt) {
                throw new Error("Vous devez être connecté (ou inscrit) pour laisser un avis sur SignFlow.");
            }

            if (!navigator.onLine) {
                throw new Error("Pas de connexion internet déctectée.");
            }

            const dataToInsert = {
                rating: rating,
                comment: comment,
                user_name: "Utilisateur SignFlow",
                source: 'web_editor'
            };

            // On lance la requête avec un timeout
            await Promise.race([
                api.postReview(jwt, dataToInsert),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("La connexion a pris trop de temps.")), 6000)
                )
            ]);

            setStatus('success');

            setTimeout(() => {
                handleActionAndClose();
            }, 2000);

        } catch (error) {
            console.error("Submission error:", error);
            setStatus('error');

            if (error.message && error.message.includes("trop de temps")) {
                setErrorMessage("Le serveur ne répond pas. Vérifiez votre connexion.");
            } else if (!navigator.onLine) {
                setErrorMessage("Pas de connexion Internet.");
            } else {
                setErrorMessage(error.message || "Une erreur est survenue lors de l'envoi.");
            }
        }
    };

    // If we are not open and there is no reason to be in the DOM, return null
    // This helps avoid the "removeChild" error by not having unnecessary portal nodes
    if (!isOpen && status === 'idle') return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <div key="rating-modal-wrapper" className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm shadow-2xl"
                    />

                    <motion.div
                        key="modal-content"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-white/10"
                    >
                        {status === 'success' ? (
                            <div className="p-12 text-center space-y-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-green-100 dark:bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto"
                                >
                                    <CheckCircle2 size={40} />
                                </motion.div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Merci pour votre avis ! ⭐</h2>
                                <p className="text-slate-500 dark:text-slate-400">Il nous aide énormément à grandir.</p>
                            </div>
                        ) : (
                            <div className="p-8">
                                <div className="text-center space-y-2 mb-8">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        Vous avez aimé SignFlow ?
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                        Votre avis nous aide à améliorer l'application.
                                    </p>
                                </div>

                                <div className="flex justify-center gap-2 mb-8">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHover(star)}
                                            onMouseLeave={() => setHover(0)}
                                            className="focus:outline-none transition-transform active:scale-90 p-1"
                                            disabled={status === 'submitting'}
                                        >
                                            <Star
                                                size={40}
                                                className={`${star <= (hover || rating)
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-slate-200 dark:text-slate-700'
                                                    } transition-colors duration-200 pointer-events-none`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Ce que vous avez pensé de l'expérience... (optionnel)"
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white overflow-hidden resize-none"
                                            rows="3"
                                            disabled={status === 'submitting'}
                                        ></textarea>
                                    </div>

                                    {status === 'error' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm"
                                        >
                                            {navigator.onLine ? <AlertCircle size={18} /> : <WifiOff size={18} />}
                                            <p className="font-medium">{errorMessage}</p>
                                        </motion.div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleActionAndClose}
                                            disabled={status === 'submitting'}
                                            className="flex-1 py-4 text-slate-400 dark:text-slate-500 font-bold text-sm hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-30"
                                        >
                                            Plus tard
                                        </button>
                                        <button
                                            type="button"
                                            disabled={rating === 0 || status === 'submitting'}
                                            onClick={handleSubmit}
                                            className={`flex-[2] py-4 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${rating === 0
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                : 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none hover:bg-blue-700'
                                                }`}
                                        >
                                            {status === 'submitting' ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Envoi en cours...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={18} />
                                                    <span>{status === 'error' ? 'Réessayer' : 'Envoyer mon avis'}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default RatingModal;
