/**
 * translationSheet.js
 * Centralized Email & Notification translations sourced from the client's
 * "GDRFA - Email & Notification Translation Sheet (English to Arabic)".
 *
 * Defaults to Arabic ('ar') per product decision ("Arabic for everyone").
 * English strings are kept in the map so the English path is never broken.
 *
 * Use:
 *   const { tr, trTitle, trMessage } = require('../utils/translationSheet');
 *
 *   tr('A1')                         // -> Arabic email subject
 *   tr('C1-1', 'ar', { User: name }) // -> Arabic body with placeholder filled
 *   trTitle('D6')  / trMessage('D6') // -> notification title / message (ar)
 *   tr('G1')                         // -> status value Arabic ("معتمد")
 *
 * Placeholder replacement is case-insensitive, so {Event} == {event}.
 */

// id -> raw sheet item
const ITEMS = {
  // ── A. EMAIL SUBJECTS ──
  A1:  { en: "GDRFA - Event Registration Cancelled", ar: "إلغاء المشاركة في فعالية" },
  A2:  { en: "GDRFA - Event Registration Re-approved", ar: "إعادة اعتماد المشاركة في فعالية" },
  A3:  { en: "GDRFA - Registration Approved: {Event Name}", ar: "اعتماد طلب التسجيل لفعالية" },
  A4:  { en: "GDRFA - Registration Advanced: {Event Name}", ar: "تقدم عملية التسجيل" },
  A5:  { en: "GDRFA - Approval Request: {Event Name}", ar: "طلب اعتماد" },
  A6:  { en: "GDRFA - Registration Rejected: {Event Name}", ar: "رفض طلب التسجيل لفعالية" },
  A7:  { en: "GDRFA - Your Facility Request Status Changed", ar: "تحديث على حالة طلب حجز مرافق رياضية" },
  A8:  { en: "GDRFA - Welcome to Our Platform!", ar: "أهلاً بكم منصة الأنشطة الرياضية!" },
  A9:  { en: "GDRFA - Reset Your Password", ar: "إعادة ضبط كلمة المرور" },
  A10: { en: "GDRFA Admin - Reset Your Password", ar: "قم بإعادة ضبط كلمة المرور الخاصة بك" },
  A11: { en: "GDRFA - Event Participation Request: {Event Name}", ar: "طلب المشاركة بفعالية" },
  A12: { en: "GDRFA - New Participant Registered: {Event Name}", ar: "تسجيل مشارك جديد" },
  A13: { en: "GDRFA - Activity Invitation: {Event Name}", ar: "دعوة للمشاركة بفعالية" },

  // ── B. EMAIL HEADER TITLES & BUTTON TEXT ──
  B1:  { en: "Registration Cancelled", ar: "إلغاء طلب المشاركة" },
  B2:  { en: "Registration Re-approved", ar: "إعادة اعتماد طلب المشاركة" },
  B3:  { en: "Registration Fully Approved", ar: "الاعتماد النهائي لطلب المشاركة" },
  B4:  { en: "Registration Advanced", ar: "تقدم عملية التسجيل" },
  B5:  { en: "New Approval Request", ar: "اعتماد جديد" },
  B6:  { en: "Registration Rejected", ar: "رفض طلب المشاركة" },
  B7:  { en: "Facility Request Status Changed", ar: "تحديث على حالة طلب حجز مرافق رياضية" },
  B8:  { en: "Welcome to Our Platform!", ar: "أهلاً بكم في منصة الأنشطة الرياضية" },
  B9:  { en: "Get Started", ar: "ابدأ الآن" },
  B10: { en: "Reset Your Password", ar: "قم بإعادة ضبط كلمة المرور الخاصة بك" },
  B11: { en: "Reset Password", ar: "إعادة ضبط كلمة المرور" },
  B12: { en: "Reset Your Admin Password", ar: "قم بإعادة ضبط كلمة مرور مسؤول النظام" },
  B13: { en: "Employee Event Participation Notification", ar: "إشعار طلب مشاركة بفعالية" },
  B14: { en: "New Event Participant Registration", ar: "تسجيل مشارك جديد بالفعالية" },
  B15: { en: "You're Invited to a Sports Activity!", ar: "دعوة للمشاركة بفعالية رياضية" },

  // ── C1. REGISTRATION STATUS EMAIL BODY ──
  "C1-1":  { en: "Hello {User}!", ar: "مرحباً {User}!" },
  "C1-2":  { en: "Your request to participate in the following event has been {Status}.", ar: "نود إعلامكم بأنه تمت مراجعة طلب المشاركة بفعالية رياضية و تم تحديث حالة الطلب إلى {Status}" },
  "C1-3":  { en: "Reason: {Reason}", ar: "" },
  "C1-4":  { en: "Your registration has been cancelled by the event administrator.", ar: "نود إعلامكم بأنة تم إلغاء مشاركتكم في الفعالية من قبل مسؤول النظام" },
  "C1-5":  { en: "Your registration has been re-approved by the event administrator.", ar: "نود إعلامكم بأنه تم إعادة اعتماد طلب مشاركتكم بالفعالية الرياضية" },
  "C1-6":  { en: "Your request has been forwarded to the next approver.", ar: "تمت إحالة طلبكم إلى جهة الاعتماد التالية لاستكمال خطوات الاعتماد" },
  "C1-7":  { en: "Your request was not approved.", ar: "لم تتم الموافقة على طلبك" },
  "C1-8":  { en: "To {Start} - {End}", ar: "إلى {start}-{end}" },
  "C1-9":  { en: "✅ We look forward to your participation in the event.", ar: "✅ يسعدنا مشاركتكم في الفعالية، و نتطلع إلى حضوركم و مشاركتكم" },
  "C1-10": { en: "❌ Your registration has been cancelled by the administrator.", ar: "❌ نحيطكم علمًا بأنه تم إلغاء تسجيلكم من قِبل مسؤول النظام" },
  "C1-11": { en: "If you believe this is a mistake, please contact the event administrator.", ar: "إذا كنتم تعتقدون أن هذا الإجراء قد تم عن طريق الخطأ، يرجى التواصل مع الجهة المسؤولة عن إدارة الفعالية." },
  "C1-12": { en: "❌ Unfortunately, your request could not be approved at this time.", ar: "❌ نأسف لإبلاغكم بأنه تعذّر اعتماد طلبكم في الوقت الحالي" },

  // ── C2. COMMON TABLE LABELS ──
  "C2-1": { en: "📅 Event Details", ar: "تفاصيل الفعالية" },
  "C2-2": { en: "Event Name:", ar: "اسم الفعالية" },
  "C2-3": { en: "Location:", ar: "الموقع" },
  "C2-4": { en: "Start Date:", ar: "تاريخ بدء الفعالية" },
  "C2-5": { en: "End Date:", ar: "تاريخ انتهاء الفعالية" },
  "C2-6": { en: "Start Time:", ar: "وقت بدء الفعالية" },
  "C2-7": { en: "End Time:", ar: "وقت انتهاء الفعالية" },
  "C2-8": { en: "Activity:", ar: "النشاط" },
  "C2-9": { en: "Date:", ar: "التاريخ" },
  "C2-10": { en: "Time:", ar: "الوقت" },
  "C2-11": { en: "Description:", ar: "التفاصيل" },
  "C2-12": { en: "Status:", ar: "الحالة" },
  "C2-13": { en: "N/A", ar: "غير متاح" },

  // ── C3. EMAIL SIGN-OFF / FOOTER ──
  "C3-1": { en: "Best regards,", ar: "و تفضلوا بقبول فائق الاحترام و التقدير" },
  "C3-2": { en: "GDRFA Sports & Recreation Department", ar: "إدارة الشؤون الرياضية" },
  "C3-3": { en: "GDRFA Events Team", ar: "فريق تنظيم الفعاليات" },
  "C3-4": { en: "The GDRFA Team", ar: "فريق الإدارة العامة للهوية و شؤون الأجانب" },
  "C3-5": { en: "General Directorate of Residency and Foreigners Affairs", ar: "الإدارة العامة للهوية و شؤون الأجانب" },
  "C3-6": { en: "Sports & Recreation Department - Event Management System", ar: "إدارة الشؤون الرياضية- تنظيم الفعاليات" },
  "C3-7": { en: "Sports & Recreation Department", ar: "إدارة الشؤون الرياضية" },
  "C3-8": { en: "© 2025 GDRFA. All rights reserved.", ar: "© 2025 الإدارة العامة للإقامة وشؤون الأجانب – جميع الحقوق محفوظة" },

  // ── C4. MANAGER NOTIFICATION EMAIL ──
  "C4-1": { en: "Hello {Manager},", ar: "مرحباً {manager}" },
  "C4-2": { en: "We would like to inform you that your team member {Member} has successfully registered for an event. Please find the complete details below:", ar: "نحيطكم علمًا بأن عضو فريقكم {Member} قد أتم بنجاح إجراءات التسجيل في الفعالية. يرجى التكرم بالاطلاع أدناه على كافة تفاصيل التسجيل" },
  "C4-3": { en: "User Details", ar: "تفاصيل المستخدم" },
  "C4-4": { en: "Full Name:", ar: "الاسم الكامل" },
  "C4-5": { en: "Email:", ar: "البريد الإلكتروني" },
  "C4-6": { en: "Phone:", ar: "رقم الهاتف" },
  "C4-7": { en: "User Link:", ar: "رابط المستخدم:" },
  "C4-8": { en: "View User Details", ar: "عرض تفاصيل المستخدم" },
  "C4-9": { en: "This is an automated notification to keep you informed about your team member's event participation. Please review the details and contact us if you require any additional information.", ar: "هذا إشعار آلي لإحاطتكم علمًا بمشاركة عضو فريقكم في الفعالية. يرجى التكرم بمراجعة التفاصيل الواردة أعلاه، وفي حال الحاجة إلى أي معلومات إضافية، يرجى التواصل معنا" },

  // ── C5. FACILITY REQUEST STATUS EMAIL ──
  "C5-1": { en: "Hello {Name},", ar: "مرحباً{name}،" },
  "C5-2": { en: "Your facility booking request status has been updated. Here are the details:", ar: "تم تحديث حالة طلب حجز المرافق الرياضية الخاص بكم. التفاصيل موضحة أدناه:" },
  "C5-3": { en: "Facility:", ar: "المنشأة الرياضية" },
  "C5-4": { en: "If you have any questions regarding this request, please contact our support team.", ar: "في حال وجود أي استفسارات أو ملاحظات تتعلق بهذا الطلب، يرجى التكرم بالتواصل مع فريق الدعم المختص للحصول على المساعدة والمعلومات اللازمة" },

  // ── C6. PASSWORD RESET / WELCOME EMAIL ──
  "C6-1": { en: "Hello, {username}!", ar: "مرحباً {username}،" },
  "C6-2": { en: "You recently requested to reset your password. Click the button below to reset it.", ar: "لقد قمت بتقديم طلب لإعادة ضبط كلمة المرور الخاصة بكم. لإتمام عملية إعادة الضبط، يرجى الضغط على الزر أدناه واتباع التعليمات الظاهرة على الشاشة" },
  "C6-3": { en: "If you did not request a password reset, you can ignore this email.", ar: "إذا لم تكونوا قد تقدمتم بطلب لإعادة ضبط كلمة المرور، فيرجى تجاهل هذه الرسالة وعدم اتخاذ أي إجراء بشأنها" },
  "C6-4": { en: "Thanks for choosing GDRFA Admin.", ar: "شكراً لك على اختيارك" },
  "C6-5": { en: "Unsubscribe", ar: "إلغاء مشاركة" },
  "C6-6": { en: "these alerts.", ar: "هذه التنبيهات" },

  // ── C7. ADMIN - NEW PARTICIPANT REGISTRATION EMAIL ──
  "C7-1": { en: "Hello {Admin}!", ar: "مرحباً{admin}،" },
  "C7-2": { en: "A new participant has registered for your event {Event}. Please review the details below and take appropriate action if needed.", ar: "نحيطكم علمًا بأنه تم تسجيل مشارك جديد في الفعالية {Event}. يرجى التكرم بالاطلاع على تفاصيل التسجيل أدناه، واتخاذ ما يلزم من إجراءات وفقًا لذلك" },
  "C7-3": { en: "👤 Participant Information", ar: "بيانات المشارك" },
  "C7-4": { en: "Name:", ar: "الاسم" },
  "C7-5": { en: "Mobile:", ar: "رقم الهاتف المحمول" },
  "C7-6": { en: "Registration Type:", ar: "نوع التسجيل" },
  "C7-7": { en: "🏃 Individual Participant", ar: "مشارك فردي" },
  "C7-8": { en: "👑 Team Captain", ar: "مشاركة فريق" },
  "C7-9": { en: "Registration Date:", ar: "تاريخ التسجيل" },
  "C7-10": { en: "📋 Administrative Actions", ar: "الاجراءات الإدارية" },
  "C7-11": { en: "Review participant's profile and eligibility", ar: "مراجعة بيانات المشارك و أهليته للمشاركة" },
  "C7-12": { en: "Verify participant meets event requirements", ar: "التحقق من استيفاء المشارك لمتطلبات الفعالية" },
  "C7-13": { en: "Contact participant if additional information is needed", ar: "التواصل مع المشارك في حال الحاجة إلى معلومات إضافية" },
  "C7-14": { en: "Update event participant list and manage capacity", ar: "تحديث قائمة المشاركين في الفعالية وإدارة الطاقة الاستيعابية" },
  "C7-15": { en: "Take action on pending approvals if required", ar: "مراجعة طلبات الموافقة قيد الإجراء واتخاذ ما يلزم من إجراءات، حسب الحاجة" },
  "C7-16": { en: "View Participant Profile", ar: "عرض بيانات المشارك" },
  "C7-17": { en: "Manage Event", ar: "إدارة الفعالية" },
  "C7-18": { en: "This is an automated notification from the GDRFA Sports Management System.", ar: "هذا إشعار آلي صادر عن نظام إدارة الأنشطة الرياضية التابع للإدارة العامة للإقامة وشؤون الأجانب" },
  "C7-19": { en: "You are receiving this email because you are listed as an administrator for this event.", ar: "نود إفادتكم بأن هذا الإشعار موجّه إليكم بصفتكم المسؤول المعتمد عن إدارة الفعالية" },

  // ── C8. ACTIVITY INVITATION EMAIL (EMPLOYEE) ──
  "C8-1": { en: "Hello {Employee}!", ar: "مرحباً {employee}!" },
  "C8-2": { en: "We are excited to inform you that you have been invited to participate in a new activity. This is a great opportunity to engage in sports and recreational activities.", ar: "يسرّنا إبلاغكم بأنه قد تمت دعوتكم للمشاركة في فعالية جديدة. وتمثل هذه الدعوة فرصة للمشاركة في الأنشطة الرياضية والترفيهية والاستفادة من البرامج والفعاليات المتاحة." },
  "C8-3": { en: "Your Team Information", ar: "بيانات فريقك" },
  "C8-4": { en: "How to Participate", ar: "كيفية المشاركة" },
  "C8-5": { en: "Team Name:", ar: "اسم الفريق" },
  "C8-6": { en: "Your Role:", ar: "الدور الخاص بك" },
  "C8-7": { en: "Please log in to the GDRFA Sports Portal to view the full event details, check the schedule, and confirm your participation.", ar: "يرجى تسجيل الدخول إلى منصة الأنشطة الرياضية التابعة للإدارة العامة للإقامة وشؤون الأجانب للاطلاع على التفاصيل الكاملة للفعالية، ومراجعة الجدول الزمني، وتأكيد مشاركتكم." },
  "C8-8": { en: "If you have any questions, please contact your event coordinator.", ar: "في حال وجود أي استفسارات، يرجى التكرم بالتواصل مع منسق الفعالية المعتمد." },
  "C8-9": { en: "For any questions or concerns, please contact your event coordinator or system administrator.", ar: "في حال وجود أي استفسارات أو ملاحظات، يرجى التكرم بالتواصل مع منسق الفعالية المعتمد أو مسؤول النظام" },

  // ── D. IN-APP NOTIFICATIONS (title + message) ──
  D1:  { title: "New Sports Event: {Event}", titleAr: "فعالية جديدة", message: "{Event} is now live.", messageAr: "جارية الآن" },
  D2:  { title: "", titleAr: "فعالية رياضية جديدة: {event}", message: "Start: {startDate}", messageAr: "تاريخ البداية: {startdate}" },
  D3:  { title: "", titleAr: "", message: "End: {endDate}", messageAr: "تاريخ الانتهاء: {enddate}" },
  D4:  { title: "", titleAr: "", message: "Location: {Location}", messageAr: "الموقع" },
  D5:  { title: "", titleAr: "", message: "Open full event details: {url}", messageAr: "تصفح كامل التفاصيل: {url}" },
  D6:  { title: "Event Participant Status", titleAr: "حالة طلب المشاركة في الفعالية", message: "Your approved registration has been cancelled by the administrator.", messageAr: "تم الغاء مشاركتك من قبل مسؤول النظام." },
  D7:  { title: "Event Participant Status", titleAr: "حالة طلب المشاركة في الفعالية", message: "Your registration has been re-approved by the administrator.", messageAr: "تمت إعادة اعتماد طلب مشاركتك" },
  D8:  { title: "Registration Fully Approved", titleAr: "الموافقة النهائية على المشاركة", message: 'Your registration for "{Event}" has been fully approved.', messageAr: "تمت الموافقة النهائية على طلب مشاركتك" },
  D9:  { title: "Registration Advanced", titleAr: "تقدم عملية التسجيل", message: 'Your registration for "{Event}" has been approved and sent to the next level.', messageAr: "نود إعلامكم بتقدم عملية اعتماد طلبكم للمشاركة بفعالية {event}" },
  D10: { title: "New Approval Request", titleAr: "طلب اعتماد جديد", message: 'Employee {Name} has requested approval for "{Event}".', messageAr: "تقدم الموظف {name} بطلب اعتماد للمشاركة في فعالية {event}" },
  D11: { title: "Fully Approved Registration", titleAr: "اعتماد طلب مشاركة", message: 'Registration for "{Event}" by {Name} is fully approved.', messageAr: "تم الاعتماد النهائي لطلب المشاركة بفعالية {event} و الذي تم تقديمه من قبل {name}" },
  D12: { title: "Participant Fully Approved", titleAr: "اعتماد طلب مشاركة", message: 'Registration for "{Event}" by {Name} is fully approved.', messageAr: "تم الاعتماد النهائي لطلب المشاركة بفعالية {event} و الذي تم تقديمه من قبل {name}" },
  D13: { title: "Registration Rejected", titleAr: "رفض طلب مشاركة", message: 'Your registration for "{Event}" was rejected.', messageAr: "تم رفض طلبكم للمشاركة بفعالية {event}" },
  D14: { title: "Registration Rejected (with reason)", titleAr: "رفض طلب تسجيل لفعالية", message: 'Your registration for "{Event}" was rejected. Reason: {Reason}', messageAr: "تم رفض طلبكم للمشاركة بفعالية {event} و ذلك بسبب {reason}" },
  D15: { title: "New Registration Approval Request", titleAr: "طلب مشاركة جديد", message: '{Name} has registered for "{Event}" and requires your approval.', messageAr: "تقدم الموظف {name} بطلب مشاركة بفعالية {event} و يتطلب اتخاذ الإجراء اللازم" },
  D16: { title: "New Facility Booking Request", titleAr: "طلب حجز مرافق رياضية", message: '{Name} has requested to book "{Facility}" on {startDate} at {startTime}.', messageAr: "تقدم الموظف {name} بطلب حجز {facility} بتاريخ {startdate} الساعة {startdate}" },
  D17: { title: "New Contact Message", titleAr: "اشعار رسالة جديدة", message: '{Name} ({email}) sent a message: {message}', messageAr: "تم استلام رسالة جديدة من {name} ({email}). نص الرسالة: {message}" },
  D18: { title: "New Activity Invitation", titleAr: "دعوة للمشاركة بنشاط فعالية", message: 'You have been invited to the activity "{Activity}" for event "{Event}".', messageAr: "يسرنا دعوتكم للمشاركة بنشاط {activity} ضمن فعالية {event}" },
  D19: { title: "New Escalated Approval Request", titleAr: "تحويل طلب موافقة جديد", message: 'The previous approver did not respond within 3 days. "{Employee}" request for "{Event}" has been escalated to you.', messageAr: "لم يقم الشخص المخول بالاعتماد السابق باتخاذ اجراء لمدة 3 أيام.و عليه تم تحويل طلب الموظف {employee} للمشاركة بفعالية {event} لكم لاتخاذ الإجراء اللازم" },
  D20: { title: "Request Escalated", titleAr: "تحويل طلب", message: 'Your registration request for "{Event}" was not actioned within 3 days at {Level} level and has been escalated to the next level.', messageAr: "لم يتم اتخاذ أي اجراء على طلب مشاركتك بفعالية {event} و تم تحويل الطلب للمسؤول التالي لاتخاذ الإجراء اللازم" },

  // ── E. PUSH NOTIFICATIONS ──
  E1: { title: "Event Assignment: {Event}", titleAr: "تعيين فعالية", message: "You have been assigned to participate in {Event}", messageAr: "لقد تم تعيينكم للمشاركة بفعالية {event}" },
  E2: { title: "Event Update: {Event}", titleAr: "تحديث فعالية", message: "Event {Event} has been updated", messageAr: "تم تحديث فعالية {event}" },
  E3: { title: "Event Reminder: {Event}", titleAr: "تذكير بموعد فعالية {event}", message: "Don't forget about {Event} happening soon", messageAr: "نود تذكيركم بفعالية {event} و التي ستبدأ قريباً" },
  E4: { title: "Event Completed: {Event}", titleAr: "انتهاء فعالية {event}", message: "Event {Event} has been completed successfully", messageAr: "تم الانتهاء بنجاح من فعالية {event}" },
  E5: { title: "Event Notification: {Event}", titleAr: "إشعار بخصوص فعالية {event}", message: "You have a notification about {Event}", messageAr: "لديك إشعار بخصوص فعالية {event}" },
  E6: { title: "Team Assignment: {Team}", titleAr: "تعيين ضمن فريق: {team}", message: "You have been assigned to team {Team}", messageAr: "يسرنا إعلامكم بأنه تم تعيينكم ضمن الفريق الرياضي: {team}" },
  E7: { title: "Team Captain: {Team}", titleAr: "رئيس الفريق", message: "You have been made captain of team {Team}", messageAr: "يسرنا إعلامكم بأنه تم اختياركم لمنصب رئيس الفريق الرياضي: {team}" },
  E8: { title: "Team Notification: {Team}", titleAr: "إشعار بخصوص الفريق الرياضي: {team}", message: "You have a notification about team {Team}", messageAr: "لقد تلقيت إشعاراً بخصوص الفريق الرياضي: {team}" },

  // ── F. TEST / DEV ONLY ──
  F1: { title: "Test Notification", titleAr: "اشعار تجريبي", message: "This is a test notification from the platform", messageAr: "تم إصدار هذا الإشعار التجريبي آلياً من منصة الأنشطة الرياضية" },
  F2: { title: "Test Notification", titleAr: "اشعار تجريبي", message: "This is a test notification from GDRFA backend", messageAr: "تم إصدار هذا الإشعار التجريبي آلياً من أنظمة الإدارة العامة للإقامة و شؤون الأجانب" },
  F3: { title: "Bulk Test Notification", titleAr: "إشعار تجريبي جماعي", message: "This is a bulk test notification from GDRFA backend", messageAr: "تم إصدار هذا الإشعار التجريبي جماعياً بصورة آلية من أنظمة الإدارة العامة للإقامة و شؤون الأجانب" },
  F4: { title: "Role-based Test Notification", titleAr: "اشعار تجريبي حسب الدور الوظيفي", message: "This is a role-based test notification from GDRFA backend", messageAr: "تم إصدار هذا الإشعار التجريبي من أنظمة الإدارة العامة للإقامة و شؤون الأجانب حسب الدور الوظيفي" },
  F5: { title: "Broadcast Test Notification", titleAr: "تعميم تجريبي", message: "This is a broadcast test notification from GDRFA backend", messageAr: "تم إصدار هذا التعميم آلياً بواسطة أنظمة الإدارة العامة للإقامة و شؤون الأجانب" },
  F6: { title: "Test Notification for You!", titleAr: "إشعار تجريبي", message: "This is a test notification sent to your account", messageAr: "لقد تلقيت إشعار تجريبي آلي" },

  // ── G. STANDALONE STATUS / FALLBACK VALUES ──
  G1: { en: "Approved", ar: "معتمد" },
  G2: { en: "Cancelled", ar: "ملغي" },
  G3: { en: "Rejected", ar: "مرفوض" },
  G4: { en: "Individual", ar: "فردي" },
  G5: { en: "Team Captain", ar: "رئيس الفريق" },
  G6: { en: "Approved & Advanced", ar: "تم الاعتماد و التحويل" },
  G7: { en: "TBD", ar: "يحدد لاحقاً" },
  G8: { en: "Not provided", ar: "غير متوفر" }
};

function fill(text, vars = {}) {
  if (typeof text !== 'string' || !text) return '';
  const lowerVars = {};
  Object.entries(vars).forEach(([k, v]) => { lowerVars[k.toLowerCase()] = v; });
  return text.replace(/\{([^}]+)\}/g, (m, token) => {
    const val = lowerVars[String(token).trim().toLowerCase()];
    return val !== undefined && val !== null ? String(val) : m;
  });
}

function pick(item, lang, kind, vars) {
  if (!item) return '';
  const arKey = kind + 'Ar';
  const enKey = kind;
  let text = lang === 'ar' ? (item[arKey] && String(item[arKey]).trim() ? item[arKey] : item[enKey]) : item[enKey];
  if (!text && item.ar) text = item.ar;
  if (!text && (kind === 'title') && item.en) text = item.en;
  return fill(text, vars);
}

function tr(id, lang = 'ar', vars = {}) {
  const item = ITEMS[id];
  if (!item) return '';
  if (item.en !== undefined || item.ar !== undefined) {
    let text = lang === 'ar' && String(item.ar || '').trim() ? item.ar : item.en;
    return fill(text, vars);
  }
  // D/E/F items: return message when the whole string is requested
  return pick(item, lang, 'message', vars);
}

function trTitle(id, lang = 'ar', vars = {}) {
  return pick(ITEMS[id], lang, 'title', vars);
}

function trMessage(id, lang = 'ar', vars = {}) {
  return pick(ITEMS[id], lang, 'message', vars);
}

function statusValue(id, lang = 'ar') {
  return tr(id, lang);
}

module.exports = { tr, trTitle, trMessage, statusValue };