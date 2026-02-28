'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect bare /product to /shop — individual products use /product/[slug]
export default function ProductRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/shop');
    }, [router]);
    return null;
}



