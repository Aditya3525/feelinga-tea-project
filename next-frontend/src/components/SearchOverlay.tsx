'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchOverlay({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSearch = async (e) => {
        const val = e.target.value;
        setQuery(val);
        if (val.length < 2) { setResults([]); return; }
        try {
            const res = await fetch(`/api/v1/products?q=${encodeURIComponent(val)}&limit=5`);
            const data = await res.json();
            setResults(data.data || []);
        } catch { setResults([]); }
    };

    const tags = ['Green Tea', 'Darjeeling', 'Herbal', 'Chai', 'Wellness', 'Gift Sets'];

    const handleTagClick = (tag) => {
        if (tag === 'Gift Sets') {
            router.push('/gifting');
        } else {
            router.push(`/shop?q=${encodeURIComponent(tag)}`);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="search-overlay active" role="dialog" aria-label="Search">
            <div className="search-overlay__inner">
                <div className="search-overlay__header">
                    <h3>Search Our Collection</h3>
                    <button onClick={onClose} aria-label="Close search">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="search-overlay__input-wrap">
                    <svg className="search-overlay__icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    <input ref={inputRef} type="text" className="search-overlay__input" placeholder="Search teas, flavours, moods..." value={query} onChange={handleSearch} />
                </div>
                <div className="search-overlay__tags">
                    {tags.map(tag => (
                        <button key={tag} className="search-tag" onClick={() => handleTagClick(tag)}>{tag}</button>
                    ))}
                </div>
                {results.length > 0 && (
                    <div className="search-overlay__results">
                        {results.map(product => (
                            <button key={product._id} className="search-result" onClick={() => { router.push(`/product/${product.slug}`); onClose(); }}>
                                <div className="search-result__img">{product.images?.[0] ? <img src={product.images[0]} alt={product.name} /> : '🍵'}</div>
                                <div className="search-result__info">
                                    <div className="search-result__name">{product.name}</div>
                                    <div className="search-result__type">{product.type}</div>
                                </div>
                                <div className="search-result__price">₹{product.prices?.['100g'] || product.price}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
