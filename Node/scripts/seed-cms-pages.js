/**
 * Seed Script: Create 4 required CMS pages for Employee portal footer links
 *
 * Pages created:
 *   1. System User Guide      (slug: system-user-guide)
 *   2. Privacy Policy          (slug: privacy-policy)
 *   3. Terms & Conditions      (slug: terms-conditions)
 *   4. End User Licence Agreement (slug: end-user-licence-agreement)
 *
 * Usage: cd Node && node scripts/seed-cms-pages.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/dbDirect');

const CMS_PAGES = [
  {
    name_en: 'System User Guide',
    name_ar: 'دليل المستخدم للنظام',
    slug: 'system-user-guide',
    description_en: JSON.stringify({
      blocks: [
        { id: 'sug1', type: 'header', data: { text: 'System User Guide', level: 2 } },
        { id: 'sug2', type: 'paragraph', data: { text: 'Welcome to the GDRFA Sports System User Guide. This guide will help you navigate and use the system effectively.' } },
        { id: 'sug3', type: 'header', data: { text: 'Getting Started', level: 3 } },
        { id: 'sug4', type: 'paragraph', data: { text: 'To get started, log in using your GDRFA credentials. The system supports single sign-on (SSO) through CIAM.' } },
        { id: 'sug5', type: 'header', data: { text: 'Key Features', level: 3 } },
        { id: 'sug6', type: 'list', data: { style: 'unordered', items: ['View and register for sports events', 'Track your fitness evaluations', 'Download participation certificates', 'Book facility reservations', 'View achievements and leaderboards'] } },
        { id: 'sug7', type: 'header', data: { text: 'Event Registration', level: 3 } },
        { id: 'sug8', type: 'paragraph', data: { text: 'Browse available sports events and register by selecting your preferred activity. Registration requires manager approval before confirmation.' } },
        { id: 'sug9', type: 'header', data: { text: 'Facility Booking', level: 3 } },
        { id: 'sug10', type: 'paragraph', data: { text: 'Reserve sports facilities by selecting your preferred date and time slot. You will receive confirmation once your booking is approved.' } },
        { id: 'sug11', type: 'header', data: { text: 'Need Help?', level: 3 } },
        { id: 'sug12', type: 'paragraph', data: { text: 'For technical support, contact the IT Service Desk at <b>047075999</b> or email <b>servicedesk@gdrfa.ae</b>.' } },
      ],
    }),
    description_ar: JSON.stringify({
      blocks: [
        { id: 'sugar1', type: 'header', data: { text: 'دليل المستخدم للنظام', level: 2 } },
        { id: 'sugar2', type: 'paragraph', data: { text: 'مرحباً بك في دليل مستخدم نظام رياضة هيئة الإقامة وشؤون الأجانب. سيساعدك هذا الدليل على التنقل في النظام واستخدامه بفعالية.' } },
        { id: 'sugar3', type: 'header', data: { text: 'البدء', level: 3 } },
        { id: 'sugar4', type: 'paragraph', data: { text: 'للبدء، قم بتسجيل الدخول باستخدام بيانات اعتماد هيئة الإقامة. يدعم النظام تسجيل الدخول الموحد (SSO) عبر CIAM.' } },
        { id: 'sugar5', type: 'header', data: { text: 'الميزات الرئيسية', level: 3 } },
        { id: 'sugar6', type: 'list', data: { style: 'unordered', items: ['عرض الفعاليات الرياضية والتسجيل فيها', 'تتبع تقييمات لياقتك البدنية', 'تحميل شهادات المشاركة', 'حجز مرافق الرياضة', 'عرض الإنجازات ولوحات الصدارة'] } },
        { id: 'sugar7', type: 'header', data: { text: 'تسجيل الفعاليات', level: 3 } },
        { id: 'sugar8', type: 'paragraph', data: { text: 'تصفح الفعاليات الرياضية المتاحة وسجل عن طريق اختيار النشاط المفضل. يتطلب التسجيل موافقة المدير قبل التأكيد.' } },
        { id: 'sugar9', type: 'header', data: { text: 'حجز المرافق', level: 3 } },
        { id: 'sugar10', type: 'paragraph', data: { text: 'احجز المرافق الرياضية عن طريق اختيار التاريخ والوقت المفضل. ستتلقى تأكيداً بمجرد الموافقة على حجزك.' } },
        { id: 'sugar11', type: 'header', data: { text: 'هل تحتاج مساعدة؟', level: 3 } },
        { id: 'sugar12', type: 'paragraph', data: { text: 'للحصول على الدعم الفني، اتصل بخدمة تكنولوجيا المعلومات على <b>047075999</b> أو عبر البريد الإلكتروني <b>servicedesk@gdrfa.ae</b>.' } },
      ],
    }),
  },
  {
    name_en: 'Privacy Policy',
    name_ar: 'سياسة الخصوصية',
    slug: 'privacy-policy',
    description_en: JSON.stringify({
      blocks: [
        { id: 'pp1', type: 'header', data: { text: 'Privacy Policy', level: 2 } },
        { id: 'pp2', type: 'paragraph', data: { text: 'Last updated: January 2026' } },
        { id: 'pp3', type: 'paragraph', data: { text: 'GDRFA Sports ("we", "our", or "us") operates the sports and fitness management platform. This Privacy Policy explains how we collect, use, and protect your personal information.' } },
        { id: 'pp4', type: 'header', data: { text: 'Information We Collect', level: 3 } },
        { id: 'pp5', type: 'list', data: { style: 'unordered', items: ['Employee identification details (via CIAM SSO)', 'Event participation records', 'Fitness evaluation results', 'Facility booking information', 'Profile images and contact details'] } },
        { id: 'pp6', type: 'header', data: { text: 'How We Use Your Information', level: 3 } },
        { id: 'pp7', type: 'list', data: { style: 'unordered', items: ['Managing event registrations and approvals', 'Tracking fitness evaluations and progress', 'Generating participation certificates', 'Facility booking management', 'Sending notifications and updates'] } },
        { id: 'pp8', type: 'header', data: { text: 'Data Protection', level: 3 } },
        { id: 'pp9', type: 'paragraph', data: { text: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.' } },
        { id: 'pp10', type: 'header', data: { text: 'Contact Us', level: 3 } },
        { id: 'pp11', type: 'paragraph', data: { text: 'For privacy-related inquiries, contact us at <b>servicedesk@gdrfa.ae</b>.' } },
      ],
    }),
    description_ar: JSON.stringify({
      blocks: [
        { id: 'ppar1', type: 'header', data: { text: 'سياسة الخصوصية', level: 2 } },
        { id: 'ppar2', type: 'paragraph', data: { text: 'آخر تحديث: يناير 2026' } },
        { id: 'ppar3', type: 'paragraph', data: { text: 'رياضة هيئة الإقامة وشؤون الأجانب ("نحن") تدير منصة إدارة الرياضة واللياقة البدنية. توضح سياسة الخصوصية هذه كيف نجمع معلوماتك الشخصية ونستخدمها ونحميها.' } },
        { id: 'ppar4', type: 'header', data: { text: 'المعلومات التي نجمعها', level: 3 } },
        { id: 'ppar5', type: 'list', data: { style: 'unordered', items: ['تفاصيل تعريف الموظفين ( عبر CIAM SSO)', 'سجلات المشاركة في الفعاليات', 'نتائج تقييم اللياقة البدنية', 'معلومات حجز المرافق', 'صور الملف الشخصي وبيانات الاتصال'] } },
        { id: 'ppar6', type: 'header', data: { text: 'كيف نستخدم معلوماتك', level: 3 } },
        { id: 'ppar7', type: 'list', data: { style: 'unordered', items: ['إدارة التسجيلات في الفعاليات والموافقات', 'تتبع تقييمات اللياقة البدنية والتقدم', 'إصدار شهادات المشاركة', 'إدارة حجز المرافق', 'إرسال الإشعارات والتحديثات'] } },
        { id: 'ppar8', type: 'header', data: { text: 'حماية البيانات', level: 3 } },
        { id: 'ppar9', type: 'paragraph', data: { text: 'نقوم بتطبيق تدابير أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف.' } },
        { id: 'ppar10', type: 'header', data: { text: 'اتصل بنا', level: 3 } },
        { id: 'ppar11', type: 'paragraph', data: { text: 'لمستفسرات الخصوصية، تواصل معنا عبر البريد الإلكتروني <b>servicedesk@gdrfa.ae</b>.' } },
      ],
    }),
  },
  {
    name_en: 'Terms & Conditions',
    name_ar: 'الشروط والأحكام',
    slug: 'terms-conditions',
    description_en: JSON.stringify({
      blocks: [
        { id: 'tc1', type: 'header', data: { text: 'Terms & Conditions', level: 2 } },
        { id: 'tc2', type: 'paragraph', data: { text: 'Last updated: January 2026' } },
        { id: 'tc3', type: 'paragraph', data: { text: 'By accessing and using the GDRFA Sports platform, you agree to comply with the following terms and conditions.' } },
        { id: 'tc4', type: 'header', data: { text: 'Eligibility', level: 3 } },
        { id: 'tc5', type: 'paragraph', data: { text: 'The platform is exclusively available to GDRFA employees and authorized personnel. Access is managed through CIAM single sign-on authentication.' } },
        { id: 'tc6', type: 'header', data: { text: 'Event Participation', level: 3 } },
        { id: 'tc7', type: 'list', data: { style: 'unordered', items: ['Registration is subject to manager approval', 'Participants must meet eligibility criteria for each event', 'Event coordinators reserve the right to modify or cancel events', 'Participants must follow safety guidelines during events'] } },
        { id: 'tc8', type: 'header', data: { text: 'Facility Usage', level: 3 } },
        { id: 'tc9', type: 'list', data: { style: 'unordered', items: ['Bookings are subject to availability and approval', 'Users must adhere to facility rules and regulations', 'Cancellation must be made at least 24 hours in advance', 'Misuse of facilities may result in booking privileges being revoked'] } },
        { id: 'tc10', type: 'header', data: { text: 'Intellectual Property', level: 3 } },
        { id: 'tc11', type: 'paragraph', data: { text: 'All content, logos, and materials on this platform are the property of GDRFA and protected by applicable intellectual property laws.' } },
        { id: 'tc12', type: 'header', data: { text: 'Limitation of Liability', level: 3 } },
        { id: 'tc13', type: 'paragraph', data: { text: 'GDRFA shall not be liable for any injuries, losses, or damages arising from participation in sports activities or use of facilities through this platform.' } },
        { id: 'tc14', type: 'header', data: { text: 'Contact', level: 3 } },
        { id: 'tc15', type: 'paragraph', data: { text: 'For questions regarding these terms, contact <b>servicedesk@gdrfa.ae</b>.' } },
      ],
    }),
    description_ar: JSON.stringify({
      blocks: [
        { id: 'tcar1', type: 'header', data: { text: 'الشروط والأحكام', level: 2 } },
        { id: 'tcar2', type: 'paragraph', data: { text: 'آخر تحديث: يناير 2026' } },
        { id: 'tcar3', type: 'paragraph', data: { text: 'باستخدامك لمنصة رياضة هيئة الإقامة وشؤون الأجانب، أنت توافق على الالتزام بالشروط والأحكام التالية.' } },
        { id: 'tcar4', type: 'header', data: { text: 'الأهلية', level: 3 } },
        { id: 'tcar5', type: 'paragraph', data: { text: 'المنصة متاحة حصرياً لموظفي هيئة الإقامة وشؤون الأجانب والموظفين المعتمدين. يتم إدارة الوصول من خلال تسجيل الدخول الموحد CIAM.' } },
        { id: 'tcar6', type: 'header', data: { text: 'المشاركة في الفعاليات', level: 3 } },
        { id: 'tcar7', type: 'list', data: { style: 'unordered', items: ['يخضع التسجيل لموافقة المدير', 'يجب أن يستوفي المشاركون معايير الأهلية لكل فعالية', 'يحتفظ منظمو الفعاليات بحق تعديل الفعاليات أو إلغائها', 'يجب على المشاركين اتباع إرشادات السلامة أثناء الفعاليات'] } },
        { id: 'tcar8', type: 'header', data: { text: 'استخدام المرافق', level: 3 } },
        { id: 'tcar9', type: 'list', data: { style: 'unordered', items: ['يخضع الحجز للتوفر والموافقة', 'يجب على المستخدمين الالتزام بقواعد و regulations المرافق', 'يجب إجراء الإلغاء قبل 24 ساعة على الأقل', 'قد يؤدي سوء استخدام المرافق إلى سحب صلاحية الحجز'] } },
        { id: 'tcar10', type: 'header', data: { text: 'المال الفكرية', level: 3 } },
        { id: 'tcar11', type: 'paragraph', data: { text: 'جميع المحتويات والشعارات والمواد على هذه المنصة هي ملك لهيئة الإقامة ومحققة بموجب قوانين حماية الملك الفكرية المعمول بها.' } },
        { id: 'tcar12', type: 'header', data: { text: 'حدود المسؤولية', level: 3 } },
        { id: 'tcar13', type: 'paragraph', data: { text: 'لا تتحمل هيئة الإقامة المسؤولية عن أي إصابات أو خسائر أو أضرار ناتجة عن المشاركة في الأنشطة الرياضية أو استخدام المرافق من خلال هذه المنصة.' } },
        { id: 'tcar14', type: 'header', data: { text: 'اتصل بنا', level: 3 } },
        { id: 'tcar15', type: 'paragraph', data: { text: 'للأسئلة المتعلقة بهذه الشروط، تواصل عبر البريد الإلكتروني <b>servicedesk@gdrfa.ae</b>.' } },
      ],
    }),
  },
  {
    name_en: 'End User Licence Agreement',
    name_ar: 'اتفاقية ترخيص المستخدم النهائي',
    slug: 'end-user-licence-agreement',
    description_en: JSON.stringify({
      blocks: [
        { id: 'eula1', type: 'header', data: { text: 'End User Licence Agreement', level: 2 } },
        { id: 'eula2', type: 'paragraph', data: { text: 'Last updated: January 2026' } },
        { id: 'eula3', type: 'paragraph', data: { text: 'This End User Licence Agreement ("Agreement") is a legal agreement between you and GDRFA for the use of the GDRFA Sports platform.' } },
        { id: 'eula4', type: 'header', data: { text: 'Grant of Licence', level: 3 } },
        { id: 'eula5', type: 'paragraph', data: { text: 'Subject to the terms of this Agreement, GDRFA grants you a non-exclusive, non-transferable, limited licence to access and use the GDRFA Sports platform for official purposes during your employment with GDRFA.' } },
        { id: 'eula6', type: 'header', data: { text: 'Restrictions', level: 3 } },
        { id: 'eula7', type: 'list', data: { style: 'unordered', items: ['You may not copy, modify, distribute, sell, or lease any part of the platform', 'You may not reverse engineer or attempt to extract source code', 'You may not share your access credentials with others', 'You may not use the platform for any unauthorized or illegal purpose'] } },
        { id: 'eula8', type: 'header', data: { text: 'User Responsibilities', level: 3 } },
        { id: 'eula9', type: 'list', data: { style: 'unordered', items: ['Maintain the confidentiality of your login credentials', 'Report any security vulnerabilities or misuse', 'Use the platform in compliance with GDRFA policies', 'Accept responsibility for all activities under your account'] } },
        { id: 'eula10', type: 'header', data: { text: 'Termination', level: 3 } },
        { id: 'eula11', type: 'paragraph', data: { text: 'This licence terminates automatically upon termination of your employment with GDRFA or if you breach any terms of this Agreement.' } },
        { id: 'eula12', type: 'header', data: { text: 'Contact', level: 3 } },
        { id: 'eula13', type: 'paragraph', data: { text: 'For questions about this agreement, contact <b>servicedesk@gdrfa.ae</b>.' } },
      ],
    }),
    description_ar: JSON.stringify({
      blocks: [
        { id: 'eulaar1', type: 'header', data: { text: 'اتفاقية ترخيص المستخدم النهائي', level: 2 } },
        { id: 'eulaar2', type: 'paragraph', data: { text: 'آخر تحديث: يناير 2026' } },
        { id: 'eulaar3', type: 'paragraph', data: { text: 'هذه اتفاقية ترخيص المستخدم النهائي ("الاتفاقية") هي اتفاقية قانونية بينك وبين هيئة الإقامة لاستخدام منصة رياضة هيئة الإقامة.' } },
        { id: 'eulaar4', type: 'header', data: { text: 'منح الترخيص', level: 3 } },
        { id: 'eulaar5', type: 'paragraph', data: { text: 'وفقاً لشروط هذه الاتفاقية، تمنحك هيئة الإقامة ترخيصاً غير حصري وغير قابل للتحويل ومحدود الوصول واستخدام منصة رياضة هيئة الإقامة للأغراض الرسمية أثناء عملك في الهيئة.' } },
        { id: 'eulaar6', type: 'header', data: { text: 'القيود', level: 3 } },
        { id: 'eulaar7', type: 'list', data: { style: 'unordered', items: ['لا يجوز لك نسخ أو تعديل أو توزيع أو بيع أو تأجير أي جزء من المنصة', 'لا يجوز لك الهندسة العكسية أو محاولة استخراج الكود المصدري', 'لا يجوز لك مشاركة بيانات الدخول الخاصة بك مع الآخرين', 'لا يجوز لك استخدام المنصة لأي غرض غير مصرح به أو غير قانوني'] } },
        { id: 'eulaar8', type: 'header', data: { text: 'مسؤوليات المستخدم', level: 3 } },
        { id: 'eulaar9', type: 'list', data: { style: 'unordered', items: ['الحفاظ على سرية بيانات الدخول الخاصة بك', 'الإبلاغ عن أي ثغرات أمنية أو سوء استخدام', 'استخدام المنصة وفقاً لسياسات الهيئة', 'القبول بالمسؤولية عن جميع الأنشطة تحت حسابك'] } },
        { id: 'eulaar10', type: 'header', data: { text: 'الإنهاء', level: 3 } },
        { id: 'eulaar11', type: 'paragraph', data: { text: 'ينتهي هذا الترخيص تلقائياً عند إنهاء عملك في الهيئة أو إذا خالفت أي شروط من هذه الاتفاقية.' } },
        { id: 'eulaar12', type: 'header', data: { text: 'اتصل بنا', level: 3 } },
        { id: 'eulaar13', type: 'paragraph', data: { text: 'للأسئلة حول هذه الاتفاقية، تواصل عبر البريد الإلكتروني <b>servicedesk@gdrfa.ae</b>.' } },
      ],
    }),
  },
];

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   CMS Pages Seed Script                            ║');
  console.log('║   Creates 4 required pages for Employee portal     ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  try {
    console.log('📡 Testing database connection...');
    const connected = await db.testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database. Aborting.');
      process.exit(1);
    }
    console.log('✅ Database connected.\n');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const page of CMS_PAGES) {
      const existing = await db.queryOne(
        `SELECT id, slug FROM cms_pages WHERE slug = ? AND deletedAt IS NULL`,
        [page.slug]
      );

      if (existing) {
        await db.query(
          `UPDATE cms_pages SET name_en = ?, name_ar = ?, description_en = ?, description_ar = ?, updatedAt = SYSDATETIME() WHERE id = ?`,
          [page.name_en, page.name_ar, page.description_en, page.description_ar, existing.id]
        );
        console.log(`  ✏️  Updated: "${page.name_en}" (slug: ${page.slug}, id: ${existing.id})`);
        updated++;
      } else {
        await db.query(
          `INSERT INTO cms_pages (name_en, name_ar, slug, description_en, description_ar, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, '1', SYSDATETIME(), SYSDATETIME())`,
          [page.name_en, page.name_ar, page.slug, page.description_en, page.description_ar]
        );
        console.log(`  ➕ Created: "${page.name_en}" (slug: ${page.slug})`);
        created++;
      }
    }

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║   ✅ Seed Complete!                                 ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    console.log('📋 Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('\n📋 Pages:');
    CMS_PAGES.forEach(p => {
      console.log(`   - ${p.name_en} → /${p.slug}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
