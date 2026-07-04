import { Resend } from 'resend';

// Lazy — only instantiated at call time, not at module load (avoids build-time crash)
function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder');
}
const FROM = process.env.EMAIL_FROM || 'DB Prosthetics <noreply@dbprosthetics.com>';

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DB Prosthetics</title>
</head>
<body style="margin:0;padding:0;background:#f0ece4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0f2438;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:#1b3d5e;border:2px solid #d08c2a;border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;font-size:18px;font-weight:700;color:#d08c2a;letter-spacing:1px;margin-bottom:16px;">DB</div>
              <div style="color:#d08c2a;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;">DB Prosthetics &amp; Orthotics Ltd</div>
              <div style="color:rgba(240,236,228,0.5);font-size:11px;letter-spacing:1px;">Nigeria</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e5e0d8;border-right:1px solid #e5e0d8;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f2438;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:rgba(240,236,228,0.45);font-size:11px;line-height:1.6;">
                DB Prosthetics &amp; Orthotics Ltd | Nigeria<br/>
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function credentialsBox(lines: { label: string; value: string }[]): string {
  const rows = lines.map(
    l => `<tr>
      <td style="padding:8px 16px;font-size:13px;color:#6b7280;font-weight:600;white-space:nowrap;width:140px;">${l.label}</td>
      <td style="padding:8px 16px;font-size:13px;color:#1b3d5e;font-weight:700;font-family:monospace,monospace;word-break:break-all;">${l.value}</td>
    </tr>`
  ).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f2;border:1px solid #e5e0d8;border-radius:8px;margin:20px 0;overflow:hidden;">${rows}</table>`;
}

function ctaButton(label: string, url: string): string {
  return `<div style="text-align:center;margin:28px 0 8px;">
    <a href="${url}" style="display:inline-block;background:#d08c2a;color:#ffffff;font-size:14px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">${label}</a>
  </div>`;
}

const ROLE_LABELS: Record<string, string> = {
  hospital_admin: 'Hospital Administrator',
  doctor: 'Doctor',
  po_specialist: 'P&O Specialist',
};

export async function sendWelcomeStaffMember(opts: {
  to: string;
  role: 'hospital_admin' | 'doctor' | 'po_specialist';
  hospitalName?: string | null;
  tempPassword: string;
  loginUrl: string;
}): Promise<void> {
  const { to, role, hospitalName, tempPassword, loginUrl } = opts;
  const roleLabel = ROLE_LABELS[role] || 'Staff Member';
  const atHospital = hospitalName ? ` for <strong>${hospitalName}</strong>` : '';

  const content = `
    <h2 style="margin:0 0 6px;font-size:22px;color:#0f2438;font-weight:700;">Welcome to DB Prosthetics</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
      You have been set up as a <strong>${roleLabel}</strong>${atHospital} on the DB Prosthetics platform.
    </p>

    <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;">
      Your login credentials are below. You will be asked to set a new password the first time you sign in.
    </p>

    ${credentialsBox([
      { label: 'Email', value: to },
      { label: 'Temp. Password', value: tempPassword },
    ])}

    <p style="margin:16px 0 4px;font-size:13px;color:#6b7280;line-height:1.6;">
      Keep these credentials safe. Once you sign in, you will be prompted to choose a new password and complete your profile.
    </p>

    ${ctaButton('Sign In to Your Dashboard', loginUrl)}

    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
      If you did not expect this email, please contact the DB Prosthetics support team.
    </p>
  `;

  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `Welcome to DB Prosthetics — Your ${roleLabel} Account${hospitalName ? ` for ${hospitalName}` : ''}`,
      html: baseTemplate(content),
    });
  } catch (err) {
    console.error('[email] sendWelcomeStaffMember failed:', err);
  }
}

export async function sendWelcomePatient(opts: {
  to: string;
  fullName: string;
  tempPassword: string;
  loginUrl: string;
}): Promise<void> {
  const { to, fullName, tempPassword, loginUrl } = opts;

  const content = `
    <h2 style="margin:0 0 6px;font-size:22px;color:#0f2438;font-weight:700;">Welcome, ${fullName}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
      Your patient portal account has been created on the <strong>DB Prosthetics</strong> platform. You can now log in to view your care records, appointments, and more.
    </p>

    <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;">
      Your temporary login credentials are below. You will be asked to set a new password on first sign in.
    </p>

    ${credentialsBox([
      { label: 'Email', value: to },
      { label: 'Temp. Password', value: tempPassword },
    ])}

    <p style="margin:16px 0 4px;font-size:13px;color:#6b7280;line-height:1.6;">
      For your security, please change your password as soon as you log in.
    </p>

    ${ctaButton('Access Your Patient Portal', loginUrl)}

    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
      If you did not expect this email, you may safely ignore it or contact our support team.
    </p>
  `;

  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: 'Welcome to DB Prosthetics — Your Patient Portal Account',
      html: baseTemplate(content),
    });
  } catch (err) {
    console.error('[email] sendWelcomePatient failed:', err);
  }
}

export async function sendPasswordReset(opts: {
  to: string;
  fullName?: string | null;
  tempPassword: string;
  loginUrl: string;
}): Promise<void> {
  const { to, fullName, tempPassword, loginUrl } = opts;

  const content = `
    <h2 style="margin:0 0 6px;font-size:22px;color:#0f2438;font-weight:700;">Your Password Was Reset</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
      ${fullName ? `Hi ${fullName}, an` : 'An'} administrator has reset your DB Prosthetics account password.
    </p>

    <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;">
      Use the temporary password below to sign in. You will be asked to set a new password immediately.
    </p>

    ${credentialsBox([
      { label: 'Email', value: to },
      { label: 'Temp. Password', value: tempPassword },
    ])}

    ${ctaButton('Sign In', loginUrl)}

    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
      If you did not request this change, please contact the DB Prosthetics support team immediately.
    </p>
  `;

  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: 'DB Prosthetics — Your Password Was Reset',
      html: baseTemplate(content),
    });
  } catch (err) {
    console.error('[email] sendPasswordReset failed:', err);
  }
}

function naira(kobo: number): string {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

const CATEGORY_LABELS: Record<string, string> = {
  upper_limb: 'Upper Limb', lower_limb: 'Lower Limb', facial: 'Facial', spinal: 'Spinal', other: 'Other',
};
const CREATOR_LABELS: Record<string, string> = {
  patient: 'the patient', doctor: 'a doctor', po_specialist: 'a P&O specialist', super_admin: 'a super admin',
};

/** Notify the Super Admin whenever a patient/doctor/PO specialist places an order. */
export async function sendAdminNewOrderNotification(opts: {
  orderId: number;
  orderType: 'order' | 'custom_order';
  patientName: string;
  createdByRole: string;
  items?: Array<{ name: string; quantity: number; priceKobo: number }>;
  description?: string;
  category?: string | null;
  productTotalKobo?: number | null;
  serviceFeeKobo: number;
  paymentTarget: string;
  adminUrl: string;
}): Promise<void> {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!adminEmail) return;

  const {
    orderId, orderType, patientName, createdByRole, items, description, category,
    productTotalKobo, serviceFeeKobo, paymentTarget, adminUrl,
  } = opts;

  const itemsRows = items && items.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e5e0d8;border-radius:8px;overflow:hidden;">
        ${items.map(i => `<tr>
          <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f0ece4;">${i.name} &times;${i.quantity}</td>
          <td style="padding:10px 14px;font-size:13px;color:#1b3d5e;font-weight:700;text-align:right;border-bottom:1px solid #f0ece4;">${naira(i.priceKobo * i.quantity)}</td>
        </tr>`).join('')}
      </table>`
    : '';

  const totalLine = productTotalKobo != null
    ? `<p style="margin:0 0 4px;font-size:14px;color:#374151;">Product total: <strong>${naira(productTotalKobo)}</strong></p>
       <p style="margin:0 0 20px;font-size:14px;color:#374151;">Service fee: <strong>${naira(serviceFeeKobo)}</strong> &middot; Patient pays: <strong style="color:#0f2438;">${naira(productTotalKobo + serviceFeeKobo)}</strong></p>`
    : `<p style="margin:0 0 20px;font-size:14px;color:#6b7280;">No price set yet — quote this order to let the patient know what they'll pay (plus the ₦1,000 service fee).</p>`;

  const content = `
    <h2 style="margin:0 0 6px;font-size:22px;color:#0f2438;font-weight:700;">New ${orderType === 'custom_order' ? 'Custom' : 'Product'} Order</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
      Placed by ${CREATOR_LABELS[createdByRole] || createdByRole} for <strong>${patientName}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f2;border:1px solid #e5e0d8;border-radius:8px;margin-bottom:16px;">
      <tr>
        <td style="padding:8px 16px;font-size:13px;color:#6b7280;font-weight:600;width:140px;">Order</td>
        <td style="padding:8px 16px;font-size:13px;color:#1b3d5e;font-weight:700;">#${orderId}</td>
      </tr>
      <tr>
        <td style="padding:8px 16px;font-size:13px;color:#6b7280;font-weight:600;">Patient</td>
        <td style="padding:8px 16px;font-size:13px;color:#1b3d5e;font-weight:700;">${patientName}</td>
      </tr>
      ${category ? `<tr>
        <td style="padding:8px 16px;font-size:13px;color:#6b7280;font-weight:600;">Category</td>
        <td style="padding:8px 16px;font-size:13px;color:#1b3d5e;font-weight:700;">${CATEGORY_LABELS[category] || category}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:8px 16px;font-size:13px;color:#6b7280;font-weight:600;">Who pays</td>
        <td style="padding:8px 16px;font-size:13px;color:#1b3d5e;font-weight:700;">${paymentTarget === 'patient' ? 'Patient' : 'Requester'}</td>
      </tr>
    </table>

    ${description ? `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;"><strong>Description:</strong> ${description}</p>` : ''}

    ${itemsRows}
    ${totalLine}

    ${ctaButton('View Order', adminUrl)}
  `;

  try {
    await getResend().emails.send({
      from: FROM,
      to: adminEmail,
      subject: `New Order #${orderId} — ${patientName}`,
      html: baseTemplate(content),
    });
  } catch (err) {
    console.error('[email] sendAdminNewOrderNotification failed:', err);
  }
}
