'use client';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../components/Toast';
import AuthModal from '../components/AuthModal';
import useFadeIn from '../hooks/useFadeIn';

export default function Providers({ children }) {
    useFadeIn();
    return (
        <ThemeProvider>
            <AuthProvider>
                <CartProvider>
                    <ToastProvider>
                        <AuthModal />
                        {children}
                    </ToastProvider>
                </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
