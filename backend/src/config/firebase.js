const admin = require('firebase-admin');

// Pour le développement local, l'initialisation par le Project ID est suffisante
// pour vérifier les tokens ID de Firebase.
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: "signflow-login-25apr"
  });
}

module.exports = admin;
