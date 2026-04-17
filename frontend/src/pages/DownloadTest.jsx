import React, { useEffect, useState } from 'react';

const DownloadTest = () => {
  const [status, setStatus] = useState('Prêt pour le test');
  const [error, setError] = useState(null);

  const runTest = async () => {
    setStatus('Exécution du test...');
    try {
      // 1. Création d'un Blob de test (un fichier texte simple)
      const content = "Ceci est un test de téléchargement SignFlow.";
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const filename = "test_signflow.txt";

      console.log("Blob créé avec succès, URL:", url);

      // 2. Simulation de la fonction downloadResult du SmartConverter
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      link.setAttribute('target', '_blank');
      link.style.display = 'block';
      link.style.width = '0';
      link.style.height = '0';
      link.style.position = 'fixed';
      link.style.top = '-100px';
      
      document.body.appendChild(link);
      console.log("Lien ajouté au DOM, déclenchement du clic...");
      link.click();
      
      setStatus('Test réussi ! Le téléchargement a été déclenché.');

      // 3. Nettoyage
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
          console.log("Lien supprimé du DOM.");
        }
        // On ne révoque pas l'URL immédiatement pour laisser le temps au navigateur
      }, 2000);

    } catch (err) {
      console.error("Échec du test:", err);
      setError(err.message);
      setStatus('Échec du test.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Test de Téléchargement SignFlow</h1>
      <div style={{ 
        padding: '15px', 
        borderRadius: '8px', 
        backgroundColor: error ? '#fee2e2' : '#f0f9ff',
        border: `1px solid ${error ? '#ef4444' : '#0ea5e9'}`,
        marginBottom: '20px'
      }}>
        <strong>Statut :</strong> {status}
      </div>
      {error && (
        <div style={{ color: '#ef4444', marginBottom: '20px' }}>
          <strong>Erreur :</strong> {error}
        </div>
      )}
      <button 
        onClick={runTest}
        style={{
          padding: '10px 20px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Lancer le test de téléchargement
      </button>
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
        <p>Ce test vérifie si votre navigateur autorise la création de Blobs et le déclenchement de téléchargements programmatiques.</p>
        <p>Si rien ne se passe, vérifiez si votre navigateur bloque les fenêtres surgissantes ou les téléchargements automatiques.</p>
      </div>
    </div>
  );
};

export default DownloadTest;
