const API_URL = import.meta.env.VITE_API_URL || 'https://paperflow-vdnd.onrender.com/api';

const api = {
  // Auth
  register: (data) =>
    fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de l\'inscription');
      return data;
    }),

  login: (data) =>
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la connexion');
      return data;
    }),

  googleLogin: (idToken) =>
    fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentification Google échouée');
      return data;
    }),

  getMe: (jwt) =>
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${jwt}` }
    }).then(r => r.json()),

  updateProfile: (jwt, data) =>
    fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  forgotPassword: (email) =>
    fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(r => r.json()),

// Signatures
  getSignatures: (jwt) =>
    fetch(`${API_URL}/signatures`, {
      headers: { Authorization: `Bearer ${jwt}` }
    }).then(r => r.json()),

  saveSignature: (jwt, data) =>
    fetch(`${API_URL}/signatures`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        new BroadcastChannel('paperflow_dashboard').postMessage('RELOAD_DASHBOARD');
      }
      return data;
    }),

  deleteSignature: (jwt, id) =>
    fetch(`${API_URL}/signatures/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${jwt}` }
    }).then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        new BroadcastChannel('paperflow_dashboard').postMessage('RELOAD_DASHBOARD');
      }
      return data;
    }),

  // Documents
  getHistory: (jwt) =>
    fetch(`${API_URL}/documents/history?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${jwt}` }
    }).then(r => r.json()),

  logDocument: (jwt, data) =>
    fetch(`${API_URL}/documents/log`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(async (res) => {
      const result = await res.json();
      if (res.ok) {
        new BroadcastChannel('paperflow_dashboard').postMessage('RELOAD_DASHBOARD');
      }
      return result;
    }),

  // Reviews
  getReviews: (status) => {
    const url = status ? `${API_URL}/reviews?status=${status}` : `${API_URL}/reviews`;
    return fetch(url).then(r => r.json());
  },

  postReview: (jwt, data) =>
    fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  getReviewStats: () =>
    fetch(`${API_URL}/reviews/stats`).then(r => r.json()),

  // Stats
  getMyStats: (jwt) =>
    fetch(`${API_URL}/stats/me?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${jwt}` }
    }).then(r => r.json()),

  // Conversions LibreOffice Backend
  convertFile: async (jwt, routePath, file, onServerWakeup) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = jwt || localStorage.getItem('jwt_token');
    
    // Si pas de token, on lève une erreur côté client avant d'appeler le backend (qui rejetterait en 401)
    if (!token) {
        throw new Error("Veuillez vous connecter pour utiliser cet outil.");
    }

    const headers = { 
        'Authorization': `Bearer ${token}` 
    };

    try {
      let res = await fetch(`${API_URL}/convert/${routePath}`, {
        method: 'POST',
        headers,
        body: formData
      }).catch(err => ({ ok: false, status: 502, err }));

      // Si erreur 502 (Bad Gateway), 504 (Timeout) ou fetch error = Cold Start de Render
      if (res.status === 502 || res.status === 504 || (res.err && res.err.message.includes('fetch'))) {
          if (onServerWakeup) onServerWakeup();
          // Attendre 30s que Render se réveille
          await new Promise(resolve => setTimeout(resolve, 30000));
          res = await fetch(`${API_URL}/convert/${routePath}`, {
            method: 'POST',
            headers,
            body: formData
          });
      }

      if (!res.ok) {
          let msg = "Erreur de conversion";
          try {
              const data = await res.json();
              msg = data.message || msg;
          } catch(e) {}
          throw new Error(msg);
      }
      
      const blob = await res.blob();
      return blob;
    } catch(err) {
      throw err;
    }
  },

  // Storage local
  uploadFile: async (jwt, file) => {
    const formData = new FormData();
    
    // On s'assure que le fichier a un nom correct avec une extension .pdf
    const fileName = file.name || `document_${Date.now()}.pdf`;
    const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    
    formData.append('file', file, finalFileName);

    const res = await fetch(`${API_URL}/storage/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`
      },
      body: formData
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Erreur d'upload");
    }

    return await res.json(); // Retourne { downloadURL, filename }
  },

  // Newsletter
  subscribeNewsletter: (email) =>
    fetch(`${API_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur d\'abonnement');
      return data;
    }),

  unsubscribeNewsletter: (email) =>
    fetch(`${API_URL}/newsletter/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur de désabonnement');
      return data;
    }),

  sendBulkNewsletter: (jwt, data) =>
    fetch(`${API_URL}/newsletter/send-bulk`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data)
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de l\'envoi');
      return data;
    }),

  // Modération des avis
  updateReviewStatus: (jwt, id, status) =>
    fetch(`${API_URL}/reviews/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la mise à jour');
      return data;
    }),

  deleteReview: (jwt, id) =>
    fetch(`${API_URL}/reviews/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt}` }
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la suppression');
      return data;
    })
};

export default api;
