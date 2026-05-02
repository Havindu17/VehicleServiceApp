const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/authMiddleware');
const Booking    = require('../models/Booking');
const nodemailer = require('nodemailer');

// ── Email transporter ──────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // ✅ fix self-signed certificate error
  },
});

// ── POST /api/invoice/send ─────────────────────────────────────────────────
router.post('/send', auth, async (req, res) => {
  try {
    const { bookingId, items, notes, sendEmail } = req.body;

    // ✅ 'user' and 'garageId' — correct field names from Booking model
    const booking = await Booking.findById(bookingId)
      .populate('customer', 'name email phone')
      .populate('garage',   'name phone address');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const total = items.reduce((s, i) => s + Number(i.amount), 0);

    // ✅ Use findByIdAndUpdate to skip pre-save middleware validation issues
    await Booking.findByIdAndUpdate(bookingId, {
      costBreakdown: items.map(i => ({ item: i.label, amount: Number(i.amount) })),
      totalAmount:   total,
      ...(notes ? { garageNotes: notes } : {}),
    });

    if (sendEmail && booking.customer?.email) {
      const itemRows = items.map(i =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${i.label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">
            Rs. ${Number(i.amount).toLocaleString()}
          </td>
        </tr>`
      ).join('');

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;
                    background:#f9f9f9;padding:24px;border-radius:12px">
          <div style="background:#0B1D3A;padding:24px;border-radius:8px;
                      text-align:center;margin-bottom:24px">
            <h1 style="color:#C9A84C;margin:0;font-size:26px">🔧 Invoice</h1>
            <p style="color:#8A9BB5;margin:8px 0 0">
              ${booking.garage?.name ?? 'Vehicle Service'}
            </p>
          </div>

          <p style="color:#333">Dear <strong>${booking.customer.name}</strong>,</p>
          <p style="color:#555">
            Your service has been completed. Please find your invoice below.
          </p>

          <table style="width:100%;border-collapse:collapse;background:#fff;
                        border-radius:8px;overflow:hidden;margin:16px 0">
            <thead>
              <tr style="background:#0B1D3A">
                <th style="padding:12px;color:#C9A84C;text-align:left">Service Item</th>
                <th style="padding:12px;color:#C9A84C;text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr style="background:#f0f0f0">
                <td style="padding:12px;font-weight:bold;font-size:16px">Total</td>
                <td style="padding:12px;font-weight:bold;font-size:16px;
                           text-align:right;color:#16A34A">
                  Rs. ${total.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          ${notes ? `
          <div style="background:#fff3cd;padding:12px;border-radius:8px;margin:12px 0">
            <strong>📝 Notes:</strong> ${notes}
          </div>` : ''}

          <div style="background:#0B1D3A;padding:16px;border-radius:8px;
                      margin-top:16px;text-align:center">
            <p style="color:#8A9BB5;margin:0;font-size:13px">
              Thank you for choosing our service!
            </p>
            <p style="color:#C9A84C;margin:6px 0 0;font-size:13px">
              ${booking.garage?.phone ?? ''}
            </p>
          </div>
        </div>`;

      await transporter.sendMail({
        from:    `"${booking.garage?.name ?? 'Vehicle Service'}" <${process.env.EMAIL_USER}>`,
        to:      booking.customer.email,
        subject: `Invoice – ${booking.serviceName ?? 'Service'} | Rs. ${total.toLocaleString()}`,
        html,
      });
    }

    res.json({
      message:     sendEmail ? 'Invoice sent via email ✅' : 'Invoice saved ✅',
      totalAmount: total,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ── GET /api/invoice/booking/:id ───────────────────────────────────────────
router.get('/booking/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('garage',   'name phone address');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    res.json({
      customerName:  booking.customer?.name      ?? 'Unknown',
      customerEmail: booking.customer?.email     ?? '',
      customerPhone: booking.customer?.phone     ?? '',
      service:       booking.serviceName     ?? '',
      bookingDate:   booking.bookingDate,
      costBreakdown: booking.costBreakdown   ?? [],
      totalAmount:   booking.totalAmount     ?? 0,
      garageNotes:   booking.garageNotes     ?? '',
      status:        booking.status          ?? 'Pending',
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;