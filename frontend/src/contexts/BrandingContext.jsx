import React, { createContext, useContext, useState, useEffect } from 'react';

const BrandingContext = createContext();

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider = ({ children }) => {
    const [primaryColor, setPrimaryColor] = useState(() => {
        return localStorage.getItem('paperflow_primary_color') || '#2563eb';
    });
    const [logo, setLogo] = useState(() => {
        return localStorage.getItem('paperflow_custom_logo') || null;
    });

    useEffect(() => {
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        localStorage.setItem('paperflow_primary_color', primaryColor);
    }, [primaryColor]);

    useEffect(() => {
        if (logo) {
            localStorage.setItem('paperflow_custom_logo', logo);
        } else {
            localStorage.removeItem('paperflow_custom_logo');
        }
    }, [logo]);

    const resetBranding = () => {
        setPrimaryColor('#2563eb');
        setLogo(null);
    };

    return (
        <BrandingContext.Provider value={{ primaryColor, setPrimaryColor, logo, setLogo, resetBranding }}>
            {children}
        </BrandingContext.Provider>
    );
};
