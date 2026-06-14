# Guide de Validation Google AdSense (paperFlow)

Google AdSense a des critères de validation très stricts, notamment pour les sites d'outils (PDF, convertisseurs) qui sont souvent jugés comme ayant un "contenu de faible valeur" (Thin Content). J'ai apporté les modifications nécessaires pour corriger cela.

## ✅ Modifications apportées pour la conformité

### 1. Création des pages légales obligatoires
AdSense exige que chaque site dispose de deux pages distinctes et accessibles :
- **Politique de Confidentialité** : Mise à jour pour inclure la clause obligatoire sur les cookies tiers Google AdSense (Section 5).
- **Conditions Générales d'Utilisation (TOS)** : Créée de toutes pièces (`/terms`) pour définir les règles d'utilisation du site.

### 2. Augmentation de la "Valeur" du contenu (SEO)
Les robots d'AdSense rejettent les sites qui n'ont que des boutons ou des formulaires. J'ai ajouté :
- Une section **"Pourquoi choisir paperFlow ?"** sur la page d'accueil avec des descriptions détaillées.
- Une section **"Foire Aux Questions" (FAQ)** pour répondre aux questions courantes et apporter du texte sémantique riche.

### 3. Navigation Transparente
- Les liens vers **Confidentialité**, **Conditions** et **Contact** sont désormais clairement affichés dans le `Footer`. Cela prouve à Google que votre site est administré de manière professionnelle.

---

## 🚀 Prochaines étapes pour vous

Suivez ces instructions pour relancer la validation :

1. **Vérifiez votre domaine** :
   - Si vous utilisez un sous-domaine (ex: `paperflow.netlify.app`), Google peut le rejeter. Il est fortement recommandé d'utiliser un domaine personnalisé (ex: `paperflow.app` ou `paperflow.fr`).
   - Assurez-vous que le lien canonique dans `index.html` correspond à votre URL finale.

2. **Fichier ads.txt** :
   - Vérifiez que vous pouvez accéder à `votre-domaine.com/ads.txt`.
   - Il doit contenir exactement : `google.com, pub-1484707374547180, DIRECT, f08c47fec0942fa0`.

3. **Demandez un réexamen** :
   - Allez dans votre [Console Google AdSense](https://www.google.com/adsense/).
   - Accédez à la section **Sites**.
   - Cliquez sur votre site et sélectionnez **"Demander un examen"**.

4. **Vider le Cache** :
   - Si vous avez déjà déployé, n'oubliez pas de purger le cache de votre hébergeur (Netlify, Vercel, etc.) pour que les robots de Google voient les nouvelles sections FAQ et les liens légaux.

> [!TIP]
> Si Google rejette encore pour "Contenu de faible valeur", la solution ultime est d'ajouter un **Blog** ou une page **Articles** expliquant comment utiliser chaque outil (ex: "Pourquoi compresser un PDF avant de l'envoyer par email ?").
