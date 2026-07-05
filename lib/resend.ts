import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM = 'DB Prosthetics <noreply@dbpando.com>';
const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL!;

/** Send login credentials to a newly onboarded hospital admin. */
export async function sendHospitalCredentials(
  toEmail: string,
  hospitalName: string,
  tempPassword: string
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Welcome to DB Prosthetics — Your Hospital Admin Account`,
    html: `
      <h2>Welcome to DB Prosthetics and Orthotics Ltd</h2>
      <p>Your hospital <strong>${hospitalName}</strong> has been onboarded to the platform.</p>
      <p><strong>Login details:</strong></p>
      <ul>
        <li>Email: ${toEmail}</li>
        <li>Temporary password: <code>${tempPassword}</code></li>
      </ul>
      <p>Please log in and change your password immediately.</p>
      <p>Login at: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/login">${process.env.NEXT_PUBLIC_BASE_URL}/login</a></p>
    `,
  });
}

/** Notify Super Admin of a new order. */
export async function notifyAdminNewOrder(order: {
  orderId: number;
  patientName: string;
  totalAmountKobo: number;
  paymentMethod: string;
  createdByRole: string;
}): Promise<void> {
  const naira = (order.totalAmountKobo / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
  });

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Order #${order.orderId} — ${order.patientName}`,
    html: `
      <h2>New Order Received</h2>
      <p><strong>Order ID:</strong> #${order.orderId}</p>
      <p><strong>Patient:</strong> ${order.patientName}</p>
      <p><strong>Total:</strong> ${naira}</p>
      <p><strong>Payment method:</strong> ${order.paymentMethod}</p>
      <p><strong>Submitted by:</strong> ${order.createdByRole}</p>
      <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/super-admin/orders/${order.orderId}">View Order</a></p>
    `,
  });
}

/** Notify Super Admin of a successful payment. */
export async function notifyAdminPaymentReceived(payment: {
  orderId?: number;
  appointmentId?: number;
  patientName: string;
  amountKobo: number;
  paymentMethod: string;
  paystackRef?: string;
}): Promise<void> {
  const naira = (payment.amountKobo / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
  });

  const subject = payment.orderId
    ? `Payment Received — Order #${payment.orderId}`
    : `Payment Received — Appointment #${payment.appointmentId}`;

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject,
    html: `
      <h2>Payment Confirmed</h2>
      <p><strong>Patient:</strong> ${payment.patientName}</p>
      <p><strong>Amount paid:</strong> ${naira}</p>
      <p><strong>Method:</strong> ${payment.paymentMethod}</p>
      ${payment.paystackRef ? `<p><strong>Paystack ref:</strong> ${payment.paystackRef}</p>` : ''}
      ${payment.orderId ? `<p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/super-admin/orders/${payment.orderId}">View Order</a></p>` : ''}
      ${payment.appointmentId ? `<p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/super-admin/appointments/${payment.appointmentId}">View Appointment</a></p>` : ''}
    `,
  });
}

/** Send a home visit invoice to a patient. */
export async function sendHomeVisitInvoice(
  toEmail: string,
  patientName: string,
  appointmentId: number,
  quotedPriceKobo: number
): Promise<void> {
  const naira = (quotedPriceKobo / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
  });
  // Total includes ₦1,000 service fee
  const totalKobo = quotedPriceKobo + 100_000;
  const totalNaira = (totalKobo / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
  });

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Home Visit Invoice — DB Prosthetics`,
    html: `
      <h2>Home Visit Invoice</h2>
      <p>Dear ${patientName},</p>
      <p>Your home consultation request has been reviewed.</p>
      <table>
        <tr><td>Consultation fee:</td><td>${naira}</td></tr>
        <tr><td>Service fee:</td><td>₦1,000.00</td></tr>
        <tr><td><strong>Total due:</strong></td><td><strong>${totalNaira}</strong></td></tr>
      </table>
      <p>Please log in to complete payment and confirm your appointment.</p>
      <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/patient/appointments/${appointmentId}">Pay Now</a></p>
    `,
  });
}

export default resend;
