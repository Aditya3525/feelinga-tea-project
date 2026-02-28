'use client';
import Link from 'next/link';
import Image from 'next/image';

type ProductCardProps = {
    product: any;
    badge?: string | null;
    badgeClass?: string;
    renderStars: (count: number) => string;
    onAdd?: (product: any) => void;
    showAddButton?: boolean;
};

export default function ProductCard({
    product,
    badge,
    badgeClass,
    renderStars,
    onAdd,
    showAddButton = true,
}: ProductCardProps) {
    return (
        <div className="product-card">
            {badge && <span className={`product-card__badge ${badgeClass || ''}`}>{badge}</span>}
            <Link href={`/product/${product.slug}`}>
                <div className="product-card__img">
                    <Image
                        src={product.img}
                        alt={`${product.name} tea`}
                        width={300}
                        height={300}
                        className="img-contain-full"
                    />
                </div>
            </Link>
            <div className="product-card__body">
                <div className="product-card__type">{product.typeName || product.type}</div>
                <Link href={`/product/${product.slug}`} className="product-card__name">{product.name}</Link>
                <div className="product-card__note">{product.note}</div>
                <div className="product-card__bottom">
                    <div className="product-card__price">₹{product.price.toLocaleString()}</div>
                    <div className="product-card__rating">{renderStars(product.stars)} <span>({product.reviews})</span></div>
                </div>
                {showAddButton && (
                    <button
                        className="btn btn--primary btn--sm btn-block mt-12"
                        onClick={() => onAdd?.(product)}
                        disabled={!product.inStock}
                    >
                        {product.inStock ? 'Add to Cart' : 'Sold Out'}
                    </button>
                )}
            </div>
        </div>
    );
}
