import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  MessageSquare, 
  Filter,
  User,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

const AdminReviews = () => {
    const { jwt } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const data = await api.getReviews(); // Récupère tout
            setReviews(data);
        } catch (error) {
            console.error("Erreur chargement avis:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.updateReviewStatus(jwt, id, newStatus);
            setReviews(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
        } catch (error) {
            alert("Erreur lors de la mise à jour");
        }
    };

    const handleDelete = async () => {
        try {
            await api.deleteReview(jwt, confirmDelete.id);
            setReviews(prev => prev.filter(r => r._id !== confirmDelete.id));
            setConfirmDelete({ show: false, id: null });
        } catch (error) {
            alert("Erreur lors de la suppression");
        }
    };

    const filteredReviews = reviews.filter(r => {
        if (filter === 'all') return true;
        return r.status === filter;
    });

    const getStatusStyle = (status) => {
        switch(status) {
            case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'rejected': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#0a0a0c]">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-blue-500" />
                            Gestion des Avis
                        </h1>
                        <p className="text-gray-400">Modérez les retours de vos utilisateurs</p>
                    </div>

                    <div className="flex bg-[#16161a] p-1 rounded-xl border border-white/5">
                        {['all', 'pending', 'approved', 'rejected'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    filter === f 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : 'text-gray-400 hover:text-white'
                                } capitalize`}
                            >
                                {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : f === 'approved' ? 'Approuvés' : 'Rejetés'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode='popLayout'>
                            {filteredReviews.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20 bg-[#16161a] rounded-2xl border border-white/5"
                                >
                                    <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">Aucun avis trouvé pour cette catégorie</p>
                                </motion.div>
                            ) : (
                                filteredReviews.map((review) => (
                                    <motion.div
                                        key={review._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-[#16161a] border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all group"
                                    >
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* User Info */}
                                            <div className="md:w-48 flex-shrink-0">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                        {review.user_id?.full_name?.charAt(0) || <User className="w-5 h-5"/>}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-white font-medium truncate">
                                                            {review.user_id?.full_name || 'Utilisateur'}
                                                        </p>
                                                        <div className="flex items-center text-xs text-gray-500 gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star 
                                                            key={i} 
                                                            className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} 
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-grow">
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(review.status)}`}>
                                                        {review.status === 'approved' ? 'Visible' : review.status === 'rejected' ? 'Masqué' : 'En attente'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 leading-relaxed italic">
                                                    "{review.comment || 'Sans commentaire'}"
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex md:flex-col gap-2 justify-end">
                                                {review.status !== 'approved' && (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(review._id, 'approved')}
                                                        className="p-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-lg shadow-emerald-500/5"
                                                        title="Approuver"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {review.status !== 'rejected' && (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(review._id, 'rejected')}
                                                        className="p-3 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-lg shadow-amber-500/5"
                                                        title="Rejeter"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => setConfirmDelete({ show: true, id: review._id })}
                                                    className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-lg shadow-rose-500/5"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <ConfirmationModal 
                isOpen={confirmDelete.show}
                title="Supprimer cet avis ?"
                message="Cette action est irréversible. L'avis sera définitivement effacé de la base de données."
                onConfirm={handleDelete}
                onClose={() => setConfirmDelete({ show: false, id: null })}
                confirmText="Oui, supprimer"
                type="danger"
            />
        </div>
    );
};

export default AdminReviews;
