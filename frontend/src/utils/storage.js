import api from '../services/api';

/**
 * Upload un fichier vers le backend local au lieu de Firebase Storage
 * @param {File|Blob} file - Le fichier à uploader
 * @param {string} userId - ID de l'utilisateur (utilisé pour le dossier)
 * @param {string} folder - Dossier de destination (optionnel)
 * @returns {Promise<string|null>} - L'URL publique du fichier ou null
 */
export const uploadToStorage = async (file, userId, folder = 'general') => {
  if (!file) return null;

  try {
    // Récupérer le token JWT
    const jwt = localStorage.getItem('jwt_token');
    if (!jwt) {
      console.error("Non authentifié pour l'upload");
      return null;
    }

    // Utiliser la nouvelle méthode API pour uploader sur le backend local
    const data = await api.uploadFile(jwt, file);
    
    return data.downloadURL;
  } catch (error) {
    console.error("Storage upload error (local):", error);
    return null;
  }
};
