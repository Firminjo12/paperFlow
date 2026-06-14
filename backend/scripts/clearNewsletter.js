require('dotenv').config();
const mongoose = require('mongoose');
const Newsletter = require('../src/models/Newsletter.model');

const clearNewsletter = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connecté à MongoDB pour le nettoyage... ✅');

        const result = await Newsletter.deleteMany({});
        console.log(`${result.deletedCount} abonnés ont été supprimés. La liste est vide ! 🧹`);

        process.exit(0);
    } catch (err) {
        console.error('Erreur lors du nettoyage:', err);
        process.exit(1);
    }
};

clearNewsletter();
