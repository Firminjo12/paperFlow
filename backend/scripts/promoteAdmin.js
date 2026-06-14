require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User.model');

const promoteUser = async (email) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connecté à MongoDB... ✅');

        const user = await User.findOneAndUpdate(
            { email: email },
            { role: 'admin' },
            { new: true }
        );

        if (user) {
            console.log(`Succès ! L'utilisateur ${email} est maintenant ADMIN. 👑`);
        } else {
            console.log(`Erreur : Aucun utilisateur trouvé avec l'email ${email}.`);
            console.log('Assurez-vous de vous être déjà connecté au moins une fois sur le site local.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
};

const email = process.argv[2] || 'firminyameogo081@gmail.com';
promoteUser(email);
