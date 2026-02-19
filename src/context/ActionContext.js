import React, { createContext, useState, useContext } from 'react';

const ActionContext = createContext();

export const useActions = () => useContext(ActionContext);

export const ActionProvider = ({ children }) => {
    const [pendingAction, setPendingAction] = useState(null);

    const triggerAction = (type, payload) => {
        console.log(`Triggering action: ${type}`, payload);
        setPendingAction({ type, payload });
    };

    const clearAction = () => setPendingAction(null);

    return (
        <ActionContext.Provider value={{ pendingAction, triggerAction, clearAction }}>
            {children}
        </ActionContext.Provider>
    );
};
