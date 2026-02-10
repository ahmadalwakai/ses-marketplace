import { Resend } from 'resend';
import { absoluteUrl } from '@/lib/url/baseUrl';

const resend = new Resend(process.env.RESEND_API_KEY);

const VERIFIED_DOMAIN = 'ses-marketplace.com';

function getFromEmail(): string {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail || !fromEmail.includes(`@${VERIFIED_DOMAIN}`)) {
    throw new Error(
      `RESEND_FROM_EMAIL is missing or not using @${VERIFIED_DOMAIN}. ` +
      `Set RESEND_FROM_EMAIL="no-reply@${VERIFIED_DOMAIN}" in your .env file.`
    );
  }
  const fromName = process.env.RESEND_FROM_NAME || 'SES Marketplace';
  return `${fromName} <${fromEmail}>`;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{ id: string }> {
  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return { id: result.data?.id || 'unknown' };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
      direction: rtl;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background-color: #000000;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 30px;
      color: #333333;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    .button {
      display: inline-block;
      background-color: #000000;
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin: 10px 0;
    }
    h1, h2, h3 { margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>سوريا للتسوق الإلكتروني</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2026 سوريا للتسوق الإلكتروني - جميع الحقوق محفوظة</p>
    </div>
  </div>
</body>
</html>
`;

// ============================================
// AUTH EMAILS
// ============================================

export async function sendWelcomeEmail(to: string, name: string) {
  const html = baseTemplate(`
    <h2>مرحباً ${name}!</h2>
    <p>شكراً لتسجيلك في سوريا للتسوق الإلكتروني.</p>
    <p>يمكنك الآن تصفح المنتجات والبدء بالتسوق.</p>
    <a href="${absoluteUrl('/')}" class="button">ابدأ التسوق</a>
  `);
  
  return sendEmail({
    to,
    subject: 'مرحباً بك في سوريا للتسوق الإلكتروني',
    html,
  });
}

const roleNamesAr: Record<string, string> = {
  CUSTOMER: 'عميل',
  SELLER: 'بائع',
  ADMIN: 'مدير',
  VISITOR: 'زائر',
};

export async function sendWelcomeEmailWithRole(to: string, name: string, role: string) {
  const roleNameAr = roleNamesAr[role] || 'مستخدم';
  
  const html = baseTemplate(`
    <h2>مرحباً ${name}!</h2>
    <p>شكراً لتسجيلك في سوريا للتسوق الإلكتروني.</p>
    <p>تم إنشاء حسابك بنجاح بصفة <strong>${roleNameAr}</strong>.</p>
    <p>يمكنك الآن تصفح المنتجات والبدء بالتسوق.</p>
    <a href="${absoluteUrl('/')}" class="button">ابدأ الآن</a>
  `);
  
  return sendEmail({
    to,
    subject: 'مرحباً بك في سوريا للتسوق الإلكتروني',
    html,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = absoluteUrl(`/auth/reset-password?token=${token}`);
  const html = baseTemplate(`
    <h2>إعادة تعيين كلمة المرور</h2>
    <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
    <p>اضغط على الزر أدناه لإعادة التعيين:</p>
    <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
    <p><small>هذا الرابط صالح لمدة 60 دقيقة فقط.</small></p>
    <p><small>إذا لم تطلب ذلك، تجاهل هذا البريد.</small></p>
  `);
  
  return sendEmail({
    to,
    subject: 'إعادة تعيين كلمة المرور',
    html,
  });
}

export async function sendPasswordResetSuccessEmail(to: string) {
  const html = baseTemplate(`
    <h2>تم تغيير كلمة المرور</h2>
    <p>تم تغيير كلمة المرور الخاصة بحسابك بنجاح.</p>
    <p>إذا لم تقم بهذا التغيير، يرجى التواصل معنا فوراً.</p>
    <a href="${absoluteUrl('/auth/login')}" class="button">تسجيل الدخول</a>
  `);
  
  return sendEmail({
    to,
    subject: 'تم تغيير كلمة المرور بنجاح',
    html,
  });
}

// ============================================
// ORDER EMAILS
// ============================================

export async function sendOrderPlacedEmail(
  to: string,
  orderId: string,
  orderTotal: string,
  items: { title: string; qty: number; price: string }[]
) {
  const itemsList = items
    .map((item) => `<li>${item.title} × ${item.qty} - ${item.price}</li>`)
    .join('');
  
  const html = baseTemplate(`
    <h2>تم استلام طلبك!</h2>
    <p>رقم الطلب: <strong>${orderId}</strong></p>
    <h3>المنتجات:</h3>
    <ul>${itemsList}</ul>
    <p><strong>المجموع: ${orderTotal}</strong></p>
    <p>سيتواصل معك البائع لترتيب التسليم والدفع نقداً.</p>
    <a href="${absoluteUrl(`/orders/${orderId}`)}" class="button">عرض الطلب</a>
  `);
  
  return sendEmail({
    to,
    subject: `تأكيد الطلب #${orderId.slice(-8)}`,
    html,
  });
}

export async function sendOrderStatusUpdateEmail(
  to: string,
  orderId: string,
  status: string,
  statusAr: string
) {
  const html = baseTemplate(`
    <h2>تحديث حالة الطلب</h2>
    <p>رقم الطلب: <strong>${orderId}</strong></p>
    <p>الحالة الجديدة: <strong>${statusAr}</strong></p>
    <a href="${absoluteUrl(`/orders/${orderId}`)}" class="button">عرض الطلب</a>
  `);
  
  return sendEmail({
    to,
    subject: `تحديث الطلب #${orderId.slice(-8)} - ${statusAr}`,
    html,
  });
}

export async function sendSellerNewOrderEmail(
  to: string,
  orderId: string,
  customerName: string,
  orderTotal: string
) {
  const html = baseTemplate(`
    <h2>طلب جديد!</h2>
    <p>لديك طلب جديد من <strong>${customerName}</strong>.</p>
    <p>رقم الطلب: <strong>${orderId}</strong></p>
    <p>المجموع: <strong>${orderTotal}</strong></p>
    <a href="${absoluteUrl(`/seller/orders/${orderId}`)}" class="button">عرض الطلب</a>
  `);
  
  return sendEmail({
    to,
    subject: `طلب جديد #${orderId.slice(-8)}`,
    html,
  });
}

// ============================================
// DISPUTE EMAILS
// ============================================

export async function sendDisputeOpenedEmail(
  to: string,
  disputeId: string,
  orderId: string,
  reason: string
) {
  const html = baseTemplate(`
    <h2>تم فتح نزاع</h2>
    <p>تم فتح نزاع على الطلب رقم: <strong>${orderId}</strong></p>
    <p><strong>السبب:</strong> ${reason}</p>
    <p>سيقوم فريقنا بمراجعة النزاع والتواصل معك.</p>
  `);
  
  return sendEmail({
    to,
    subject: `نزاع جديد على الطلب #${orderId.slice(-8)}`,
    html,
  });
}

export async function sendDisputeResolvedEmail(
  to: string,
  disputeId: string,
  orderId: string,
  outcome: string
) {
  const html = baseTemplate(`
    <h2>تم حل النزاع</h2>
    <p>تم حل النزاع على الطلب رقم: <strong>${orderId}</strong></p>
    <p><strong>القرار:</strong> ${outcome}</p>
  `);
  
  return sendEmail({
    to,
    subject: `تم حل النزاع - الطلب #${orderId.slice(-8)}`,
    html,
  });
}

// ============================================
// ACCOUNT EMAILS
// ============================================

export async function sendAccountSuspendedEmail(to: string, reason?: string) {
  const html = baseTemplate(`
    <h2>تم إيقاف حسابك مؤقتاً</h2>
    <p>تم إيقاف حسابك مؤقتاً${reason ? ` بسبب: ${reason}` : ''}.</p>
    <p>إذا كنت تعتقد أن هذا خطأ، يرجى التواصل معنا.</p>
  `);
  
  return sendEmail({
    to,
    subject: 'إيقاف الحساب مؤقتاً',
    html,
  });
}

export async function sendAccountBannedEmail(to: string, reason?: string) {
  const html = baseTemplate(`
    <h2>تم حظر حسابك</h2>
    <p>تم حظر حسابك نهائياً${reason ? ` بسبب: ${reason}` : ''}.</p>
  `);
  
  return sendEmail({
    to,
    subject: 'حظر الحساب',
    html,
  });
}

export async function sendAccountActivatedEmail(to: string, name: string) {
  const html = baseTemplate(`
    <h2>تم تفعيل حسابك!</h2>
    <p>مرحباً ${name}،</p>
    <p>تم تفعيل حسابك بنجاح. يمكنك الآن استخدام جميع ميزات الموقع.</p>
    <a href="${absoluteUrl('/')}" class="button">تصفح الموقع</a>
  `);
  
  return sendEmail({
    to,
    subject: 'تم تفعيل حسابك',
    html,
  });
}

// ============================================
// SELLER VERIFICATION EMAILS
// ============================================

export async function sendSellerVerificationApprovedEmail(to: string, storeName: string) {
  const html = baseTemplate(`
    <h2>تمت الموافقة على متجرك!</h2>
    <p>تهانينا! تمت الموافقة على متجر <strong>${storeName}</strong>.</p>
    <p>يمكنك الآن البدء ببيع منتجاتك.</p>
    <a href="${absoluteUrl('/seller/dashboard')}" class="button">لوحة التحكم</a>
  `);
  
  return sendEmail({
    to,
    subject: 'تمت الموافقة على متجرك',
    html,
  });
}

export async function sendSellerVerificationRejectedEmail(to: string, storeName: string, reason?: string) {
  const html = baseTemplate(`
    <h2>لم تتم الموافقة على متجرك</h2>
    <p>للأسف، لم تتم الموافقة على متجر <strong>${storeName}</strong>${reason ? ` بسبب: ${reason}` : ''}.</p>
    <p>يمكنك تعديل بياناتك وإعادة التقديم.</p>
  `);
  
  return sendEmail({
    to,
    subject: 'لم تتم الموافقة على متجرك',
    html,
  });
}

export async function sendDisputeEscalatedEmail(
  to: string,
  disputeId: string,
  orderId: string,
  reason: string
) {
  const html = baseTemplate(`
    <h2>تم تصعيد النزاع</h2>
    <p>تم تصعيد النزاع على الطلب رقم: <strong>${orderId}</strong> بسبب عدم الرد خلال 48 ساعة.</p>
    <p><strong>السبب الأصلي:</strong> ${reason}</p>
    <p>سيقوم فريق الإدارة بمراجعة النزاع واتخاذ القرار المناسب.</p>
  `);
  
  return sendEmail({
    to,
    subject: `تصعيد نزاع - الطلب #${orderId.slice(-8)}`,
    html,
  });
}

// ============================================
// ADMIN CRITICAL EVENT EMAILS
// ============================================

const SUPER_ADMIN_EMAIL = 'ahmadalwakai76@gmail.com';

export async function sendAdminCriticalEventEmail(
  type: string,
  title: string,
  body: string,
  entityType?: string,
  entityId?: string
) {
  const entityLink = entityType && entityId
    ? `<p><strong>النوع:</strong> ${entityType} | <strong>المعرّف:</strong> ${entityId}</p>`
    : '';

  const html = baseTemplate(`
    <h2>🔔 تنبيه إداري: ${title}</h2>
    <p><strong>النوع:</strong> ${type}</p>
    <p>${body}</p>
    ${entityLink}
    <a href="${absoluteUrl('/admin')}" class="button">لوحة التحكم</a>
  `);

  return sendEmail({
    to: SUPER_ADMIN_EMAIL,
    subject: `[SES Admin] ${title}`,
    html,
  }).catch((err) => {
    console.error('Failed to send admin critical email:', err);
  });
}

const emailService = {
  sendEmail,
  sendWelcomeEmail,
  sendWelcomeEmailWithRole,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendOrderPlacedEmail,
  sendOrderStatusUpdateEmail,
  sendSellerNewOrderEmail,
  sendDisputeOpenedEmail,
  sendDisputeResolvedEmail,
  sendDisputeEscalatedEmail,
  sendAccountSuspendedEmail,
  sendAccountBannedEmail,
  sendAccountActivatedEmail,
  sendSellerVerificationApprovedEmail,
  sendSellerVerificationRejectedEmail,
  sendAdminCriticalEventEmail,
  sendAdminWelcomeEmail,
  sendAdminInviteEmail,
};

export default emailService;

// ============================================
// ADMIN MANAGEMENT EMAILS
// ============================================

/**
 * Send welcome email to an existing user who was promoted to Admin
 */
export async function sendAdminWelcomeEmail(to: string, name: string) {
  const html = baseTemplate(`
    <h2>مرحباً ${name}!</h2>
    <p>تمت ترقيتك إلى <strong>مشرف</strong> في سوريا للتسوق الإلكتروني.</p>
    <p>يمكنك الآن الوصول إلى لوحة تحكم المشرف لإدارة المنصة.</p>
    <a href="${absoluteUrl('/admin')}" class="button">لوحة تحكم المشرف</a>
    <p><small>إذا لم تطلب هذا، يرجى التواصل مع الإدارة فوراً.</small></p>
  `);

  return sendEmail({
    to,
    subject: 'Welcome to SES Marketplace Admin',
    html,
  });
}

/**
 * Send invite email to a new user being invited as Admin
 */
export async function sendAdminInviteEmail(to: string, token: string) {
  const inviteUrl = absoluteUrl(`/auth/register?invite=${token}&email=${encodeURIComponent(to)}`);
  const html = baseTemplate(`
    <h2>دعوة للانضمام كمشرف</h2>
    <p>تمت دعوتك للانضمام كـ <strong>مشرف</strong> في سوريا للتسوق الإلكتروني.</p>
    <p>اضغط على الزر أدناه لإنشاء حسابك وتعيين كلمة المرور:</p>
    <a href="${inviteUrl}" class="button">قبول الدعوة</a>
    <p><small>هذا الرابط صالح لمدة 24 ساعة فقط.</small></p>
    <p><small>إذا لم تطلب هذا، تجاهل هذا البريد.</small></p>
  `);

  return sendEmail({
    to,
    subject: 'Welcome to SES Marketplace Admin',
    html,
  });
}
