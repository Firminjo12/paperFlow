import React, { createContext, useContext, useState } from 'react';
import RatingModal from '../components/RatingModal';

const FeedbackContext = createContext();

export const useFeedback = () => useContext(FeedbackContext);

export const FeedbackProvider = ({ children }) => {
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    const triggerFeedback = () => {
        // Trigger with a small delay for better UX after download starts
        setTimeout(() => {
            setIsRatingModalOpen(true);
        }, 1500);
    };

    return (
        <FeedbackContext.Provider value={{ triggerFeedback }}>
            {children}
            <RatingModal 
                isOpen={isRatingModalOpen} 
                onClose={() => setIsRatingModalOpen(false)} 
            />
        </FeedbackContext.Provider>
    );
};
