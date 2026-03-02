'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext<any>(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', img) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, img }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container" aria-live="polite" aria-atomic="true">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast--${t.type}`}>
                        {t.img && <img src={t.img} alt="" width={32} height={32} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() { return useContext(ToastContext); }
