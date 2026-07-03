import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

let transporter: nodemailer.Transporter | null = null;
let usingEthereal = false;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) {
    return transporter;
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    // Use Gmail with App Password
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    usingEthereal = false;
    console.log(`Email configured using ${process.env.EMAIL_SERVICE || "gmail"} for ${process.env.EMAIL_USER}`);
  } else if (process.env.NODE_ENV !== "production") {
    // Fallback to Ethereal for local dev (no real emails sent)
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
    console.warn(
      "\n⚠️  EMAIL NOT CONFIGURED — using Ethereal (test) email.\n" +
      "   Emails are NOT delivered to real inboxes.\n" +
      "   To enable Gmail: set EMAIL_USER and EMAIL_PASSWORD in your .env file.\n" +
      "   See .env.example for setup instructions.\n" +
      `   Ethereal account: ${testAccount.user}\n`
    );
  } else {
    throw new Error(
      "Email credentials are required in production. Set EMAIL_USER and EMAIL_PASSWORD in your environment."
    );
  }

  return transporter;
}

async function sendMail(mailOptions: Mail.Options): Promise<string | null> {
  const transport = await getTransporter();
  const info = await transport.sendMail(mailOptions);
  const previewUrl = usingEthereal ? nodemailer.getTestMessageUrl(info) : null;

  if (previewUrl) {
    console.log(`[Ethereal Preview] Email preview available at: ${previewUrl}`);
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
  role?: "STUDENT" | "TEACHER" | "ADMIN"
): Promise<void> {
  try {
    const roleLabel = getRoleLabel(role);
    const subject = `Welcome to Circuit Campus, ${roleLabel}!`;
    const roleSpecific = getRoleSpecificLine(role);

    await sendMail({
      from: `"Circuit Campus" <${process.env.EMAIL_USER || "no-reply@circuitcampus.local"}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">
          <div style="background: #1d6d58; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to Circuit Campus!</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Your account is ready</p>
          </div>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your <strong>${roleLabel}</strong> account has been created successfully. You can now sign in and get started.</p>
          <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin-top: 0;"><strong>Getting Started</strong></p>
            <ul style="padding-left: 20px; line-height: 1.8;">
              <li>Complete your profile</li>
              ${roleSpecific}
              <li>Join live sessions and collaborate</li>
            </ul>
          </div>
          <p>
            <a href="${process.env.APP_URL || "http://localhost:3000"}/login"
               style="display: inline-block; background-color: #1d6d58; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Sign In to Your Account
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            If you didn't create this account, please contact our support team.<br>
            © ${new Date().getFullYear()} Circuit Campus. All rights reserved.
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

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  try {
    await sendMail({
      from: `"Circuit Campus" <${process.env.EMAIL_USER || "no-reply@circuitcampus.local"}>`,
      to: email,
      subject: "Reset Your Circuit Campus Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">
          <div style="background: #1d6d58; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Circuit Campus</p>
          </div>
          <p>Hi <strong>${name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to choose a new one.</p>
          <p style="margin: 28px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background-color: #1d6d58; color: white; padding: 14px 28px;
                      text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
              Reset My Password
            </a>
          </p>
          <p style="color: #666; font-size: 13px;">Or copy and paste this link:</p>
          <p style="font-size: 12px; color: #444; word-break: break-all; background: #fff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px;">${resetUrl}</p>
          <p style="color: #e53e3e; font-size: 13px;">⚠️ This link expires in <strong>1 hour</strong>.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            © ${new Date().getFullYear()} Circuit Campus. All rights reserved.
          </p>
        </div>
      `,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

export async function sendTeacherInviteEmail(
  email: string,
  name: string,
  inviteUrl: string,
): Promise<void> {
  try {
    await sendMail({
      from: `"Circuit Campus" <${process.env.EMAIL_USER || "no-reply@circuitcampus.local"}>`,
      to: email,
      subject: "You've been invited to teach on Circuit Campus",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">
          <div style="background: #1d6d58; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 24px;">You're Invited to Teach!</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Circuit Campus — Teacher Invitation</p>
          </div>
          <p>Hi <strong>${name}</strong>,</p>
          <p>An admin has invited you to join <strong>Circuit Campus</strong> as a teacher. Click the button below to set your password and activate your account.</p>
          <p style="margin: 28px 0;">
            <a href="${inviteUrl}"
               style="display: inline-block; background-color: #1d6d58; color: white; padding: 14px 28px;
                      text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
              Activate My Teacher Account
            </a>
          </p>
          <p style="color: #666; font-size: 13px;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #444; word-break: break-all; background: #fff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px;">${inviteUrl}</p>
          <p style="color: #e53e3e; font-size: 13px;">⚠️ This link expires in <strong>24 hours</strong>.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            If you weren't expecting this invitation, you can safely ignore this email.<br>
            © ${new Date().getFullYear()} Circuit Campus. All rights reserved.
          </p>
        </div>
      `,
    });
    console.log(`Teacher invite email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send teacher invite email:", error);
    throw error;
  }
}

export async function sendGradeNotificationEmail(
  email: string,
  studentName: string,
  assignmentTitle: string,
  courseName: string,
  earnedMarks: number | null,
  totalMarks: number | null,
  feedback: string | null,
): Promise<void> {
  try {
    const scoreHtml =
      earnedMarks != null && totalMarks != null && totalMarks > 0
        ? `<tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Score</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${earnedMarks} / ${totalMarks} (${Math.round((earnedMarks / totalMarks) * 100)}%)</td>
           </tr>`
        : "";

    const feedbackHtml = feedback
      ? `<div style="background: #f0fdf4; border-left: 4px solid #1d6d58; padding: 14px 18px; border-radius: 4px; margin-top: 18px;">
           <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #1d6d58;">Teacher Feedback</p>
           <p style="margin: 0; font-size: 14px; color: #374151;">${feedback}</p>
         </div>`
      : "";

    await sendMail({
      from: `"Circuit Campus" <${process.env.EMAIL_USER || "no-reply@circuitcampus.local"}>`,
      to: email,
      subject: `Your assignment has been graded — ${assignmentTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">
          <div style="background: #1d6d58; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 22px;">Assignment Graded</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Circuit Campus</p>
          </div>
          <p>Hi <strong>${studentName}</strong>,</p>
          <p>Your assignment has been reviewed and graded. Here are the details:</p>
          <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Assignment</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${assignmentTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Course</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${courseName}</td>
              </tr>
              ${scoreHtml}
            </table>
          </div>
          ${feedbackHtml}
          <p style="margin-top: 24px;">
            <a href="${process.env.APP_URL || "http://localhost:3000"}/student/grades"
               style="display: inline-block; background-color: #1d6d58; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
              View My Grades
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            © ${new Date().getFullYear()} Circuit Campus. All rights reserved.
          </p>
        </div>
      `,
    });
    console.log(`Grade notification email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send grade notification email:", error);
  }
}

export async function sendLoginNotificationEmail(
  email: string,
  name: string
): Promise<void> {
  try {
    const loginTime = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    await sendMail({
      from: `"Circuit Campus Security" <${process.env.EMAIL_USER || "no-reply@circuitcampus.local"}>`,
      to: email,
      subject: "New Login Detected — Circuit Campus",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">
          <div style="background: #1d6d58; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 20px;">Login Notification</h2>
            <p style="margin: 6px 0 0; opacity: 0.9;">A new login was detected on your account</p>
          </div>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your Circuit Campus account was just accessed. Here are the details:</p>
          <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Time</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${loginTime}</td>
              </tr>
            </table>
          </div>
          <p>If this was you, no action is needed.</p>
          <p style="color: #c0392b;"><strong>If this wasn't you</strong>, please change your password immediately and contact support.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            © ${new Date().getFullYear()} Circuit Campus. All rights reserved.
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
