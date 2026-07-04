import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Email skipped — RESEND_API_KEY not set] To: ${to} | Subject: ${subject}`);
    return;
  }
  const resend = getResend();
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}

export async function sendRegistrationEmail(
  email: string,
  name: string,
  role?: "STUDENT" | "TEACHER" | "ADMIN",
): Promise<void> {
  const roleLabel = role ? role.charAt(0) + role.slice(1).toLowerCase() : "User";
  await sendMail(
    email,
    `Welcome to Circuit Campus, ${name}!`,
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:32px;border-radius:12px">
      <div style="background:#1d6d58;color:white;padding:24px;border-radius:8px;margin-bottom:24px">
        <h1 style="margin:0;font-size:24px">Welcome to Circuit Campus!</h1>
        <p style="margin:8px 0 0;opacity:.9">Your account is ready</p>
      </div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your <strong>${roleLabel}</strong> account has been created. You can now sign in and get started.</p>
      <p style="margin:28px 0">
        <a href="${process.env.APP_URL ?? "https://circuitcampus.vercel.app"}/login"
           style="display:inline-block;background:#1d6d58;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">
          Sign In
        </a>
      </p>
      <p style="color:#666;font-size:12px;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px">
        © Circuit Campus. All rights reserved.
      </p>
    </div>`,
  ).catch((e) => console.error("sendRegistrationEmail failed:", e));
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  await sendMail(
    email,
    "Reset Your Circuit Campus Password",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:32px;border-radius:12px">
      <div style="background:#1d6d58;color:white;padding:24px;border-radius:8px;margin-bottom:24px">
        <h1 style="margin:0;font-size:24px">Password Reset</h1>
      </div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
      <p style="margin:28px 0">
        <a href="${resetUrl}" style="display:inline-block;background:#1d6d58;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold">
          Reset My Password
        </a>
      </p>
      <p style="font-size:12px;color:#444;word-break:break-all;background:#fff;border:1px solid #e2e8f0;padding:10px;border-radius:6px">${resetUrl}</p>
      <p>If you didn't request this, ignore this email.</p>
      <p style="color:#666;font-size:12px;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px">© Circuit Campus. All rights reserved.</p>
    </div>`,
  );
}

export async function sendTeacherInviteEmail(
  email: string,
  name: string,
  inviteUrl: string,
): Promise<void> {
  await sendMail(
    email,
    "You've been invited to teach on Circuit Campus",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:32px;border-radius:12px">
      <div style="background:#1d6d58;color:white;padding:24px;border-radius:8px;margin-bottom:24px">
        <h1 style="margin:0;font-size:24px">Teacher Invitation</h1>
        <p style="margin:8px 0 0;opacity:.9">Circuit Campus</p>
      </div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>You have been invited to join Circuit Campus as a teacher. Click below to set your password and activate your account.</p>
      <p style="margin:28px 0">
        <a href="${inviteUrl}" style="display:inline-block;background:#1d6d58;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold">
          Activate My Account
        </a>
      </p>
      <p style="font-size:12px;color:#444;word-break:break-all;background:#fff;border:1px solid #e2e8f0;padding:10px;border-radius:6px">${inviteUrl}</p>
      <p style="color:#e53e3e;font-size:13px">⚠️ This link expires in <strong>24 hours</strong>.</p>
      <p style="color:#666;font-size:12px;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px">© Circuit Campus. All rights reserved.</p>
    </div>`,
  );
}

export async function sendStudentInviteEmail(
  email: string,
  name: string,
  inviteUrl: string,
): Promise<void> {
  await sendMail(
    email,
    "Your Circuit Campus student account is ready",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:32px;border-radius:12px">
      <div style="background:#1d6d58;color:white;padding:24px;border-radius:8px;margin-bottom:24px">
        <h1 style="margin:0;font-size:24px">Welcome, ${name}!</h1>
        <p style="margin:8px 0 0;opacity:.9">Circuit Campus — Student Account</p>
      </div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your student account has been created by your school administrator. Click below to set your password and access your courses.</p>
      <p style="margin:28px 0">
        <a href="${inviteUrl}" style="display:inline-block;background:#1d6d58;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold">
          Set My Password
        </a>
      </p>
      <p style="font-size:12px;color:#444;word-break:break-all;background:#fff;border:1px solid #e2e8f0;padding:10px;border-radius:6px">${inviteUrl}</p>
      <p style="color:#e53e3e;font-size:13px">⚠️ This link expires in <strong>24 hours</strong>.</p>
      <p style="color:#666;font-size:12px;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px">© Circuit Campus. All rights reserved.</p>
    </div>`,
  );
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
  const scoreRow =
    earnedMarks != null && totalMarks != null && totalMarks > 0
      ? `<tr><td style="padding:8px 0;color:#666;font-size:14px">Score</td>
         <td style="padding:8px 0;font-weight:600;font-size:14px">${earnedMarks} / ${totalMarks} (${Math.round((earnedMarks / totalMarks) * 100)}%)</td></tr>`
      : "";

  const feedbackHtml = feedback
    ? `<div style="background:#f0fdf4;border-left:4px solid #1d6d58;padding:14px 18px;border-radius:4px;margin-top:18px">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#1d6d58">Teacher Feedback</p>
        <p style="margin:0;font-size:14px;color:#374151">${feedback}</p>
       </div>`
    : "";

  await sendMail(
    email,
    `Assignment graded — ${assignmentTitle}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:32px;border-radius:12px">
      <div style="background:#1d6d58;color:white;padding:24px;border-radius:8px;margin-bottom:24px">
        <h1 style="margin:0;font-size:22px">Assignment Graded</h1>
      </div>
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>Your assignment has been reviewed. Here are the details:</p>
      <div style="background:white;border:1px solid #e2e8f0;padding:20px;border-radius:8px;margin:20px 0">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#666;font-size:14px">Assignment</td>
              <td style="padding:8px 0;font-weight:600;font-size:14px">${assignmentTitle}</td></tr>
          <tr><td style="padding:8px 0;color:#666;font-size:14px">Course</td>
              <td style="padding:8px 0;font-weight:600;font-size:14px">${courseName}</td></tr>
          ${scoreRow}
        </table>
      </div>
      ${feedbackHtml}
      <p style="margin-top:24px">
        <a href="${process.env.APP_URL ?? "https://circuitcampus.vercel.app"}/student/grades"
           style="display:inline-block;background:#1d6d58;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">
          View My Grades
        </a>
      </p>
      <p style="color:#666;font-size:12px;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px">© Circuit Campus. All rights reserved.</p>
    </div>`,
  ).catch((e) => console.error("sendGradeNotificationEmail failed:", e));
}
