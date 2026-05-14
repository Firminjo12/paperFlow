/**
 * Configuration Google AdSense pour paperFlow
 * Remplacez les valeurs par celles fournies par votre tableau de bord Google AdSense.
 */

export const ADS_CONFIG = {
    // Votre ID Editeur (commence par ca-pub-)
    PUBLISHER_ID: "ca-pub-1484707374547180", // <--- À Remplacer ici
    
    // IDs des blocs d'annonces (Slots)
    SLOTS: {
        HOME_HERO: "7958923248",   // Annonce sous le titre d'accueil
        HOME_GRID: "XXXXXXXXXX",   // Annonce dans la grille des outils
        TOOL_SUCCESS: "XXXXXXXXXX", // Annonce affichée après une action réussie
        SIDEBAR: "XXXXXXXXXX",      // Annonce latérale
    }
};

export default ADS_CONFIG;
