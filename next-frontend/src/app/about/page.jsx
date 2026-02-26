'use client';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function About() {
    return (
        <Layout>
            {/* Hero */}
            <section className="about-hero">
                <div className="container">
                    <p className="overline">Our Story</p>
                    <h1>Born from a Love of Ritual</h1>
                    <p className="subtitle" style={{ margin: '0 auto' }}>We believe that a cup of tea is more than a beverage — it's a moment of mindfulness, a pause, a quiet celebration of the senses.</p>
                </div>
            </section>

            {/* Founder Story */}
            <section className="section">
                <div className="container">
                    <div className="about-section fade-in">
                        <div>
                            <p className="overline">The Beginning</p>
                            <h2>A Founder's Journey</h2>
                            <p>feelinga was born when our founder & managing director, Kailas Ishwar Mane, decided to share his passion for premium Indian teas with the world. A B.Sc. Agriculture graduate from VNMKV, Parbhani, Kailas brings a deep understanding of cultivation, soil science, and sustainable farming to every cup of tea we offer.</p>
                            <p>Growing up in Pandharpur, Maharashtra, he developed a deep appreciation for authentic flavours and the simple joy that a perfect cup of tea can bring. Driven by the belief that happiness can be found in everyday moments, Kailas set out to build a brand that celebrates the art of tea — fresh, honest, and crafted to bring a smile to every sip.</p>
                            <p>"I wanted people to experience tea the way it's meant to be — not just a drink, but a daily dose of happiness." — <em>Kailas Ishwar Mane, Founder & Managing Director</em></p>
                        </div>
                        <div className="about-visual">
                            <img src="/images/founder.jpg" alt="Kailas Ishwar Mane — Founder of feelinga" style={{ width: '100%', maxWidth: '320px', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Sourcing */}
            <section className="section section--alt">
                <div className="container">
                    <div className="about-section about-section--reverse fade-in">
                        <div>
                            <p className="overline">Our Estates</p>
                            <h2>Sourced with Intention</h2>
                            <p>We partner directly with 15+ small-estate growers across Darjeeling, Assam, the Nilgiris, and Kangra Valley. No middlemen, no blending houses — just a direct relationship between the garden and your cup.</p>
                            <p>Every lot is personally tasted and selected by our team. We visit our partner estates twice a year, working closely with the pluckers and tea makers to ensure quality, fair wages, and sustainable farming practices.</p>
                        </div>
                        <div className="about-visual" aria-hidden="true">🏔️</div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="section">
                <div className="container">
                    <div className="section-header fade-in">
                        <p className="overline">What We Stand For</p>
                        <h2>Our Values</h2>
                    </div>
                    <div className="values-grid fade-in">
                        {[
                            { icon: '🌱', title: 'Sustainability', desc: 'Biodegradable packaging, carbon-offset shipping, and support for regenerative farming practices across our partner estates.' },
                            { icon: '🤝', title: 'Fair Trade', desc: 'We pay 20–30% above market rate to our growers, funding education, healthcare, and community development programs.' },
                            { icon: '💚', title: 'Wellness First', desc: 'No artificial flavors, no plastic tea bags, no fillers. Just pure, whole-leaf teas and natural botanicals that nourish your body.' },
                        ].map((v, i) => (
                            <div className="value-card" key={i}>
                                <div className="value-card__icon">{v.icon}</div>
                                <h4>{v.title}</h4>
                                <p>{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="section section--alt">
                <div className="container">
                    <div className="section-header fade-in">
                        <p className="overline">Milestones</p>
                        <h2>Our Journey</h2>
                    </div>
                    <div className="timeline fade-in">
                        {[
                            { year: '2019', text: 'feelinga founded in Darjeeling. First collection of 12 single-origin teas launched online.' },
                            { year: '2020', text: 'Expanded to 30+ varieties. Launched wellness blends and herbal infusion line.' },
                            { year: '2021', text: 'Reached 5,000 customers. Featured in Vogue India and Elle Decor.' },
                            { year: '2022', text: 'Partnered with 15 estates. Launched gifting collection and corporate program.' },
                            { year: '2023', text: '10,000+ customers. Switched to fully biodegradable packaging.' },
                            { year: '2024', text: "Launched Tea Master's Selection and began exporting to UAE & Singapore." },
                            { year: '2026', text: '50+ varieties, 15,000+ happy sippers, and growing with gratitude every day.' },
                        ].map((t, i) => (
                            <div className="timeline-item" key={i}>
                                <div className="timeline-item__year">{t.year}</div>
                                <p>{t.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section">
                <div className="container text-center fade-in">
                    <h2>Ready to Begin Your Tea Journey?</h2>
                    <p style={{ margin: 'var(--space-md) auto var(--space-xl)' }}>Explore our collection and discover your perfect cup.</p>
                    <Link href="/shop" className="btn btn--primary">Shop All Teas</Link>
                </div>
            </section>
        </Layout>
    );
}



