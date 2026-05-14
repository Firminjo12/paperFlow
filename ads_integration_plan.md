# Plan d'Intégration Publicitaire (SignFlow)

Ce document décrit comment intégrer des publicités (Google AdSense ou partenaires) de manière optimale dans votre application d'outils PDF sans dégrader l'expérience utilisateur.

## 1. Composant Publicitaire Réutilisable
J'ai déjà créé le composant `GoogleAd.jsx` dans `src/components/`.
Ce composant gère l'initialisation de `adsbygoogle` et fournit un cadre stylisé "premium" qui s'adapte aux thèmes clair et sombre.

> [!IMPORTANT]
> Avant de déployer, remplacez `ca-pub-XXXXXXXXXXXXXXXX` par votre véritable ID d'éditeur Google AdSense dans `GoogleAd.jsx`.

## 2. Emplacements Stratégiques

### Page d'Accueil (Home)
- **Top Banner (Hero)** : Sous le titre principal pour capter l'attention dès l'arrivée. (Déjà intégré)
- **Grid Placement** : Une publicité déguisée en carte d'outil entre les catégories.

### Outils PDF (Tools)
- **Post-Action** : Afficher une publicité sur la page de succès (ex: après une fusion ou une signature). C'est le moment d'engagement maximal.
- **Sticky Footer** : Une bannière discrète en bas de page lors de l'édition.

### Tableau de Bord (Dashboard)
- **Sidebar Ad** : Si vous choisissez d'ajouter une barre latérale, c'est un emplacement idéal pour des annonces contextuelles.

## 3. Exemple d'Intégration dans un Outil (Succès)

```jsx
// Dans MergeTool.jsx ou SignTool (App.jsx)
{mergedFile && (
    <div className="space-y-8">
        <SuccessMessage />
        <GoogleAd slot="XXXXXXXXXX" format="rectangle" />
        <ActionButtons />
    </div>
)}
```

## 4. Configuration Google AdSense (HTML)

Ajoutez le script d'initialisation dans votre fichier `index.html` (dans le dossier `frontend`) :

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

## 5. Prochaines Étapes proposées
1.  **Sidebar publicitaire** : Ajouter une zone sur le côté dans les outils de conversion.
2.  **Ads Native** : Créer des cartes d'outils sponsorisés dans la grille d'accueil.
3.  **Mode Premium** : Option pour retirer les publicités via un abonnement.
