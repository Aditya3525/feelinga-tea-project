import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Verify Email — Feelinga',
    description: 'Verify your Feelinga account email address.',
    robots: { index: false, follow: false },
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
    return children;
}
