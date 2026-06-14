const User = require('../models/User.model');

module.exports = async (req, res, next) => {
    try {
        // req.user est injecté par authMiddleware (contient l'id décodé du JWT)
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Non authentifié' });
        }

        const user = await User.findById(req.user.id);
        
        if (user && user.role === 'admin') {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: 'Accès refusé. Droits administrateur requis.'
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la vérification des droits' });
    }
};
