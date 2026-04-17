import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Met à jour l'état pour que le prochain rendu affiche l'UI de secours.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Vous pouvez aussi enregistrer l'erreur dans un service de rapport d'erreurs
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Vous pouvez afficher n'importe quelle UI de secours
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-8 text-center space-y-6">
                    <h1 className="text-4xl font-black text-red-500">Un problème inattendu est survenu.</h1>
                    <p className="text-lg text-slate-500 max-w-md">L'application a rencontré une erreur lors de l'affichage de cette section. Ne vous inquiétez pas, vos données ne sont pas altérées.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
                    >
                        Rafraîchir la page
                    </button>
                    <details className="text-left bg-slate-100 p-4 rounded-lg text-xs font-mono text-slate-600 overflow-auto max-w-2xl w-full">
                        <summary className="font-bold cursor-pointer mb-2">Détails techniques :</summary>
                        {this.state.error && this.state.error.toString()}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
