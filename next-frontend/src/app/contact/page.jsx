'use client';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function Contact() {
    return (
        <Layout>
            <div className="page-hero">
                <div className="container">
                    <p className="overline">Get in Touch</p>
                    <h1>Contact Us</h1>
                    <p>We&apos;d love to hear from you — whether it&apos;s about an order, wholesale inquiry, or just to say hello.</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div className="contact-grid fade-in">
                        <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert("Thank you! We'll get back to you within 24 hours."); }}>
                            <div className="form-group">
                                <label htmlFor="contactName">Full Name *</label>
                                <input type="text" id="contactName" required placeholder="Your name" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="contactEmail">Email Address *</label>
                                <input type="email" id="contactEmail" required placeholder="you@example.com" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="contactSubject">Subject</label>
                                <select id="contactSubject">
                                    <option>General Inquiry</option>
                                    <option>Order Support</option>
                                    <option>Wholesale / B2B</option>
                                    <option>Corporate Gifting</option>
                                    <option>Press &amp; Media</option>
                                    <option>Feedback</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="contactMsg">Message *</label>
                                <textarea id="contactMsg" required placeholder="How can we help?"></textarea>
                            </div>
                            <button type="submit" className="btn btn--primary">Send Message</button>
                        </form>

                        <div className="contact-info">
                            <div className="contact-info__item">
                                <div className="contact-info__icon">👤</div>
                                <div className="contact-info__text">
                                    <h4>Kailas Ishwar Mane</h4>
                                    <p>Founder &amp; Managing Director, feelinga</p>
                                </div>
                            </div>
                            <div className="contact-info__item">
                                <div className="contact-info__icon">📧</div>
                                <div className="contact-info__text">
                                    <h4>Email</h4>
                                    <p><a href="mailto:kailasmane777@gmail.com" style={{ color: 'var(--color-accent)' }}>kailasmane777@gmail.com</a></p>
                                </div>
                            </div>
                            <div className="contact-info__item">
                                <div className="contact-info__icon">📱</div>
                                <div className="contact-info__text">
                                    <h4>Phone</h4>
                                    <p><a href="tel:+919673592818" style={{ color: 'var(--color-accent)' }}>+91 96735 92818</a><br />Mon–Sat, 10am–6pm IST</p>
                                </div>
                            </div>
                            <div className="contact-info__item">
                                <div className="contact-info__icon">📍</div>
                                <div className="contact-info__text">
                                    <h4>Address</h4>
                                    <p>Shriram Nagar, Takali Road,<br />Laxmi Takali, Pandharpur<br />Maharashtra – 413304, India</p>
                                </div>
                            </div>
                            <div className="contact-info__item">
                                <div className="contact-info__icon">💬</div>
                                <div className="contact-info__text">
                                    <h4>WhatsApp</h4>
                                    <p><a href="https://wa.me/919673592818" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>Chat with us on WhatsApp →</a></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
