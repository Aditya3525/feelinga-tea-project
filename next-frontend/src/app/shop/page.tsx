'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import { useCart } from '../../context/CartContext';

function ShopInner() {
    const { addToCart } = useCart();
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: [], mood: [], origin: [], price: [] });
    const [sort, setSort] = useState('popular');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const LIMIT = 12;

    // Sync mood and search query from URL params
    useEffect(() => {
        const moodParam = searchParams.get('mood');
        if (moodParam) setFilters(prev => ({ ...prev, mood: [moodParam] }));
        const qParam = searchParams.get('q');
        if (qParam) setSearchQuery(qParam);
    }, [searchParams]);

    // Fetch products from API
    // Fetch products from API with current filters + page
    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                params.set('limit', String(LIMIT));
                params.set('page', String(page));

                // Sort
                const sortMap = { popular: '-reviewCount', newest: '-createdAt', 'price-asc': 'price', 'price-desc': '-price' };
                params.set('sort', sortMap[sort] || '-reviewCount');

                // Filters
                if (filters.type.length === 1) {
                    const typeMap = { green: 'Green Tea', black: 'Black Tea', white: 'White Tea', oolong: 'Oolong', herbal: 'Herbal', chai: 'Masala Chai' };
                    if (typeMap[filters.type[0]]) params.set('type', typeMap[filters.type[0]]);
                }
                filters.mood.forEach(m => params.append('mood', m));
                if (searchQuery) params.set('q', searchQuery);
                if (filters.price.length === 1) {
                    if (filters.price[0] === 'under500') params.set('maxPrice', '500');
                    else if (filters.price[0] === '500-999') { params.set('minPrice', '500'); params.set('maxPrice', '999'); }
                    else if (filters.price[0] === '1000-plus') params.set('minPrice', '1000');
                }

                const res = await fetch(`/api/v1/products?${params}`);
                const data = await res.json();
                if (data.data) {
                    setProducts(data.data.map(p => ({
                        id: p._id,
                        slug: p.slug,
                        name: p.name,
                        type: p.type?.toLowerCase().replace(/\s+/g, '').replace('tea', '').replace('masala', 'chai').replace('herbalinfusion', 'herbal') || '',
                        typeName: p.type,
                        moods: p.moods || [],
                        origin: p.origin?.split(',')[0]?.trim().toLowerCase() || '',
                        price: p.prices?.['100g'] || 0,
                        img: p.images?.[0] || '/images/darjeeling-tea.png',
                        note: p.shortDescription || (p.description ? p.description.substring(0, 70) + '...' : ''),
                        reviews: p.reviewCount || 0,
                        stars: Math.round(p.rating || 0) || 5,
                        badge: !p.inStock ? 'Sold Out' : null,
                        badgeColor: !p.inStock ? '#e74c3c' : undefined,
                        inStock: p.inStock,
                    })));
                    setTotalPages(data.pagination?.totalPages || 1);
                    setTotal(data.pagination?.total || data.results || 0);
                }
            } catch (err) {
                console.error('Failed to load products:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, [filters, sort, page, searchQuery]);

    const toggleFilter = (group, value) => {
        setPage(1); // reset to page 1 on filter change
        setFilters(prev => ({ ...prev, [group]: prev[group].includes(value) ? prev[group].filter(v => v !== value) : [...prev[group], value] }));
    };

    const handleSortChange = (val) => { setSort(val); setPage(1); };

    const renderStars = (count) => '★'.repeat(count) + (count < 5 ? '☆'.repeat(5 - count) : '');

    const filterGroups = [
        { key: 'type', title: 'Tea Type', options: [{ value: 'green', label: 'Green Tea' }, { value: 'black', label: 'Black Tea' }, { value: 'white', label: 'White Tea' }, { value: 'oolong', label: 'Oolong' }, { value: 'herbal', label: 'Herbal & Tisane' }, { value: 'chai', label: 'Masala Chai' }] },
        { key: 'mood', title: 'Mood / Benefit', options: [{ value: 'energize', label: 'Energize' }, { value: 'relax', label: 'Relax' }, { value: 'focus', label: 'Focus' }, { value: 'detox', label: 'Detox' }, { value: 'glow', label: 'Glow' }] },
        { key: 'origin', title: 'Origin', options: [{ value: 'darjeeling', label: 'Darjeeling' }, { value: 'assam', label: 'Assam' }, { value: 'nilgiri', label: 'Nilgiri' }, { value: 'kangra', label: 'Kangra' }] },
        { key: 'price', title: 'Price Range', options: [{ value: 'under500', label: 'Under ₹500' }, { value: '500-999', label: '₹500 – ₹999' }, { value: '1000-plus', label: '₹1,000+' }] },
    ];

    const handleAddToCart = (p) => {
        addToCart({
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: p.price,
            size: '100g',
            img: p.img,
        });
    };

    return (
        <Layout>
            <div className="page-hero">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>/</span> <span>Shop</span></nav>
                    <p className="overline">Our Collection</p>
                    <h1>Shop All Teas</h1>
                    <p>Explore our handcrafted teas sourced from India&apos;s finest estates.</p>
                </div>
            </div>
            <div className="container">
                <div className="plp-layout section">
                    <aside className={`plp-sidebar ${mobileFilterOpen ? 'active' : ''}`}>
                        {filterGroups.map(group => (
                            <div className="filter-group" key={group.key}>
                                <div className="filter-group__title">{group.title}</div>
                                <div className="filter-group__options">
                                    {group.options.map(opt => (
                                        <label className="filter-option" key={opt.value}>
                                            <input type="checkbox" value={opt.value} checked={filters[group.key].includes(opt.value)} onChange={() => toggleFilter(group.key, opt.value)} /> {opt.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </aside>
                    <div>
                        <div className="plp-topbar">
                            <button className="btn btn--sm btn--secondary mobile-filter-toggle" onClick={() => setMobileFilterOpen(!mobileFilterOpen)}>☰ Filters</button>
                            <span className="plp-topbar__count">Showing {products.length} of {total} teas</span>
                            <div className="plp-topbar__sort">
                                <select value={sort} onChange={(e) => handleSortChange(e.target.value)}>
                                    <option value="popular">Sort: Popular</option>
                                    <option value="newest">Newest</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                </select>
                            </div>
                        </div>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0' }}>
                                <div style={{ fontSize: '2rem' }}>🍵</div>
                                <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Loading teas...</p>
                            </div>
                        ) : (
                            <div className="plp-products">
                                {products.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0', gridColumn: '1 / -1' }}>
                                        <p style={{ color: 'var(--color-text-muted)' }}>No teas match your filters. Try adjusting your criteria.</p>
                                    </div>
                                ) : (
                                    products.map((p) => (
                                        <div className="product-card" key={p.id}>
                                            {p.badge && <span className="product-card__badge" style={p.badgeColor ? { background: p.badgeColor } : {}}>{p.badge}</span>}
                                            <Link href={`/product/${p.slug}`}>
                                                <div className="product-card__img"><Image src={p.img || '/images/placeholder-tea.png'} alt={p.name} width={300} height={300} style={{ objectFit: 'contain', width: '100%', height: 'auto' }} /></div>
                                            </Link>
                                            <div className="product-card__body">
                                                <div className="product-card__type">{p.typeName}</div>
                                                <Link href={`/product/${p.slug}`} className="product-card__name">{p.name}</Link>
                                                <div className="product-card__note">{p.note}</div>
                                                <div className="product-card__bottom">
                                                    <div className="product-card__price">₹{p.price.toLocaleString()}</div>
                                                    <div className="product-card__rating">{renderStars(p.stars)} <span>({p.reviews})</span></div>
                                                </div>
                                                <button className="btn btn--primary btn--sm" style={{ width: '100%', marginTop: '12px' }} onClick={() => handleAddToCart(p)} disabled={!p.inStock}>
                                                    {p.inStock ? 'Add to Cart' : 'Sold Out'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-3xl)', paddingBottom: 'var(--space-xl)' }}>
                                <button
                                    className="btn btn--ghost btn--sm"
                                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={page === 1}
                                >← Prev</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                    <button
                                        key={n}
                                        className={`btn btn--sm ${n === page ? 'btn--primary' : 'btn--ghost'}`}
                                        onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        style={{ minWidth: 38 }}
                                    >{n}</button>
                                ))}
                                <button
                                    className="btn btn--ghost btn--sm"
                                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={page === totalPages}
                                >Next →</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default function Shop() {
    return (
        <Suspense fallback={<Layout><div className="container section" style={{ textAlign: 'center', padding: '4rem 0' }}>Loading...</div></Layout>}>
            <ShopInner />
        </Suspense>
    );
}
