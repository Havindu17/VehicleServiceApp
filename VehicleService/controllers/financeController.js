const nodemailer = require('nodemailer');
const Finance    = require('../models/Finance');
const Booking    = require('../models/Booking');
const Garage     = require('../models/Garage');

// ── Email transporter ──────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// ── Helpers ────────────────────────────────────────────────────────────────
async function getOwnerGarage(userId) {
  return await Garage.findOne({ ownerId: userId });
}

function normalizeFinancePaymentMethod(value) {
  const pm = (value ?? '').toString().trim().toLowerCase();
  if (pm === 'card')   return 'Card';
  if (pm === 'online') return 'Online';
  return 'Cash';
}

// ── Get clean short service label ─────────────────────────────────────────
// Priority: booking.serviceName → booking.service (first word/item only)
// → finance.description first item → 'Service'
function getServiceLabel(booking, financeDescription) {
  // 1. booking.serviceName field (single clean name)
  if (booking?.serviceName && booking.serviceName.trim()) {
    return booking.serviceName.trim();
  }

  // 2. booking.service — take only first item if comma/plus separated
  if (booking?.service && booking.service.trim()) {
    const raw = booking.service.trim();
    // Split by common separators and take first
    const first = raw.split(/[,+&\/]|(\band\b)/i)[0]?.trim();
    if (first && first.length > 0) return first;
  }

  // 3. finance description — first item before comma
  if (financeDescription && financeDescription.trim()) {
    const first = financeDescription.split(',')[0]?.trim();
    if (first && first.length > 0) return first;
  }

  return 'Service';
}

// ── Build invoice HTML ─────────────────────────────────────────────────────
function buildInvoiceHtml({ customerName, garageName, garagePhone, items, totalAmount, notes }) {
  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#333">
        ${i.item ?? i.label}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#333">
        Rs. ${Number(i.amount).toLocaleString()}
      </td>
    </tr>`
  ).join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;
                background:#f9f9f9;padding:24px;border-radius:12px">

      <div style="background:#0B1D3A;padding:24px;border-radius:8px;
                  text-align:center;margin-bottom:24px">
        <h1 style="color:#C9A84C;margin:0;font-size:26px">🔧 Invoice</h1>
        <p style="color:#8A9BB5;margin:8px 0 0">${garageName}</p>
      </div>

      <p style="color:#333">Dear <strong>${customerName}</strong>,</p>
      <p style="color:#555">
        Your vehicle service has been completed. Please find your invoice below.
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
            <td style="padding:12px;font-weight:bold;font-size:16px;color:#333">Total</td>
            <td style="padding:12px;font-weight:bold;font-size:16px;
                       text-align:right;color:#16A34A">
              Rs. ${Number(totalAmount).toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>

      ${notes ? `
      <div style="background:#fff3cd;padding:12px;border-radius:8px;margin:12px 0;color:#333">
        <strong>📝 Notes:</strong> ${notes}
      </div>` : ''}

      <div style="background:#0B1D3A;padding:16px;border-radius:8px;
                  margin-top:16px;text-align:center">
        <p style="color:#8A9BB5;margin:0;font-size:13px">
          Thank you for choosing our service!
        </p>
        <p style="color:#C9A84C;margin:6px 0 0;font-size:13px">
          ${garagePhone ?? ''}
        </p>
      </div>
    </div>`;
}

// ── CRUD (admin use) ───────────────────────────────────────────────────────
exports.createFinance = async (req, res) => {
  try {
    const finance = await Finance.create(req.body);
    res.status(201).json(finance);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllFinances = async (req, res) => {
  try {
    const finances = await Finance.find().populate('booking');
    res.json(finances);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getFinanceById = async (req, res) => {
  try {
    const finance = await Finance.findById(req.params.id);
    if (!finance) return res.status(404).json({ message: 'Finance not found' });
    res.json(finance);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateFinance = async (req, res) => {
  try {
    const finance = await Finance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!finance) return res.status(404).json({ message: 'Finance not found' });
    res.json(finance);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteFinance = async (req, res) => {
  try {
    const finance = await Finance.findByIdAndDelete(req.params.id);
    if (!finance) return res.status(404).json({ message: 'Finance not found' });
    res.json({ message: 'Finance deleted ✅' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── Garage Finance Summary ─────────────────────────────────────────────────
// GET /api/garage/finance?period=month
exports.getGarageFinance = async (req, res) => {
  try {
    const garage = await getOwnerGarage(req.user.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const period = req.query.period ?? 'month';
    const now    = new Date();
    let startDate;
    if      (period === 'today') { startDate = new Date(now); startDate.setHours(0,0,0,0); }
    else if (period === 'week')  { startDate = new Date(now); startDate.setDate(now.getDate() - 7); }
    else if (period === 'year')  { startDate = new Date(now.getFullYear(), 0, 1); }
    else                         { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }

    const garageBookingIds = await Booking.find({ garage: garage._id }).distinct('_id');

    const finances = await Finance.find({
      booking: { $in: garageBookingIds },
      type:    'Income',
      date:    { $gte: startDate },
    }).populate({
      path:     'booking',
      populate: { path: 'customer', select: 'name' },
    });

    const totalRevenue  = finances.reduce((s, f) => s + (f.amount ?? 0), 0);
    const completedJobs = finances.length;
    const avgPerJob     = completedJobs > 0 ? Math.round(totalRevenue / completedJobs) : 0;

    const pendingBookings = await Booking.find({ garage: garage._id, jobStatus: 'pending' });
    const pendingValue    = pendingBookings.reduce((s, b) => s + (b.totalAmount ?? 0), 0);

    let cashAmount = 0, cardAmount = 0;
    finances.forEach(f => {
      if (f.paymentMethod?.toLowerCase() === 'card') cardAmount += f.amount ?? 0;
      else                                            cashAmount += f.amount ?? 0;
    });

    // ── byService: use clean label ─────────────────────────────────────────
    const serviceMap = {};
    finances.forEach(f => {
      const name = getServiceLabel(f.booking, f.description);
      if (!serviceMap[name]) serviceMap[name] = { name, count: 0, revenue: 0 };
      serviceMap[name].count++;
      serviceMap[name].revenue += f.amount ?? 0;
    });
    const byService = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);

    const dailyMap = {};
    finances.forEach(f => {
      const day = (f.date ?? f.createdAt)?.toISOString().split('T')[0] ?? '';
      if (!dailyMap[day]) dailyMap[day] = 0;
      dailyMap[day] += f.amount ?? 0;
    });
    const dailyRevenue = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ label: date.slice(5), amount }));

    // ── transactions: service = short label, allServices = full list ───────
    const transactions = finances.slice(0, 50).map(f => ({
      _id:           f.booking?._id ?? f._id,
      financeId:     f._id,
      customerName:  f.booking?.customer?.name ?? 'Unknown',

      // Short label shown on card (e.g. "Oil Change")
      service:       getServiceLabel(f.booking, f.description),

      // Full services list for invoice modal subtitle
      allServices:   f.booking?.service ?? f.description ?? '',

      date:          (f.date ?? f.createdAt)?.toISOString().split('T')[0] ?? '',
      amount:        f.amount ?? 0,
      paymentMethod: f.paymentMethod ?? 'Cash',
      costBreakdown: f.booking?.costBreakdown ?? [],
      garageNotes:   f.booking?.garageNotes   ?? '',
    }));

    res.json({
      totalRevenue,
      completedJobs,
      avgPerJob,
      pendingValue,
      cashAmount,
      cardAmount,
      byService,
      dailyRevenue,
      transactions,
    });
  } catch (e) {
    console.error('getGarageFinance error:', e);
    res.status(500).json({ message: e.message });
  }
};

// ── Save Invoice + Email ───────────────────────────────────────────────────
// POST /api/garage/invoice
exports.saveInvoice = async (req, res) => {
  try {
    const { bookingId, items, notes, sendEmail } = req.body;

    if (!bookingId)                    return res.status(400).json({ message: 'bookingId required' });
    if (!items || items.length === 0)  return res.status(400).json({ message: 'Add at least one item' });

    const booking = await Booking.findById(bookingId)
      .populate('customer', 'name email phone')
      .populate('garage',   'name phone address');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const costBreakdown = items.map(i => ({
      item:   i.label ?? i.item,
      amount: Number(i.amount) || 0,
    }));
    const totalAmount = costBreakdown.reduce((s, i) => s + i.amount, 0);

    booking.costBreakdown = costBreakdown;
    booking.totalAmount   = totalAmount;
    booking.garageNotes   = notes ?? '';
    booking.jobStatus     = 'completed';
    await booking.save();

    // ── Upsert Finance record ──────────────────────────────────────────────
    const existing = await Finance.findOne({ booking: bookingId });
    if (existing) {
      existing.amount        = totalAmount;
      existing.description   = costBreakdown.map(i => i.item).join(', ');
      existing.paymentMethod = normalizeFinancePaymentMethod(booking.paymentMethod ?? 'cash');
      await existing.save();
    } else {
      await Finance.create({
        booking:       bookingId,
        amount:        totalAmount,
        type:          'Income',
        paymentMethod: normalizeFinancePaymentMethod(booking.paymentMethod ?? 'cash'),
        description:   costBreakdown.map(i => i.item).join(', '),
        date:          new Date(),
      });
    }

    // ── Send email ─────────────────────────────────────────────────────────
    if (sendEmail && booking.customer?.email) {
      const garageName  = booking.garage?.name  ?? 'Vehicle Service';
      const garagePhone = booking.garage?.phone ?? '';

      const html = buildInvoiceHtml({
        customerName: booking.customer.name,
        garageName,
        garagePhone,
        items:        costBreakdown,
        totalAmount,
        notes,
      });

      await transporter.sendMail({
        from:    `"${garageName}" <${process.env.EMAIL_USER}>`,
        to:      booking.customer.email,
        subject: `Invoice – ${getServiceLabel(booking, '')} | Rs. ${totalAmount.toLocaleString()}`,
        html,
      });

      console.log(`📧 Invoice sent to: ${booking.customer.email} — Rs. ${totalAmount}`);
    }

    res.json({
      message:     sendEmail ? 'Invoice saved & emailed ✅' : 'Invoice saved ✅',
      totalAmount,
      bookingId,
    });

  } catch (e) {
    console.error('saveInvoice error:', e);
    res.status(500).json({ message: e.message });
  }
};