import React from 'react';
import { useActions } from '../context/ActionContext';
import TransferModal from './TransferModal';

const GlobalActions = () => {
    const { pendingAction, clearAction } = useActions();

    return (
        <>
            <TransferModal
                isOpen={pendingAction?.type === 'TRANSFER'}
                onClose={clearAction}
                initialData={pendingAction?.payload}
            />
            {/* Add more action modals here as they are developed */}
        </>
    );
};

export default GlobalActions;
