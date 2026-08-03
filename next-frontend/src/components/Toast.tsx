'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AppProviderProps, ToastContextValue, ToastItem, ToastType } from '../types/app';

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: AppProviderProps) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', img?: string) => {
        const id = Date.now();
        setToasts((prev: ToastItem[]) => [...prev, { id, message, type, img }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev: ToastItem[]) => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container" aria-live="polite" aria-atomic="true">
                {toasts.map(t => (
                    <ToastComponent key={t.id} toast={t} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastComponent({ toast, onRemove }: { toast: ToastItem; onRemove: (id: number) => void }) {
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const frame = requestAnimationFrame(() => setIsActive(true));
        
        // Trigger exit animation before unmounting
        const exitTimer = setTimeout(() => {
            setIsActive(false);
        }, 3000); // starts fade out 500ms before removal

        const removeTimer = setTimeout(() => {
            onRemove(toast.id);
        }, 3500);

        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [toast.id, onRemove]);

    return (
        <div className={`toast toast--${toast.type} ${isActive ? 'active' : ''}`}>
            {toast.img && <img src={toast.img} alt="" width={32} height={32} className="toast__img" />}
            <span className="toast__message">{toast.message}</span>
        </div>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
