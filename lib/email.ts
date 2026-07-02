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

export async function sendWelcomeHospitalAdmin(opts: {
  to: string;
  hospitalName: string;
  tempPassword: string;
  loginUrl: string;
}): Promise<void> {
  const { to, hospitalName, tempPassword, loginUrl } = opts;

  const content = `
    <h2 style="margin:0 0 6px;font-size:22px;color:#0f2438;font-weight:700;">Welcome to DB Prosthetics</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
      You have been set up as the <strong>Hospital Administrator</strong> for <strong>${hospitalName}</strong> on the DB Prosthetics platform.
    </p>

    <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;">
      Your login credentials are below. You will be asked to set a new password the first time you sign in.
    </p>

    ${credentialsBox([
      { label: 'Email', value: to },
      { label: 'Temp. Password', value: tempPassword },
    ])}

    <p style="margin:16px 0 4px;font-size:13px;color:#6b7280;line-height:1.6;">
      Keep these credentials safe. Once you sign in, you will be prompted to choose a new password.
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
      subject: `Welcome to DB Prosthetics — Your Admin Account for ${hospitalName}`,
      html: baseTemplate(content),
    });
  } catch (err) {
    console.error('[email] sendWelcomeHospitalAdmin failed:', err);
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
