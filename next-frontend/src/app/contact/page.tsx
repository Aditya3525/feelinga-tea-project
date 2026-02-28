'use client';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { useState } from 'react';
import { apiRequest } from '../../utils/api';

export default function Contact() {
    const [formStatus, setFormStatus] = useState({ text: '', type: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormStatus({ text: '', type: '' });
        try {
            const body = {
                name: e.target.contactName.value.trim(),
                email: e.target.contactEmail.value.trim(),
                subject: e.target.contactSubject.value,
                message: e.target.contactMsg.value.trim(),
            };
            const data = await apiRequest('/contact', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            setFormStatus({ text: data.message || "Thank you! We'll get back to you within 24 hours.", type: 'success' });
            e.target.reset();
        } catch (err) {
            setFormStatus({ text: err.message || 'Something went wrong. Please try again.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };
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
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="contactName">Full Name *</label>
                                <input type="text" id="contactName" name="contactName" required placeholder="Your name" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="contactEmail">Email Address *</label>
                                <input type="email" id="contactEmail" name="contactEmail" required placeholder="you@example.com" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="contactSubject">Subject</label>
                                <select id="contactSubject" name="contactSubject">
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
                                <textarea id="contactMsg" name="contactMsg" required placeholder="How can we help?" minLength={10}></textarea>
                            </div>
                            {formStatus.text && (
                                <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: formStatus.type === 'success' ? 'rgba(90,122,90,0.1)' : 'rgba(184,73,74,0.1)', color: formStatus.type === 'success' ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 500 }}>
                                    {formStatus.text}
                                </div>
                            )}
                            <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Sending...' : 'Send Message'}</button>
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
