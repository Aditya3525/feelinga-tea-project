'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function useFadeIn() {
    const pathname = usePathname();

    useEffect(() => {
        // Small delay to ensure DOM is fully rendered after navigation
        const timer = setTimeout(() => {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) entry.target.classList.add('visible');
                    });
                },
                { threshold: 0.1 }
            );

            const elements = document.querySelectorAll('.fade-in:not(.visible)');
            elements.forEach((el) => observer.observe(el));

            // Also watch for dynamically added elements
            const mutationObserver = new MutationObserver(() => {
                const newElements = document.querySelectorAll('.fade-in:not(.visible)');
                newElements.forEach((el) => observer.observe(el));
            });
            mutationObserver.observe(document.body, { childList: true, subtree: true });

            return () => {
                observer.disconnect();
                mutationObserver.disconnect();
            };
        }, 100);

        return () => clearTimeout(timer);
    }, [pathname]); // Re-run on route changes
}
