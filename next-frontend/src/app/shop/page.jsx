'use client';
import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import { useCart } from '../../context/CartContext';

const allProducts = [
    { name: 'Classic Assam Breakfast', type: 'black', typeName: 'Black Tea', mood: 'energize', origin: 'assam', price: 499, date: 6, img: '/images/darjeeling-tea.png', note: 'Bold, malty with rich amber liquor', reviews: 156, stars: 5 },
    { name: 'Himalayan Green Reserve', type: 'green', typeName: 'Green Tea', mood: 'focus', origin: 'darjeeling', price: 599, date: 5, img: '/images/green-tea.png', note: 'Light, refreshing with vegetal notes', reviews: 203, stars: 5 },
    { name: 'Heritage Spiced Chai', type: 'chai', typeName: 'Masala Chai', mood: 'energize', origin: 'assam', price: 399, date: 10, img: '/images/masala-chai.png', note: 'Warm spices with CTC tea base', reviews: 312, stars: 5, badge: 'Best Seller', badgeColor: 'var(--color-gold)' },
    { name: 'Moonlight White Peony', type: 'white', typeName: 'White Tea', mood: 'relax', origin: 'darjeeling', price: 899, date: 12, img: '/images/white-tea.png', note: 'Delicate floral with honey sweetness', reviews: 24, stars: 5, badge: 'New' },
    { name: 'Turmeric Golden Glow', type: 'herbal', typeName: 'Herbal', mood: 'glow', origin: 'nilgiri', price: 549, date: 8, img: '/images/herbal-tea.png', note: 'Anti-inflammatory wellness blend', reviews: 89, stars: 5 },
    { name: 'Rose Chamomile Dream', type: 'herbal', typeName: 'Herbal Infusion', mood: 'relax', origin: 'nilgiri', price: 649, date: 11, img: '/images/herbal-tea.png', note: 'Soothing blend of rose petals & chamomile', reviews: 18, stars: 5, badge: 'New' },
    { name: 'Darjeeling Muscatel Oolong', type: 'oolong', typeName: 'Oolong', mood: 'focus', origin: 'darjeeling', price: 1199, date: 9, img: '/images/oolong-tea.png', note: 'Rich muscatel grape with malty depth', reviews: 12, stars: 5 },
    { name: 'Spring Flush Sencha', type: 'green', typeName: 'Green Tea', mood: 'detox', origin: 'kangra', price: 749, date: 7, img: '/images/green-tea.png', note: 'Bright, grassy with umami finish', reviews: 31, stars: 4 },
    { name: 'First Flush Darjeeling', type: 'black', typeName: 'Black Tea', mood: 'energize', origin: 'darjeeling', price: 1299, date: 4, img: '/images/darjeeling-tea.png', note: 'Exquisite muscatel with floral body', reviews: 78, stars: 5, badge: 'Limited', badgeColor: 'var(--color-gold)' },
    { name: 'Peppermint Detox', type: 'herbal', typeName: 'Herbal', mood: 'detox', origin: 'nilgiri', price: 479, date: 3, img: '/images/green-tea.png', note: 'Cool, cleansing with digestive benefits', reviews: 56, stars: 4 },
    { name: 'Ceremonial Matcha', type: 'green', typeName: 'Green Tea', mood: 'glow', origin: 'kangra', price: 1190, date: 2, img: '/images/matcha-tea.png', note: 'Premium Japanese-style stone-ground', reviews: 44, stars: 5 },
    { name: 'Silver Needle White', type: 'white', typeName: 'White Tea', mood: 'relax', origin: 'darjeeling', price: 1899, date: 1, img: '/images/white-tea.png', note: 'Rare buds with delicate sweetness', reviews: 19, stars: 5, badge: 'Rare', badgeColor: 'var(--color-gold)' },
];

function ShopInner() {
    const { addToCart } = useCart();
    const searchParams = useSearchParams();
    const [filters, setFilters] = useState({ type: [], mood: [], origin: [], price: [] });
    const [sort, setSort] = useState('popular');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    useEffect(() => {
        const moodParam = searchParams.get('mood');
        if (moodParam) setFilters(prev => ({ ...prev, mood: [moodParam] }));
    }, [searchParams]);

    const toggleFilter = (group, value) => {
        setFilters(prev => ({ ...prev, [group]: prev[group].includes(value) ? prev[group].filter(v => v !== value) : [...prev[group], value] }));
    };

    const filtered = useMemo(() => {
        let result = [...allProducts];
        if (filters.type.length > 0) result = result.filter(p => filters.type.includes(p.type));
        if (filters.mood.length > 0) result = result.filter(p => filters.mood.includes(p.mood));
        if (filters.origin.length > 0) result = result.filter(p => filters.origin.includes(p.origin));
        if (filters.price.length > 0) result = result.filter(p => filters.price.some(pr => pr === 'under500' ? p.price < 500 : pr === '500-999' ? p.price >= 500 && p.price <= 999 : pr === '1000-plus' ? p.price >= 1000 : true));
        switch (sort) { case 'price-asc': result.sort((a, b) => a.price - b.price); break; case 'price-desc': result.sort((a, b) => b.price - a.price); break; case 'newest': result.sort((a, b) => b.date - a.date); break; default: result.sort((a, b) => b.reviews - a.reviews); }
        return result;
    }, [filters, sort]);

    const renderStars = (count) => '★'.repeat(count) + (count < 5 ? '☆'.repeat(5 - count) : '');

    const filterGroups = [
        { key: 'type', title: 'Tea Type', options: [{ value: 'green', label: 'Green Tea' }, { value: 'black', label: 'Black Tea' }, { value: 'white', label: 'White Tea' }, { value: 'oolong', label: 'Oolong' }, { value: 'herbal', label: 'Herbal & Tisane' }, { value: 'chai', label: 'Masala Chai' }] },
        { key: 'mood', title: 'Mood / Benefit', options: [{ value: 'energize', label: 'Energize' }, { value: 'relax', label: 'Relax' }, { value: 'focus', label: 'Focus' }, { value: 'detox', label: 'Detox' }, { value: 'glow', label: 'Glow' }] },
        { key: 'origin', title: 'Origin', options: [{ value: 'darjeeling', label: 'Darjeeling' }, { value: 'assam', label: 'Assam' }, { value: 'nilgiri', label: 'Nilgiri' }, { value: 'kangra', label: 'Kangra' }] },
        { key: 'price', title: 'Price Range', options: [{ value: 'under500', label: 'Under ₹500' }, { value: '500-999', label: '₹500 – ₹999' }, { value: '1000-plus', label: '₹1,000+' }] },
    ];

    return (
        <Layout>
            <div className="page-hero">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>/</span> <span>Shop</span></nav>
                    <p className="overline">Our Collection</p>
                    <h1>Shop All Teas</h1>
                    <p>Explore 50+ handcrafted teas sourced from India&apos;s finest estates.</p>
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
                            <span className="plp-topbar__count">Showing {filtered.length} teas</span>
                            <div className="plp-topbar__sort">
                                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                    <option value="popular">Sort: Popular</option>
                                    <option value="newest">Newest</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                </select>
                            </div>
                        </div>
                        <div className="plp-products">
                            {filtered.map((p, i) => (
                                <div className="product-card" key={i}>
                                    {p.badge && <span className="product-card__badge" style={p.badgeColor ? { background: p.badgeColor } : {}}>{p.badge}</span>}
                                    <div className="product-card__img"><img src={p.img} alt={p.name} /></div>
                                    <div className="product-card__body">
                                        <div className="product-card__type">{p.typeName}</div>
                                        <Link href="/product" className="product-card__name">{p.name}</Link>
                                        <div className="product-card__note">{p.note}</div>
                                        <div className="product-card__bottom">
                                            <div className="product-card__price">₹{p.price.toLocaleString()}</div>
                                            <div className="product-card__rating">{renderStars(p.stars)} <span>({p.reviews})</span></div>
                                        </div>
                                        <button className="btn btn--primary btn--sm" style={{ width: '100%', marginTop: '12px' }} onClick={() => addToCart(p.name, p.price, p.img)}>Add to Cart</button>
                                    </div>
                                </div>
                            ))}
                        </div>
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
