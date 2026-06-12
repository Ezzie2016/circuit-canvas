import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

let transporter: nodemailer.Transporter | null = null;
let usingEthereal = false;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) {
    return transporter;
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else if (process.env.NODE_ENV !== "production") {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    usingEthereal = true;
    console.log("Using Ethereal email account for local development:", testAccount.user);
  } else {
    throw new Error(
      "Email credentials are required in production. Set EMAIL_USER and EMAIL_PASSWORD.",
    );
  }

  return transporter;
}

async function sendMail(mailOptions: Mail.Options): Promise<string | null> {
  const transport = await getTransporter();
  const info = await transport.sendMail(mailOptions);
  const previewUrl = usingEthereal ? nodemailer.getTestMessageUrl(info) : null;

  if (previewUrl) {
    console.log(`Preview email available at: ${previewUrl}`);
  }

  return typeof previewUrl === "string" ? previewUrl : null;
}

function getRoleLabel(role?: "STUDENT" | "TEACHER" | "ADMIN") {
  if (!role) return "User";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function getRoleSpecificLine(role?: "STUDENT" | "TEACHER" | "ADMIN") {
  switch (role) {
    case "TEACHER":
      return "<li>Set up your course materials and gradebook</li>";
    case "ADMIN":
      return "<li>Review administrative settings and user management</li>";
    default:
      return "<li>Browse available courses and enroll</li>";
  }
}

export async function sendRegistrationEmail(
  email: string,
  name: string,
  role?: "STUDENT" | "TEACHER" | "ADMIN",
): Promise<void> {
  try {
    const roleLabel = getRoleLabel(role);
    const subject = `Welcome to Circuit Campus, ${roleLabel}!`;
    const roleSpecific = getRoleSpecificLine(role);

    await sendMail({
      from: process.env.EMAIL_USER || "no-reply@circuitcampus.local",
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1d6d58;">Welcome to Circuit Campus, ${name}!</h1>
          <p>Account created as <strong>${roleLabel}</strong>. Your account is ready to use.</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Getting Started</strong></p>
            <ul>
              <li>Complete your profile</li>
              ${roleSpecific}
              <li>Join live sessions and collaborate</li>
            </ul>
          </div>
          <p>
            <a href="${process.env.APP_URL || "http://localhost:3000"}/login" 
               style="display: inline-block; background-color: #1d6d58; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; font-weight: bold;">
              Sign In to Your Account
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't create this account, please contact our support team.
          </p>
        </div>
      `,
    });

    console.log(`Registration email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send registration email:", error);
    throw error;
  }
}

export async function sendLoginNotificationEmail(
  email: string,
  name: string,
): Promise<void> {
  try {
    await sendMail({
      from: process.env.EMAIL_USER || "no-reply@circuitcampus.local",
      to: email,
      subject: "Login Notification - Circuit Campus",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1d6d58;">Login Detected</h2>
          <p>Hi ${name},</p>
          <p>Your account was just accessed. If this wasn't you, please secure your account immediately.</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Login Details:</strong></p>
            <p>Time: ${new Date().toLocaleString()}</p>
            <p>If this login wasn't authorized, change your password immediately.</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            © 2026 Circuit Campus. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log(`Login notification email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send login notification email:", error);
    throw error;
  }
}
