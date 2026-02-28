import nodemailer from 'nodemailer';

// Configure transporter — uses Ethereal (free test SMTP) in dev, real SMTP in prod
let transporter: nodemailer.Transporter;

async function getTransporter() {
    if (transporter) return transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        // Production / configured SMTP
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Dev fallback — Ethereal fake mailbox (messages visible at https://ethereal.email)
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
        console.log(`✉  Dev email via Ethereal — user: ${testAccount.user}`);
    }

    return transporter;
}

const FROM = process.env.EMAIL_FROM || '"Feelinga Tea" <noreply@feelinga.in>';

// ────────────────────────────── helpers ──────────────────────────────

interface SendOpts {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendOpts) {
    const t = await getTransporter();
    const info = await t.sendMail({ from: FROM, to, subject, html, text });

    // In dev, log the Ethereal preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`  ↳ Preview: ${previewUrl}`);

    return info;
}

// ────────────────────────── email templates ──────────────────────────

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
    await sendEmail({
        to: email,
        subject: 'Reset your Feelinga password',
        html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e1d8;border-radius:12px">
            <h2 style="color:#8b6f47;margin-top:0">Reset Your Password</h2>
            <p>You requested a password reset for your <strong>Feelinga</strong> account.</p>
            <p>Click the button below — the link expires in <strong>10 minutes</strong>.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#8b6f47;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Reset Password
            </a>
            <p style="font-size:0.85rem;color:#888">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e5e1d8;margin:24px 0"/>
            <p style="font-size:0.8rem;color:#aaa;margin:0">Feelinga — happiness is here 🍵</p>
        </div>`,
        text: `Reset your Feelinga password: ${resetUrl}\n\nThis link expires in 10 minutes.`,
    });
}

export async function sendOrderConfirmationEmail(email: string, order: any) {
    const itemRows = (order.items || []).map((item: any) =>
        `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.name} (${item.size})</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.qty}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${(item.price * item.qty).toLocaleString('en-IN')}</td>
        </tr>`
    ).join('');

    const addr = order.shippingAddress || {};
    const address = [addr.firstName, addr.lastName].filter(Boolean).join(' ') + '<br>'
        + [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');

    await sendEmail({
        to: email,
        subject: `Order Confirmed — ${order.orderNumber}`,
        html: `
        <div style="font-family:system-ui,sans-serif;max-width:580px;margin:auto;padding:32px;border:1px solid #e5e1d8;border-radius:12px">
            <h2 style="color:#8b6f47;margin-top:0">Thank you for your order! 🍵</h2>
            <p>Hi ${addr.firstName || 'there'},</p>
            <p>Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <thead>
                    <tr style="background:#f9f6f0"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Total</th></tr>
                </thead>
                <tbody>${itemRows}</tbody>
                <tfoot>
                    <tr><td style="padding:8px" colspan="2"><strong>Subtotal</strong></td><td style="padding:8px;text-align:right">₹${order.subtotal?.toLocaleString('en-IN')}</td></tr>
                    <tr><td style="padding:8px" colspan="2">Shipping</td><td style="padding:8px;text-align:right">${order.shipping === 0 ? 'FREE' : '₹' + order.shipping}</td></tr>
                    <tr><td style="padding:8px" colspan="2">Tax (GST 5%)</td><td style="padding:8px;text-align:right">₹${order.tax}</td></tr>
                    <tr style="background:#f9f6f0"><td style="padding:8px" colspan="2"><strong>Total</strong></td><td style="padding:8px;text-align:right;font-weight:700;font-size:1.1rem">₹${order.total?.toLocaleString('en-IN')}</td></tr>
                </tfoot>
            </table>
            <p><strong>Payment:</strong> ${order.paymentMethod?.toUpperCase()}</p>
            <p><strong>Deliver to:</strong><br>${address}</p>
            <hr style="border:none;border-top:1px solid #e5e1d8;margin:24px 0"/>
            <p style="font-size:0.8rem;color:#aaa;margin:0">Feelinga — happiness is here 🍵</p>
        </div>`,
    });
}

export async function sendOrderStatusEmail(email: string, order: any, newStatus: string) {
    const statusMessages: Record<string, string> = {
        confirmed: '✅ Your order has been confirmed and is being prepared.',
        processing: '📦 Your order is being packed with care.',
        shipped: '🚚 Your order is on its way!',
        delivered: '🎉 Your order has been delivered. Enjoy your tea!',
        cancelled: '❌ Your order has been cancelled.',
    };

    const msg = statusMessages[newStatus] || `Your order status has been updated to: ${newStatus}`;

    // Include tracking info for shipped orders
    let trackingHtml = '';
    if (newStatus === 'shipped' && order.trackingNumber) {
        trackingHtml = `
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
                <strong>📦 Tracking Information</strong><br/>
                <p style="margin:8px 0 0">Tracking Number: <strong>${order.trackingNumber}</strong></p>
                ${order.trackingUrl ? `<p style="margin:8px 0 0"><a href="${order.trackingUrl}" style="color:#8b6f47;font-weight:600">Track Your Shipment →</a></p>` : ''}
            </div>`;
    }

    await sendEmail({
        to: email,
        subject: `Order ${order.orderNumber} — ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e1d8;border-radius:12px">
            <h2 style="color:#8b6f47;margin-top:0">Order Update</h2>
            <p>${msg}</p>
            ${trackingHtml}
            <p><strong>Order:</strong> ${order.orderNumber}<br><strong>Status:</strong> ${newStatus}</p>
            <hr style="border:none;border-top:1px solid #e5e1d8;margin:24px 0"/>
            <p style="font-size:0.8rem;color:#aaa;margin:0">Feelinga — happiness is here 🍵</p>
        </div>`,
    });
}

// Low stock alert to admin
export async function sendLowStockAlert(adminEmail: string, products: Array<{ name: string; slug: string; stock: number }>) {
    const rows = products.map(p =>
        `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${p.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:${p.stock === 0 ? '#e74c3c' : '#f39c12'};font-weight:600">${p.stock}</td>
        </tr>`
    ).join('');

    await sendEmail({
        to: adminEmail,
        subject: `⚠️ Low Stock Alert — ${products.length} product(s)`,
        html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e1d8;border-radius:12px">
            <h2 style="color:#e74c3c;margin-top:0">⚠️ Low Stock Alert</h2>
            <p>The following products are running low or out of stock:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <thead>
                    <tr style="background:#f9f6f0"><th style="padding:8px;text-align:left">Product</th><th style="padding:8px;text-align:center">Stock</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <p>Please restock these items from the admin dashboard.</p>
            <hr style="border:none;border-top:1px solid #e5e1d8;margin:24px 0"/>
            <p style="font-size:0.8rem;color:#aaa;margin:0">Feelinga Admin — automated inventory alert</p>
        </div>`,
    });
}
