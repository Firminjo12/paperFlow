import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [jwt, setJwt] = useState(localStorage.getItem('jwt_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('jwt_token');
            if (token) {
                try {
                    const userData = await api.getMe(token);
                    if (userData && !userData.message) {
                        setUser(userData);
                        setJwt(token);
                    } else {
                        localStorage.removeItem('jwt_token');
                        setJwt(null);
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Erreur session:", error);
                    localStorage.removeItem('jwt_token');
                    setJwt(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);

    const login = async (email, password) => {
        const { jwt_token, user: userData } = await api.login({ email, password });
        localStorage.setItem('jwt_token', jwt_token);
        setJwt(jwt_token);
        setUser(userData);
        return { jwt_token, user: userData };
    };

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            const { jwt_token, user: userData } = await api.googleLogin(idToken);
            localStorage.setItem('jwt_token', jwt_token);
            setJwt(jwt_token);
            setUser(userData);
            return { jwt_token, user: userData };
        } catch (error) {
            console.error("Firebase/Google Error:", error);
            throw error;
        }
    };

    const register = async (email, password, fullName) => {
        const { jwt_token, user: userData } = await api.register({ email, password, full_name: fullName });
        localStorage.setItem('jwt_token', jwt_token);
        setJwt(jwt_token);
        setUser(userData);
        return { jwt_token, user: userData };
    };

    const signOut = () => {
        localStorage.removeItem('jwt_token');
        setJwt(null);
        setUser(null);
    };

    const resetPassword = async (email) => {
        const response = await api.forgotPassword(email);
        return response;
    };

    const fetchProfile = async () => {
        if (!jwt) return;
        try {
            const userData = await api.getMe(jwt);
            setUser(userData);
            return userData;
        } catch (error) {
            console.error("Fetch user data failed:", error);
        }
    };

    const updateProfile = async (data) => {
        if (!jwt) return;
        const updatedUser = await api.updateProfile(jwt, data);
        setUser(updatedUser);
        return updatedUser;
    };

    const value = {
        user,
        jwt,
        loading,
        login,
        loginWithGoogle,
        register,
        signOut,
        resetPassword,
        fetchProfile,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
