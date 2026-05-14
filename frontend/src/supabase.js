// Ce fichier est un pont pour faciliter la migration de Supabase vers le nouveau backend Node.js.
// Il fournit une interface compatible pour éviter les erreurs "Module not found" et les plantages 500.

console.warn("paperFlow: Utilisation du bridge Supabase. Les composants devraient être migrés vers services/api.js.");

export const supabase = {
  auth: {
    updateUser: async ({ password }) => {
      console.log("Mock: Simulation de mise à jour du mot de passe...");
      // Simulation pour éviter les crashs
      return { data: { user: {} }, error: null };
    },
    resetPasswordForEmail: async (email) => {
      console.log("Mock: Simulation d'envoi d'email de reset pour", email);
      return { data: {}, error: null };
    }
  },
  from: (table) => ({
    select: (query) => ({
      eq: (key, val) => ({
        order: (key, options) => ({
          then: (cb) => Promise.resolve({ data: [], error: null })
        }),
        then: (cb) => Promise.resolve({ data: [], error: null })
      }),
      then: (cb) => Promise.resolve({ data: [], error: null })
    }),
    insert: (data) => ({
      then: (cb) => Promise.resolve({ data: data, error: null })
    }),
    upsert: (data) => ({
      then: (cb) => Promise.resolve({ data: data, error: null })
    })
  })
};
