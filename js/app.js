/**
 * ============================================================================
 * نظام إدارة التربية العسكرية والتربية الوطنية - جامعة اللوتس بالمنيا
 * تصميم وبرمجة: م. بولس سمير
 * الملف: منطق النظام والواجهة التفاعلية (app.js)
 * ============================================================================
 */

// إعدادات Firebase المعطاة
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCBVxpqtMCzKH2BTKr70gI9UUlbJuHzFEw",
  authDomain: "masrof2-9e67a.firebaseapp.com",
  databaseURL: "https://masrof2-9e67a-default-rtdb.firebaseio.com",
  projectId: "masrof2-9e67a",
  storageBucket: "masrof2-9e67a.firebasestorage.app",
  messagingSenderId: "958997909952",
  appId: "1:958997909952:web:975ba540314a6389abb825"
};

const DB_BASE_URL = `${FIREBASE_CONFIG.databaseURL}/militaryEdu`;

// كليات جامعة اللوتس المعتمدة
const LOTUS_COLLEGES = [
  'كلية التمريض',
  'كلية الحاسبات والذكاء الاصطناعي',
  'كلية العلوم الصحية التطبيقية',
  'كلية إدارة الأعمال',
  'كلية طب الفم والأسنان',
  'كلية العلاج الطبيعي',
  'كلية الهندسة',
  'كلية الصيدلة'
];

function cleanNationalId(nid) {
  if (nid === null || nid === undefined) return '';
  let str = String(nid).trim();
  const easternDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  for (let i = 0; i < 10; i++) {
    str = str.split(easternDigits[i]).join(String(i));
  }
  str = str.replace(/\.0+$/, '');
  str = str.replace(/\D/g, '');
  return str;
}

function cleanStudentCode(code) {
  if (code === null || code === undefined) return '';
  let str = String(code).trim();
  const easternDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  for (let i = 0; i < 10; i++) {
    str = str.split(easternDigits[i]).join(String(i));
  }
  str = str.replace(/\.0+$/, '');
  return str.replace(/\s+/g, '');
}

function cleanDateStr(d) {
  if (d === null || d === undefined || d === '') return '';
  if (typeof d === 'number') {
    try {
      const jsDate = new Date(Math.round((d - 25569) * 86400 * 1000));
      return jsDate.toISOString().split('T')[0];
    } catch(e) { return String(d); }
  }
  let str = String(d).trim();
  str = str.replace(/\s+\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM|am|pm)?/i, '').trim();
  return str;
}

function normalizeCollegeName(c) {
  if (!c) return '';
  const s = String(c).trim();
  if (s.includes('تمريض')) return 'كلية التمريض';
  if (s.includes('حاسبات') || s.includes('معلومات') || s.includes('ذكاء') || s.includes('برمجيات') || s.includes('سيبراني') || s.includes('شبكات')) {
    return 'كلية الحاسبات والذكاء الاصطناعي';
  }
  if (s.includes('صحية') || s.includes('صحيه') || s.includes('تكنولوجيا العلوم') || s.includes('علوم صحية')) return 'كلية العلوم الصحية التطبيقية';
  if (s.includes('إدارة') || s.includes('ادارة') || s.includes('أعمال') || s.includes('اعمال') || s.includes('اقتصاد') || s.includes('محاسبة') || s.includes('تسويق')) return 'كلية إدارة الأعمال';
  if (s.includes('أسنان') || s.includes('اسنان') || s.includes('طب فم')) return 'كلية طب الفم والأسنان';
  if (s.includes('علاج')) return 'كلية العلاج الطبيعي';
  if (s.includes('هندسة') || s.includes('هندسه')) return 'كلية الهندسة';
  if (s.includes('صيدلة') || s.includes('صيدله') || s.includes('فارما')) return 'كلية الصيدلة';
  return s;
}

function normalizeYearName(y) {
  if (!y) return 'السنة الاولى';
  const s = String(y).trim();
  if (s.includes('اول') || s.includes('أول') || s === '1' || s.includes('First')) return 'السنة الاولى';
  if (s.includes('ثان') || s === '2' || s.includes('Second')) return 'السنة الثانية';
  if (s.includes('ثالث') || s === '3' || s.includes('Third')) return 'السنة الثالثة';
  if (s.includes('رابع') || s === '4' || s.includes('Fourth')) return 'السنة الرابعة';
  if (s.includes('خامس') || s === '5' || s.includes('Fifth')) return 'السنة الخامسة';
  if (s.includes('سادس') || s === '6' || s.includes('Sixth')) return 'السنة السادسة';
  return s;
}

// السنوات والفرق الدراسية
const ACADEMIC_YEARS_LEVELS = [
  'السنة الاولى',
  'السنة الثانية',
  'السنة الثالثة',
  'السنة الرابعة',
  'السنة الخامسة',
  'السنة السادسة'
];

// أكواد محافظات الرقم القومي المصري
const EGYPT_GOVERNORATES = {
  '01': 'القاهرة', '02': 'الإسكندرية', '03': 'بورسعيد', '04': 'السويس',
  '11': 'دمياط', '12': 'الدقهلية', '13': 'الشرقية', '14': 'القليوبية',
  '15': 'كفر الشيخ', '16': 'الغربية', '17': 'المنوفية', '18': 'البحيرة',
  '19': 'الإسماعيلية', '21': 'الجيزة', '22': 'بني سويف', '23': 'الفيوم',
  '24': 'المنيا', '25': 'أسيوط', '26': 'سوهاج', '27': 'قنا',
  '28': 'أسوان', '29': 'الأقصر', '31': 'البحر الأحمر', '32': 'الوادي الجديد',
  '33': 'مطروح', '34': 'شمال سيناء', '35': 'جنوب سيناء', '88': 'وافد / خارج الجمهورية'
};

// حالة التطبيق العامة (Application State)
const AppState = {
  currentUser: null, // { role: 'admin'|'staff', name: '...' }
  isOnline: false,
  students: [],
  staffUsers: [],
  auditLogs: [],
  
  // تصفية وبحث الطلاب
  studentFilters: {
    search: '',
    college: '',
    specialization: '',
    course: '',
    year: '',
    gender: '',
    status: '',
    academicYear: ''
  },
  
  // ترقيم الصفحات
  pagination: {
    currentPage: 1,
    pageSize: 15,
    totalPages: 1
  },

  // متغيرات المعاينة لرفع الملفات
  pendingUpload: {
    type: null, // 'students' or 'results'
    fileName: '',
    rawRows: [],
    validRows: [],
    invalidRows: [],
    duplicateRows: []
  },

  // مثيلات الرسوم البيانية (Chart instances)
  charts: {
    resultDoughnut: null,
    genderDoughnut: null,
    collegeBar: null,
    levelStackedBar: null
  },

  // مؤقت الخمول (Inactivity Timer)
  inactivityTimer: null,
  inactivityLimitMinutes: 30
};
if (typeof window !== 'undefined') {
  window.AppState = AppState;
}

// ============================================================================
// محرك التحليل والتحقق من الرقم القومي المصري (Egyptian National ID Parser)
// ============================================================================
function parseEgyptianNationalId(idStr) {
  if (idStr === null || idStr === undefined || idStr === '') return { isValid: false, error: 'الرقم غير محدد' };
  const cleanId = cleanNationalId(idStr);
  if (!/^\d{14}$/.test(cleanId)) {
    return { isValid: false, error: 'يجب أن يتكون الرقم القومي من 14 رقماً' };
  }

  const centuryDigit = parseInt(cleanId[0], 10);
  if (centuryDigit !== 2 && centuryDigit !== 3) {
    return { isValid: false, error: 'رقم القرن غير صحيح' };
  }

  const century = centuryDigit === 2 ? 1900 : 2000;
  const year = century + parseInt(cleanId.slice(1, 3), 10);
  const month = parseInt(cleanId.slice(3, 5), 10);
  const day = parseInt(cleanId.slice(5, 7), 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { isValid: false, error: 'تاريخ الميلاد في الرقم القومي غير صحيح' };
  }

  const govCode = cleanId.slice(7, 9);
  const governorate = EGYPT_GOVERNORATES[govCode] || 'غير محدد';

  // الرقم قبل الأخير يحدد النوع (فردي = ذكر، زوجي = أنثى)
  const genderDigit = parseInt(cleanId[12], 10);
  const gender = genderDigit % 2 === 1 ? 'male' : 'female';
  const genderAr = gender === 'male' ? 'ذكر' : 'أنثى';

  const birthDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  // حساب السن التقريبي
  const currentYear = new Date().getFullYear();
  const approxAge = currentYear - year;

  return {
    isValid: true,
    birthDate: birthDateStr,
    governorate,
    gender,
    genderAr,
    approxAge
  };
}

// ============================================================================
// مزامنة البيانات (Firebase & LocalStorage Synchronization)
// ============================================================================
const CURRENT_DATA_VERSION = '2026_10_06_DATA_V5_EXACT_MATCH';

async function forceReloadCleanMasterData(showConfirm = true) {
  if (showConfirm) {
    const ok = confirm("هل تريد مسح البيانات المخزنة وتحديث قاعدة البيانات بالكامل من كشوفات الداتا المعتمدة ونتائج الدورات (4,991 طالباً وطالبة - مطابقة تامة للإكسيل)؟");
    if (!ok) return;
  }
  
  if (typeof INITIAL_SAMPLE_STUDENTS !== 'undefined') {
    AppState.students = [...INITIAL_SAMPLE_STUDENTS];
    localStorage.setItem('militaryEdu_data_version', CURRENT_DATA_VERSION);
    saveLocalState();
    await syncAllToFirebase();
    logAuditAction('تحديث الكشوفات المعتمدة', `تم مسح القديم وتحميل ${AppState.students.length} طالباً من كشوفات الداتا المعتمدة`);
    showToast(`تم مسح البيانات القديمة واعتماد بيانات الداتا الجديدة (${AppState.students.length} طالب وطالبة) بنجاح!`, 'success');
    refreshAllViews();
  }
}

async function initDataSync() {
  updateConnectionBadge(false, 'جاري الاتصال بقاعدة البيانات...');
  
  // 1. فحص إصدار البيانات ومسح أي كاش قديم لتحديث كشوفات الداتا تلقائياً
  const savedVersion = localStorage.getItem('militaryEdu_data_version');
  if (savedVersion !== CURRENT_DATA_VERSION) {
    console.log('Clearing old local data version and reloading master dataset...');
    localStorage.removeItem('militaryEdu_students');
    localStorage.setItem('militaryEdu_data_version', CURRENT_DATA_VERSION);
    if (typeof INITIAL_SAMPLE_STUDENTS !== 'undefined') {
      AppState.students = [...INITIAL_SAMPLE_STUDENTS];
      saveLocalState();
    }
  } else {
    loadLocalState();
  }

  // 2. محاولة جلب أحدث نسخة من Firebase
  try {
    const response = await fetch(`${DB_BASE_URL}.json`, { cache: 'no-cache' });
    if (response.ok) {
      const data = await response.json();
      if (data && data.students) {
        // تحويل كائن الطلاب إلى مصفوفة
        const studentList = Object.values(data.students);
        AppState.students = studentList;
        if (data.users) AppState.staffUsers = Object.values(data.users);
        if (data.auditLogs) AppState.auditLogs = Object.values(data.auditLogs);
        saveLocalState();
        updateConnectionBadge(true, 'متصل بالقاعدة السحابية Firebase');
      } else {
        // إذا كانت القاعدة فارغة تماماً، نقوم بتغذيتها بالبيانات النموذجية
        if (AppState.students.length === 0 && typeof INITIAL_SAMPLE_STUDENTS !== 'undefined') {
          AppState.students = [...INITIAL_SAMPLE_STUDENTS];
          saveLocalState();
          await syncAllToFirebase();
        }
        updateConnectionBadge(true, 'متصل بالقاعدة السحابية (جاهزة)');
      }
    } else {
      throw new Error('HTTP Status ' + response.status);
    }
  } catch (err) {
    console.warn('Firebase sync warning:', err);
    updateConnectionBadge(false, 'وضع محلي غير متصل (يعمل من الذاكرة المحلية)');
    if (AppState.students.length === 0 && typeof INITIAL_SAMPLE_STUDENTS !== 'undefined') {
      AppState.students = [...INITIAL_SAMPLE_STUDENTS];
      saveLocalState();
    }
  }

  // ملء المستخدمين الافتراضيين إذا كانت القائمة فارغة
  if (!AppState.staffUsers || AppState.staffUsers.length === 0) {
    AppState.staffUsers = [
      { id: 'staff_1', username: 'staff1', name: 'أ. مجدي عثمان - مسؤول شؤون الطلاب', role: 'staff', active: true, createdAt: '2024-10-01' },
      { id: 'staff_2', username: 'lotus_admin', name: 'م. إبراهيم شكري - مدخل بيانات', role: 'staff', active: true, createdAt: '2024-10-02' }
    ];
    saveLocalState();
  }

  refreshAllViews();
}

function updateConnectionBadge(isOnline, text) {
  AppState.isOnline = isOnline;
  const badge = document.getElementById('dbStatusBadge');
  const dot = document.getElementById('dbStatusDot');
  const label = document.getElementById('dbStatusText');
  if (!badge) return;

  if (dot) {
    if (isOnline) {
      dot.className = 'status-dot online';
      dot.title = text || 'متصل بالنظام والسحابة';
    } else {
      dot.className = 'status-dot local';
      dot.title = text || 'وضع محلي (Offline)';
    }
  }
  if (label) {
    label.textContent = text || (isOnline ? 'متصل بالسحابة Firebase' : 'وضع محلي (Offline)');
  }
}

function loadLocalState() {
  try {
    const rawStudents = localStorage.getItem('militaryEdu_students');
    if (rawStudents) AppState.students = JSON.parse(rawStudents);

    const rawUsers = localStorage.getItem('militaryEdu_users');
    if (rawUsers) AppState.staffUsers = JSON.parse(rawUsers);

    const rawLogs = localStorage.getItem('militaryEdu_auditLogs');
    if (rawLogs) AppState.auditLogs = JSON.parse(rawLogs);
  } catch (e) {
    console.error('Error loading local state:', e);
  }
}

function saveLocalState() {
  try {
    localStorage.setItem('militaryEdu_students', JSON.stringify(AppState.students));
    localStorage.setItem('militaryEdu_users', JSON.stringify(AppState.staffUsers));
    localStorage.setItem('militaryEdu_auditLogs', JSON.stringify(AppState.auditLogs));
  } catch (e) {
    console.error('Error saving local state:', e);
  }
}

async function syncAllToFirebase() {
  if (!AppState.isOnline) return;
  try {
    // تحويل مصفوفة الطلاب إلى قاموس بمعرف الكود أو الرقم القومي
    const studentMap = {};
    AppState.students.forEach(s => {
      const key = s.nationalId || s.code || `st_${Date.now()}`;
      studentMap[key] = s;
    });

    await fetch(`${DB_BASE_URL}/students.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentMap)
    });
  } catch (err) {
    console.warn('Sync to Firebase error:', err);
  }
}

async function pushStudentToFirebase(student) {
  saveLocalState();
  if (!AppState.isOnline) return;
  try {
    const key = student.nationalId || student.code;
    await fetch(`${DB_BASE_URL}/students/${key}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
  } catch (err) {
    console.warn('Push student error:', err);
  }
}

async function removeStudentFromFirebase(studentKey) {
  saveLocalState();
  if (!AppState.isOnline) return;
  try {
    await fetch(`${DB_BASE_URL}/students/${studentKey}.json`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('Delete student error:', err);
  }
}

function logAuditAction(action, details) {
  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleString('ar-EG'),
    user: AppState.currentUser ? AppState.currentUser.name : 'نظام',
    role: AppState.currentUser ? (AppState.currentUser.role === 'admin' ? 'مدير النظام' : 'موظف') : 'نظام',
    action,
    details
  };
  AppState.auditLogs.unshift(logEntry);
  if (AppState.auditLogs.length > 200) AppState.auditLogs.pop();
  saveLocalState();

  if (AppState.isOnline) {
    fetch(`${DB_BASE_URL}/auditLogs/${logEntry.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(e => console.warn(e));
  }
}

// ============================================================================
// إدارة الجلسة والدخول والمؤقت (Authentication & Session Management)
// ============================================================================
function initAuthSession() {
  AppState.currentUser = {
    role: 'admin',
    name: 'مدير النظام (أدمن)',
    id: 'admin_master'
  };
  sessionStorage.setItem('militaryEdu_session', JSON.stringify(AppState.currentUser));
  showMainInterface();
}

function showLoginView() {
  showMainInterface();
}

function showMainInterface() {
  const loginWrapper = document.getElementById('loginViewWrapper');
  if (loginWrapper) loginWrapper.style.display = 'none';
  const mainInt = document.getElementById('appMainInterface');
  if (mainInt) mainInt.style.display = 'flex';
  applyUserRoleUI();
  refreshAllViews();
}

function loginAsAdmin(notify = false) {
  AppState.currentUser = {
    role: 'admin',
    name: 'مدير النظام (أدمن)',
    id: 'admin_master'
  };
  sessionStorage.setItem('militaryEdu_session', JSON.stringify(AppState.currentUser));
  if (notify) showToast('مرحباً بك! النظام يعمل بصلاحية الأدمن الكاملة.', 'success');
  showMainInterface();
  return true;
}

function loginAsStaff(notify = false) {
  return loginAsAdmin(notify);
}

function toggleUserRole() {
  return loginAsAdmin(false);
}

function handleAdminLogin(password) {
  return loginAsAdmin(true);
}

function handleStaffLogin(username, password) {
  return loginAsAdmin(true);
}

function logoutUser() {
  showToast('النظام متاح بصلاحية الأدمن الكاملة بشكل مستمر.', 'info');
}

function resetInactivityTimer() {
  // تم إيقاف الخروج التلقائي حتى يظل النظام نشطاً دائماً بصلاحية الأدمن
}

// الاستماع للنشاط
['click', 'keypress', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, resetInactivityTimer, { passive: true });
});

function applyUserRoleUI() {
  AppState.currentUser = {
    role: 'admin',
    name: 'مدير النظام (أدمن)',
    id: 'admin_master'
  };

  const nameEl = document.getElementById('headerUserName');
  if (nameEl) nameEl.textContent = AppState.currentUser.name;
  const roleEl = document.getElementById('headerUserRole');
  if (roleEl) roleEl.textContent = 'كامل الصلاحيات';

  // إظهار جميع التبويبات والصلاحيات للأدمن
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = '';
  });
}

// ============================================================================
// التنقل بين التبويبات (Tab Navigation)
// ============================================================================
function switchTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));

  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');

  const sec = document.getElementById(tabId);
  if (sec) sec.classList.add('active');

  // تحديث محتوى التبويب عند تفعيله
  if (tabId === 'dashboardTab') {
    renderDashboardStats();
  } else if (tabId === 'studentsTab') {
    renderStudentsTable();
  } else if (tabId === 'reportsTab') {
    renderSelectedReport();
  } else if (tabId === 'adminTab') {
    renderStaffManagement();
    renderAuditLogs();
  }
}

// ============================================================================
// لوحة الإحصائيات والمؤشرات (Dashboard & Chart.js Visualizations)
// ============================================================================
function renderDashboardStats() {
  const students = AppState.students;
  const total = students.length;

  const males = students.filter(s => s.gender === 'male');
  const females = students.filter(s => s.gender === 'female');
  
  const passed = students.filter(s => s.status === 'pass');
  const failed = students.filter(s => s.status === 'fail');
  const notAttended = students.filter(s => s.status === 'not_attended');

  const malePassed = males.filter(s => s.status === 'pass').length;
  const maleFailed = males.filter(s => s.status === 'fail').length;
  const maleNotAttended = males.filter(s => s.status === 'not_attended').length;

  const femalePassed = females.filter(s => s.status === 'pass').length;
  const femaleFailed = females.filter(s => s.status === 'fail').length;
  const femaleNotAttended = females.filter(s => s.status === 'not_attended').length;

  const passRate = total > 0 ? ((passed.length / total) * 100).toFixed(1) : '0';
  const failRate = total > 0 ? ((failed.length / total) * 100).toFixed(1) : '0';
  const notAttendedRate = total > 0 ? ((notAttended.length / total) * 100).toFixed(1) : '0';
  const maleRate = total > 0 ? ((males.length / total) * 100).toFixed(1) : '0';
  const femaleRate = total > 0 ? ((females.length / total) * 100).toFixed(1) : '0';

  // تحديث بطاقات الأرقام
  if (document.getElementById('metricTotalStudents')) {
    document.getElementById('metricTotalStudents').textContent = total.toLocaleString('ar-EG');
  }
  if (document.getElementById('metricTotalPassed')) {
    document.getElementById('metricTotalPassed').textContent = passed.length.toLocaleString('ar-EG');
  }
  if (document.getElementById('metricPassRate')) {
    document.getElementById('metricPassRate').textContent = 'اجتازوا دورة التربية العسكرية';
  }

  if (document.getElementById('metricTotalFailed')) {
    document.getElementById('metricTotalFailed').textContent = failed.length.toLocaleString('ar-EG');
  }
  if (document.getElementById('metricFailRate')) {
    document.getElementById('metricFailRate').textContent = 'دخلوا ولم يجتازوا (باقون للإعادة)';
  }

  if (document.getElementById('metricTotalNotAttended')) {
    document.getElementById('metricTotalNotAttended').textContent = notAttended.length.toLocaleString('ar-EG');
  }
  if (document.getElementById('metricNotAttendedRate')) {
    document.getElementById('metricNotAttendedRate').textContent = 'المستهدفون الجدد للدورات القادمة';
  }

  if (document.getElementById('metricTotalMales')) {
    document.getElementById('metricTotalMales').textContent = males.length.toLocaleString('ar-EG');
  }
  if (document.getElementById('metricMaleRate')) {
    document.getElementById('metricMaleRate').textContent = 'الطلبة الذكور المقيدين بالجامعة';
  }

  if (document.getElementById('metricTotalFemales')) {
    document.getElementById('metricTotalFemales').textContent = females.length.toLocaleString('ar-EG');
  }
  if (document.getElementById('metricFemaleRate')) {
    document.getElementById('metricFemaleRate').textContent = 'الطالبات الإناث المقيدات بالجامعة';
  }

  // تحديث الجدول الإحصائي
  document.getElementById('crossMalePassed').textContent = malePassed.toLocaleString('ar-EG');
  document.getElementById('crossMaleFailed').textContent = maleFailed.toLocaleString('ar-EG');
  if (document.getElementById('crossMaleNotAttended')) {
    document.getElementById('crossMaleNotAttended').textContent = maleNotAttended.toLocaleString('ar-EG');
  }
  document.getElementById('crossMaleTotal').textContent = males.length.toLocaleString('ar-EG');

  document.getElementById('crossFemalePassed').textContent = femalePassed.toLocaleString('ar-EG');
  document.getElementById('crossFemaleFailed').textContent = femaleFailed.toLocaleString('ar-EG');
  if (document.getElementById('crossFemaleNotAttended')) {
    document.getElementById('crossFemaleNotAttended').textContent = femaleNotAttended.toLocaleString('ar-EG');
  }
  document.getElementById('crossFemaleTotal').textContent = females.length.toLocaleString('ar-EG');

  document.getElementById('crossTotalPassed').textContent = passed.length.toLocaleString('ar-EG');
  document.getElementById('crossTotalFailed').textContent = failed.length.toLocaleString('ar-EG');
  if (document.getElementById('crossTotalNotAttended')) {
    document.getElementById('crossTotalNotAttended').textContent = notAttended.length.toLocaleString('ar-EG');
  }
  document.getElementById('crossGrandTotal').textContent = total.toLocaleString('ar-EG');

  // تحديث نصوص خيارات التقارير بالأعداد الحية والدقيقة
  const optPassed = document.querySelector('#reportTypeSelector option[value="passedStudents"]');
  if (optPassed) optPassed.textContent = `📄 3. كشف الطلاب الحاصلين على الدورة (الناجحين - ${passed.length.toLocaleString('ar-EG')} طالب)`;
  const optFailed = document.querySelector('#reportTypeSelector option[value="failedStudents"]');
  if (optFailed) optFailed.textContent = `📄 4. كشف الطلاب غير الحاصلين (الذين دخلوا ولم يجتازوا - ${failed.length.toLocaleString('ar-EG')} طالب)`;
  const optNotAtt = document.querySelector('#reportTypeSelector option[value="notAttendedStudents"]');
  if (optNotAtt) optNotAtt.textContent = `📄 5. كشف الطلاب الذين لم يدخلوا دورات بعد (المستهدفون الجدد - ${notAttended.length.toLocaleString('ar-EG')} طالب)`;
  const optAll = document.querySelector('#reportTypeSelector option[value="allStudents"]');
  if (optAll) optAll.textContent = `📄 6. كشف جميع الطلاب المقيدين بالنظام (${total.toLocaleString('ar-EG')} طالب)`;

  // ملء جدول الموقف الإحصائي لكليات الجامعة
  renderDashboardCollegesTable();

  // رسم المخططات البيانية (Chart.js)
  renderCharts(passed.length, failed.length, notAttended.length, males.length, females.length);
}

function renderDashboardCollegesTable() {
  const tbody = document.getElementById('dashboardCollegeTableBody');
  if (!tbody) return;

  let totList = 0, totM = 0, totF = 0, totP = 0, totFl = 0, totNa = 0;

  const rowsHtml = LOTUS_COLLEGES.map((col, idx) => {
    const list = AppState.students.filter(s => s.college === col || normalizeCollegeName(s.college) === normalizeCollegeName(col));
    const m = list.filter(s => s.gender === 'male').length;
    const f = list.filter(s => s.gender === 'female').length;
    const p = list.filter(s => s.status === 'pass').length;
    const fl = list.filter(s => s.status === 'fail').length;
    const na = list.filter(s => s.status === 'not_attended').length;

    totList += list.length;
    totM += m;
    totF += f;
    totP += p;
    totFl += fl;
    totNa += na;

    return `
      <tr>
        <td><strong>${idx + 1}</strong></td>
        <td style="text-align: right; cursor: pointer;" onclick="openCardModal('college', '${escapeHtml(col)}')" title="انقر لعرض كشف وتفاصيل طلاب ${escapeHtml(col)}">
          <strong style="color: var(--primary); text-decoration: underline dotted;">${col}</strong>
        </td>
        <td style="cursor: pointer;" onclick="openCardModal('college', '${escapeHtml(col)}')" title="انقر لعرض إجمالي طلاب ${escapeHtml(col)} (${list.length.toLocaleString('ar-EG')})">
          <strong style="font-weight: 800;">${list.length.toLocaleString('ar-EG')}</strong>
        </td>
        <td class="cell-male" style="cursor: pointer;" onclick="openCardModal('college_male', '${escapeHtml(col)}')" title="انقر لعرض كشف الطلبة الذكور بـ ${escapeHtml(col)} (${m.toLocaleString('ar-EG')})">
          ${m.toLocaleString('ar-EG')}
        </td>
        <td class="cell-female" style="cursor: pointer;" onclick="openCardModal('college_female', '${escapeHtml(col)}')" title="انقر لعرض كشف الطالبات الإناث بـ ${escapeHtml(col)} (${f.toLocaleString('ar-EG')})">
          ${f.toLocaleString('ar-EG')}
        </td>
        <td class="cell-pass" style="cursor: pointer;" onclick="openCardModal('college_pass', '${escapeHtml(col)}')" title="انقر لعرض كشف الطلاب الحاصلين بـ ${escapeHtml(col)} (${p.toLocaleString('ar-EG')})">
          ${p.toLocaleString('ar-EG')}
        </td>
        <td class="cell-fail" style="cursor: pointer;" onclick="openCardModal('college_fail', '${escapeHtml(col)}')" title="انقر لعرض كشف الطلاب غير الحاصلين بـ ${escapeHtml(col)} (${fl.toLocaleString('ar-EG')})">
          ${fl.toLocaleString('ar-EG')}
        </td>
        <td class="cell-pending" style="cursor: pointer;" onclick="openCardModal('college_not_attended', '${escapeHtml(col)}')" title="انقر لعرض كشف من لم يدخلوا دورات بعد بـ ${escapeHtml(col)} (${na.toLocaleString('ar-EG')})">
          ${na.toLocaleString('ar-EG')}
        </td>
      </tr>
    `;
  }).join('');

  const footerHtml = `
    <tr class="row-total" style="border-top: 3px solid var(--primary); font-size: 0.95rem;">
      <td colspan="2" style="text-align: right; color: var(--primary); cursor: pointer;" onclick="openCardModal('all')" title="انقر لعرض كشف إجمالي طلاب الجامعة بالكامل">
        الإجمــــــــــــــــــــــــالي العــــــــام للجامعــــــــة
      </td>
      <td style="color: var(--primary); font-size: 1.05rem; cursor: pointer;" onclick="openCardModal('all')" title="انقر لعرض إجمالي طلاب الجامعة (${totList.toLocaleString('ar-EG')})">
        <strong>${totList.toLocaleString('ar-EG')}</strong>
      </td>
      <td class="cell-male" style="cursor: pointer;" onclick="openCardModal('male')" title="انقر لعرض إجمالي الطلبة الذكور بالجامعة (${totM.toLocaleString('ar-EG')})">
        ${totM.toLocaleString('ar-EG')}
      </td>
      <td class="cell-female" style="cursor: pointer;" onclick="openCardModal('female')" title="انقر لعرض إجمالي الطالبات الإناث بالجامعة (${totF.toLocaleString('ar-EG')})">
        ${totF.toLocaleString('ar-EG')}
      </td>
      <td class="cell-pass" style="cursor: pointer;" onclick="openCardModal('pass')" title="انقر لعرض إجمالي الحاصلين بالجامعة (${totP.toLocaleString('ar-EG')})">
        ${totP.toLocaleString('ar-EG')}
      </td>
      <td class="cell-fail" style="cursor: pointer;" onclick="openCardModal('fail')" title="انقر لعرض إجمالي غير الحاصلين بالجامعة (${totFl.toLocaleString('ar-EG')})">
        ${totFl.toLocaleString('ar-EG')}
      </td>
      <td class="cell-pending" style="cursor: pointer;" onclick="openCardModal('not_attended')" title="انقر لعرض إجمالي من لم يدخلوا دورات بعد (${totNa.toLocaleString('ar-EG')})">
        ${totNa.toLocaleString('ar-EG')}
      </td>
    </tr>
  `;

  tbody.innerHTML = rowsHtml + footerHtml;
}

function renderCharts(passedCount, failedCount, notAttendedCount, maleCount, femaleCount) {
  if (typeof Chart === 'undefined') return;

  // 1. دونات النتيجة (حاصل / غير حاصل / لم يدخل أي دورة بعد)
  const ctxResult = document.getElementById('chartResultDoughnut');
  if (ctxResult) {
    if (AppState.charts.resultDoughnut) AppState.charts.resultDoughnut.destroy();
    AppState.charts.resultDoughnut = new Chart(ctxResult, {
      type: 'doughnut',
      data: {
        labels: ['حاصل على الدورة (اجتاز)', 'غير حاصل (لم يجتز)', 'لم يدخل أي دورة بعد'],
        datasets: [{
          data: [passedCount, failedCount, notAttendedCount],
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Cairo' } } }
        }
      }
    });
  }

  // 2. دونات النوع (ذكور / إناث)
  const ctxGender = document.getElementById('chartGenderDoughnut');
  if (ctxGender) {
    if (AppState.charts.genderDoughnut) AppState.charts.genderDoughnut.destroy();
    AppState.charts.genderDoughnut = new Chart(ctxGender, {
      type: 'doughnut',
      data: {
        labels: ['طلبة ذكور', 'طالبات إناث'],
        datasets: [{
          data: [maleCount, femaleCount],
          backgroundColor: ['#2563eb', '#db2777'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Cairo' } } }
        }
      }
    });
  }

  // 3. شريطي الكليات (توزيع الطلاب حسب كليات اللوتس الـ 7 المرفقة)
  const ctxCollege = document.getElementById('chartCollegeBar');
  if (ctxCollege) {
    const collegeStats = {};
    LOTUS_COLLEGES.forEach(c => {
      collegeStats[c] = { passed: 0, failed: 0, notAttended: 0 };
    });

    AppState.students.forEach(s => {
      const colName = s.college || 'أخرى';
      if (!collegeStats[colName]) collegeStats[colName] = { passed: 0, failed: 0, notAttended: 0 };
      if (s.status === 'pass') collegeStats[colName].passed++;
      else if (s.status === 'fail') collegeStats[colName].failed++;
      else collegeStats[colName].notAttended++;
    });

    const colLabels = Object.keys(collegeStats).map(c => c.replace('كلية ', ''));
    const colPassed = Object.keys(collegeStats).map(c => collegeStats[c].passed);
    const colFailed = Object.keys(collegeStats).map(c => collegeStats[c].failed);
    const colNotAttended = Object.keys(collegeStats).map(c => collegeStats[c].notAttended);

    if (AppState.charts.collegeBar) AppState.charts.collegeBar.destroy();
    AppState.charts.collegeBar = new Chart(ctxCollege, {
      type: 'bar',
      data: {
        labels: colLabels,
        datasets: [
          { label: 'حاصل (اجتاز)', data: colPassed, backgroundColor: '#10b981' },
          { label: 'غير حاصل (لم يجتز)', data: colFailed, backgroundColor: '#ef4444' },
          { label: 'لم يدخل بعد', data: colNotAttended, backgroundColor: '#f59e0b' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, ticks: { font: { family: 'Cairo' } } },
          y: { stacked: true, beginAtZero: true }
        },
        plugins: {
          legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Cairo' } } }
        }
      }
    });
  }

  // 4. شريطي الفرق والسنوات الدراسية
  const ctxLevel = document.getElementById('chartLevelBar');
  if (ctxLevel) {
    const activeLevels = ['السنة الثانية', 'السنة الثالثة'];
    const levelStats = {};
    activeLevels.forEach(lvl => {
      levelStats[lvl] = { passed: 0, failed: 0, notAttended: 0 };
    });

    AppState.students.forEach(s => {
      const lvl = s.year || 'السنة الثانية';
      if (!levelStats[lvl]) levelStats[lvl] = { passed: 0, failed: 0, notAttended: 0 };
      if (s.status === 'pass') levelStats[lvl].passed++;
      else if (s.status === 'fail') levelStats[lvl].failed++;
      else levelStats[lvl].notAttended++;
    });

    const lvlLabels = activeLevels;
    const lvlPassed = lvlLabels.map(l => levelStats[l].passed);
    const lvlFailed = lvlLabels.map(l => levelStats[l].failed);
    const lvlNotAttended = lvlLabels.map(l => levelStats[l].notAttended);

    if (AppState.charts.levelStackedBar) AppState.charts.levelStackedBar.destroy();
    AppState.charts.levelStackedBar = new Chart(ctxLevel, {
      type: 'bar',
      data: {
        labels: lvlLabels,
        datasets: [
          { label: 'حاصل (اجتاز الدورة)', data: lvlPassed, backgroundColor: '#10b981' },
          { label: 'غير حاصل (لم يجتز)', data: lvlFailed, backgroundColor: '#ef4444' },
          { label: 'لم يدخل أي دورة بعد', data: lvlNotAttended, backgroundColor: '#f59e0b' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, ticks: { font: { family: 'Cairo' } } },
          y: { stacked: true, beginAtZero: true }
        },
        plugins: {
          legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Cairo' } } }
        }
      }
    });
  }
}

// ============================================================================
// إدارة الطلاب والبحث والتصفية والجدول (Students Directory & Table)
// ============================================================================
function populateSpecializationFilter() {
  const select = document.getElementById('filterSpecialization');
  if (!select) return;

  const currentVal = AppState.studentFilters.specialization || '';
  const currentCollege = AppState.studentFilters.college || '';

  const specs = new Set();
  AppState.students.forEach(s => {
    if (currentCollege && s.college !== currentCollege) return;
    if (s.specialization && s.specialization.trim()) {
      specs.add(s.specialization.trim());
    }
  });

  const sortedSpecs = Array.from(specs).sort((a, b) => a.localeCompare(b, 'ar'));

  select.innerHTML = '<option value="">جميع التخصصات والشعب</option>' + 
    sortedSpecs.map(sp => `<option value="${escapeHtml(sp)}" ${sp === currentVal ? 'selected' : ''}>${escapeHtml(sp)}</option>`).join('');
}

// ============================================================================
// نظام الثيم والوضع الداكن الاحترافي (Dark / Light Theme System)
// ============================================================================
function initTheme() {
  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('militaryEdu_theme') || 'dark';
  } catch (e) {
    savedTheme = 'dark';
  }
  applyTheme(savedTheme, false);

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.onclick = toggleTheme;
  }
}

function applyTheme(theme, notify = false) {
  const targetTheme = (theme === 'light') ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', targetTheme);
  if (document.body) {
    document.body.setAttribute('data-theme', targetTheme);
  }

  try {
    localStorage.setItem('militaryEdu_theme', targetTheme);
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  const iconEl = document.getElementById('themeToggleIcon');
  const textEl = document.getElementById('themeToggleText');

  if (iconEl) {
    iconEl.className = targetTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  if (textEl) {
    textEl.textContent = targetTheme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن';
  }

  updateChartsTheme(targetTheme);

  if (notify && typeof showToast === 'function') {
    showToast(targetTheme === 'dark' ? 'تم تفعيل الوضع الداكن الاحترافي' : 'تم تفعيل الوضع الفاتح بنجاح', 'info');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = (current === 'dark') ? 'light' : 'dark';
  applyTheme(newTheme, true);
}

function updateChartsTheme(theme) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#cbd5e1' : '#334155';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = textColor;
  }

  if (window.AppState && AppState.charts) {
    Object.values(AppState.charts).forEach(ch => {
      if (!ch) return;
      try {
        if (ch.options && ch.options.plugins && ch.options.plugins.legend && ch.options.plugins.legend.labels) {
          ch.options.plugins.legend.labels.color = textColor;
        }
        if (ch.options && ch.options.scales) {
          Object.values(ch.options.scales).forEach(sc => {
            if (sc && sc.ticks) sc.ticks.color = textColor;
            if (sc && sc.grid) sc.grid.color = gridColor;
          });
        }
        ch.update();
      } catch (e) {}
    });
  }
}

// إتاحة الدوال فوراً على النطاق العام window
window.initTheme = initTheme;
window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.updateChartsTheme = updateChartsTheme;

// تفعيل الثيم فور تحميل الملف البرمجي
try {
  initTheme();
} catch (e) {}

// دالة لتنظيف وتنسيق اسم الدورة والتقدير ومنع أي تكرار غير لائق للكلمات
function getCleanCourseAndGrade(s) {
  if (!s || s.status === 'not_attended') {
    return {
      course: '',
      grade: '',
      display: '-',
      plainText: '-'
    };
  }

  const course = (s.course || '').trim();
  let grade = (s.grade || '').trim();

  // تنظيف اسم الدورة وإزالة تكراره إذا كان مدمجاً داخل التقدير مثل: "اجتياز (تربية وطنية 1 اناث)"
  if (course && grade) {
    grade = grade.replace(`(${course})`, '').replace(course, '').trim();
    grade = grade.replace(/^\(+|\)+$/g, '').trim();
  }

  const isGenericGrade = !grade || grade === 'اجتياز' || grade === 'ناجح' || grade === 'راسب' || grade === 'pass' || grade === 'fail';

  if (course && !isGenericGrade) {
    return {
      course,
      grade,
      display: `${course} (${grade})`,
      plainText: `${course} (تقدير: ${grade})`
    };
  }

  if (course) {
    return {
      course,
      grade: '',
      display: course,
      plainText: course
    };
  }

  if (!isGenericGrade) {
    return {
      course: '',
      grade,
      display: grade,
      plainText: grade
    };
  }

  return {
    course: s.status === 'pass' ? 'دورة التربية العسكرية' : '',
    grade: '',
    display: s.status === 'pass' ? 'دورة التربية العسكرية' : '-',
    plainText: s.status === 'pass' ? 'دورة التربية العسكرية' : '-'
  };
}

function formatCourseDisplayName(courseVal) {
  if (!courseVal || courseVal === 'لم يسجل بدورة حتى الآن') return 'لم يسجل بدورة حتى الآن';
  if (/^\d+$/.test(courseVal.trim())) {
    return `دورة رقم ${courseVal.trim()}`;
  }
  return courseVal;
}

function populateCourseFilter() {
  const select = document.getElementById('filterCourse');
  const reportSelect = document.getElementById('reportCourseFilter');
  if (!select && !reportSelect) return;

  const currentVal = AppState.studentFilters.course || '';
  const currentCollege = AppState.studentFilters.college || '';

  const courses = new Map();
  AppState.students.forEach(s => {
    if (currentCollege && s.college !== currentCollege) return;
    const c = s.course ? s.course.trim() : 'لم يسجل بدورة حتى الآن';
    if (!courses.has(c)) {
      courses.set(c, {
        value: c,
        label: formatCourseDisplayName(c),
        count: 0
      });
    }
    courses.get(c).count++;
  });

  const sortedCourses = Array.from(courses.values()).sort((a, b) => {
    const isNumA = /^\d+$/.test(a.value);
    const isNumB = /^\d+$/.test(b.value);
    if (isNumA && isNumB) return parseInt(a.value, 10) - parseInt(b.value, 10);
    if (isNumA) return -1;
    if (isNumB) return 1;
    if (a.value === 'لم يسجل بدورة حتى الآن') return 1;
    if (b.value === 'لم يسجل بدورة حتى الآن') return -1;
    return a.label.localeCompare(b.label, 'ar');
  });

  const optionsHtml = '<option value="">جميع أرقام وأسماء الدورات</option>' + 
    sortedCourses.map(c => `<option value="${escapeHtml(c.value)}" ${c.value === currentVal ? 'selected' : ''}>${escapeHtml(c.label)} (${c.count} طالب)</option>`).join('');

  if (select) select.innerHTML = optionsHtml;
  if (reportSelect) {
    const curRepVal = reportSelect.value || '';
    reportSelect.innerHTML = '<option value="">جميع الدورات</option>' + 
      sortedCourses.map(c => `<option value="${escapeHtml(c.value)}" ${c.value === curRepVal ? 'selected' : ''}>${escapeHtml(c.label)}</option>`).join('');
  }
}

function getFilteredStudents() {
  const f = AppState.studentFilters;
  const q = f.search.trim().toLowerCase();

  return AppState.students.filter(s => {
    // بحث نصي (الاسم، الكود، الرقم القومي، الهاتف، التخصص، الدورة)
    if (q) {
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchCode = (s.code || '').toLowerCase().includes(q);
      const matchNid = (s.nationalId || '').toLowerCase().includes(q);
      const matchPhone = (s.phone || '').toLowerCase().includes(q);
      const matchSpec = (s.specialization || '').toLowerCase().includes(q);
      const matchCourse = (s.course || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchNid && !matchPhone && !matchSpec && !matchCourse) return false;
    }

    // تصفية الكلية
    if (f.college && s.college !== f.college && normalizeCollegeName(s.college) !== normalizeCollegeName(f.college)) return false;

    // تصفية التخصص
    if (f.specialization && s.specialization !== f.specialization) return false;

    // تصفية رقم / اسم الدورة
    if (f.course) {
      const sCourse = s.course ? s.course.trim() : 'لم يسجل بدورة حتى الآن';
      if (sCourse !== f.course) return false;
    }

    // تصفية السنة الدراسية
    if (f.year && s.year !== f.year) return false;

    // تصفية النوع
    if (f.gender && s.gender !== f.gender) return false;

    // تصفية الموقف (pass, fail, not_attended)
    if (f.status && s.status !== f.status) return false;

    // تصفية العام الدراسي
    if (f.academicYear && s.academicYear !== f.academicYear) return false;

    return true;
  });
}

function renderStudentsTable() {
  const filtered = getFilteredStudents();
  const totalCount = filtered.length;
  
  // حساب الصفحات
  const pageSize = AppState.pagination.pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  AppState.pagination.totalPages = totalPages;
  if (AppState.pagination.currentPage > totalPages) {
    AppState.pagination.currentPage = 1;
  }
  const currPage = AppState.pagination.currentPage;
  const startIndex = (currPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const pagedRows = filtered.slice(startIndex, endIndex);

  // تحديث العداد
  document.getElementById('studentsCountBadge').textContent = `${totalCount} طالب`;
  document.getElementById('tableShowingRange').textContent = 
    totalCount > 0 ? `عرض ${startIndex + 1} - ${endIndex} من إجمالي ${totalCount} طالب` : 'لا توجد بيانات مطابقة';

  // بناء أسطر الجدول
  const tbody = document.getElementById('studentsTableBody');
  if (pagedRows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align:center; padding: 40px; color: var(--text-muted);">
          <i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px; color: var(--gold); display:block;"></i>
          لا توجد بيانات مطابقة لمعايير البحث والتصفية الحالية
        </td>
      </tr>
    `;
    renderPaginationControls();
    return;
  }

  const isAdmin = AppState.currentUser && AppState.currentUser.role === 'admin';

  tbody.innerHTML = pagedRows.map((s, idx) => {
    const globalIdx = startIndex + idx + 1;
    const isMale = s.gender === 'male';
    const status = s.status || 'not_attended';

    let statusBadge = '';
    let courseDetail = '';
    const courseInfo = getCleanCourseAndGrade(s);

    if (status === 'pass') {
      statusBadge = `
        <span class="badge-status pass">
          <i class="fas fa-check-circle"></i>
          حاصل (اجتاز)
        </span>
      `;
      if (courseInfo.grade) {
        courseDetail = `
          <div style="display:inline-flex; flex-direction:column; gap:2px;">
            <span style="font-size: 0.86rem; font-weight: 700; color: var(--text-main);">${escapeHtml(courseInfo.course)}</span>
            <span style="font-size: 0.76rem; color: var(--gold-dark); font-weight: 600;">تقدير: ${escapeHtml(courseInfo.grade)}</span>
          </div>
        `;
      } else {
        courseDetail = `<span style="font-size: 0.86rem; font-weight: 700; color: var(--text-main);">${escapeHtml(courseInfo.display)}</span>`;
      }
    } else if (status === 'fail') {
      statusBadge = `
        <span class="badge-status fail">
          <i class="fas fa-times-circle"></i>
          غير حاصل (لم يجتز)
        </span>
      `;
      courseDetail = courseInfo.course
        ? `<div style="display:inline-flex; flex-direction:column; gap:2px;">
             <span style="font-size: 0.86rem; font-weight: 700; color: var(--danger-text);">${escapeHtml(courseInfo.course)}</span>
             <span style="font-size: 0.74rem; color: var(--danger); font-weight: 600;">باقٍ للإعادة</span>
           </div>`
        : `<span style="font-size: 0.82rem; color: var(--danger); font-weight: 600;">لم يجتز (باقٍ للإعادة)</span>`;
    } else {
      statusBadge = `
        <span class="badge-status not-attended">
          <i class="fas fa-clock"></i>
          لم يدخل أي دورة بعد
        </span>
      `;
      courseDetail = `<span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">-</span>`;
    }

    return `
      <tr>
        <td><strong>${globalIdx}</strong></td>
        <td><span class="code-pill">${escapeHtml(s.code || '-')}</span></td>
        <td>
          <span style="font-family: monospace; font-size: 0.95rem; font-weight: 600;">${escapeHtml(s.nationalId || '-')}</span>
        </td>
        <td><strong>${escapeHtml(s.name || '-')}</strong></td>
        <td>
          <span class="badge-gender ${isMale ? 'male' : 'female'}">
            <i class="fas ${isMale ? 'fa-mars' : 'fa-venus'}"></i>
            ${isMale ? 'ذكر' : 'أنثى'}
          </span>
        </td>
        <td>${escapeHtml(s.college || '-')}</td>
        <td>
          <span class="specialization-tag">
            ${escapeHtml(s.specialization || s.college || '-')}
          </span>
        </td>
        <td>${escapeHtml(s.year || '-')}</td>
        <td>${statusBadge}</td>
        <td>${courseDetail}</td>
        <td style="white-space: nowrap; text-align: center;">
          <div style="display:flex; justify-content: center; gap: 4px;">
            <button class="btn btn-outline btn-sm" onclick="openStudentDossier('${escapeHtml(s.nationalId || s.code)}')" title="عرض بطاقة الطالب">
              <i class="fas fa-id-card" style="color: var(--primary);"></i>
            </button>
            ${isAdmin ? `
              <button class="btn btn-outline btn-sm" onclick="openEditStudentModal('${escapeHtml(s.nationalId || s.code)}')" title="تعديل البيانات">
                <i class="fas fa-edit" style="color: var(--gold-dark);"></i>
              </button>
              <button class="btn btn-outline btn-sm" onclick="confirmDeleteStudent('${escapeHtml(s.nationalId || s.code)}')" title="حذف الطالب">
                <i class="fas fa-trash-alt" style="color: var(--danger);"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderPaginationControls();
}

function renderPaginationControls() {
  const container = document.getElementById('paginationButtons');
  const total = AppState.pagination.totalPages;
  const current = AppState.pagination.currentPage;

  let html = `
    <button class="page-btn" onclick="changePage(1)" ${current === 1 ? 'disabled' : ''} title="الصفحة الأولى">
      <i class="fas fa-angle-double-right"></i>
    </button>
    <button class="page-btn" onclick="changePage(${current - 1})" ${current === 1 ? 'disabled' : ''} title="السابق">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  // توليد أرقام الصفحات
  const startP = Math.max(1, current - 2);
  const endP = Math.min(total, current + 2);

  for (let p = startP; p <= endP; p++) {
    html += `
      <button class="page-btn ${p === current ? 'active' : ''}" onclick="changePage(${p})">
        ${p}
      </button>
    `;
  }

  html += `
    <button class="page-btn" onclick="changePage(${current + 1})" ${current === total ? 'disabled' : ''} title="التالي">
      <i class="fas fa-chevron-left"></i>
    </button>
    <button class="page-btn" onclick="changePage(${total})" ${current === total ? 'disabled' : ''} title="الصفحة الأخيرة">
      <i class="fas fa-angle-double-left"></i>
    </button>
  `;

  container.innerHTML = html;
}

function changePage(pageNum) {
  if (pageNum < 1 || pageNum > AppState.pagination.totalPages) return;
  AppState.pagination.currentPage = pageNum;
  renderStudentsTable();
}

// ============================================================================
// بطاقة الطالب وشهادة إتمام التربية العسكرية (Student Dossier & Certificate)
// ============================================================================
function openStudentDossier(identifier) {
  const student = AppState.students.find(s => s.nationalId === identifier || s.code === identifier);
  if (!student) {
    showToast('لم يتم العثور على بيانات الطالب المحدد', 'error');
    return;
  }

  const nidInfo = parseEgyptianNationalId(student.nationalId || '');
  const isPass = student.status === 'pass';
  const isMale = student.gender === 'male';
  const courseInfo = getCleanCourseAndGrade(student);

  const modal = document.getElementById('studentDossierModal');
  const content = document.getElementById('studentDossierContent');

  content.innerHTML = `
    <div class="student-dossier-grid">
      <div class="student-photo-badge">
        <div class="photo-placeholder">
          <i class="fas fa-user-graduate"></i>
          <span style="font-size:0.75rem; font-weight:700;">جامعة اللوتس</span>
        </div>
        <div style="margin-top: 10px;">
          ${student.status === 'pass' ? `
            <span class="badge-status pass" style="font-size: 0.88rem; padding: 6px 14px;">
              <i class="fas fa-check-circle"></i>
              حاصل (اجتاز الدورة)
            </span>
          ` : student.status === 'fail' ? `
            <span class="badge-status fail" style="font-size: 0.88rem; padding: 6px 14px;">
              <i class="fas fa-times-circle"></i>
              غير حاصل (لم يجتز)
            </span>
          ` : `
            <span class="badge-status not-attended" style="font-size: 0.88rem; padding: 6px 14px;">
              <i class="fas fa-clock"></i>
              لم يدخل أي دورة بعد
            </span>
          `}
        </div>
      </div>
      <div>
        <table class="dossier-info-table">
          <tr>
            <td class="label-col">اسم الطالب:</td>
            <td><strong style="font-size: 1.05rem; color: var(--primary);">${escapeHtml(student.name)}</strong></td>
          </tr>
          <tr>
            <td class="label-col">الرقم القومي (14 رقم):</td>
            <td><span style="font-family: monospace; font-size: 1rem; font-weight:700;">${escapeHtml(student.nationalId || '-')}</span></td>
          </tr>
          <tr>
            <td class="label-col">كود الطالب الجامعي:</td>
            <td><span class="code-pill">${escapeHtml(student.code || '-')}</span></td>
          </tr>
          <tr>
            <td class="label-col">النوع:</td>
            <td>${isMale ? 'ذكر' : 'أنثى'}</td>
          </tr>
          <tr>
            <td class="label-col">الكلية:</td>
            <td>${escapeHtml(student.college || '-')}</td>
          </tr>
          <tr>
            <td class="label-col">التخصص / الشعبة:</td>
            <td><strong style="color: var(--gold-light);">${escapeHtml(student.specialization || student.college || '-')}</strong></td>
          </tr>
          <tr>
            <td class="label-col">الفرقة / السنة الدراسية:</td>
            <td>${escapeHtml(student.year || '-')}</td>
          </tr>
          <tr>
            <td class="label-col">العام الدراسي:</td>
            <td>${escapeHtml(student.academicYear || '-')}</td>
          </tr>
          <tr>
            <td class="label-col">موقف التربية العسكرية:</td>
            <td><strong>${student.status === 'pass' ? 'حاصل على دورة التربية العسكرية (اجتياز)' : student.status === 'fail' ? 'غير حاصل (لم يجتز - باقٍ للإعادة)' : 'مستهدف للدورات القادمة (لم يدخل أي دورة بعد)'}</strong></td>
          </tr>
          <tr>
            <td class="label-col">الدورة المقيد بها / المنجزة:</td>
            <td><strong>${escapeHtml(courseInfo.course || '-')}</strong></td>
          </tr>
          <tr>
            <td class="label-col">التقدير:</td>
            <td>${escapeHtml(courseInfo.grade || (isPass ? 'اجتياز' : '-'))}</td>
          </tr>
          <tr>
            <td class="label-col">تاريخ الميلاد ومحافظة القيد:</td>
            <td>${nidInfo.isValid ? `${nidInfo.birthDate} - محافظة ${nidInfo.governorate} (السن التقريبي: ${nidInfo.approxAge} سنة)` : 'غير متوفر'}</td>
          </tr>
          <tr>
            <td class="label-col">رقم الهاتف:</td>
            <td>${escapeHtml(student.phone || 'غير مسجل')}</td>
          </tr>
        </table>
      </div>
    </div>
  `;

  // زر طباعة شهادة التربية العسكرية الفردية
  const certBtn = document.getElementById('btnPrintStudentCert');
  if (certBtn) {
    certBtn.onclick = () => printIndividualCertificate(student);
  }

  // زر تعديل بيانات الطالب مباشرة من البطاقة
  const editBtn = document.getElementById('btnEditStudentFromDossier');
  if (editBtn) {
    editBtn.onclick = () => {
      closeModal('studentDossierModal');
      openEditStudentModal(student.nationalId || student.code);
    };
  }

  modal.classList.add('active');
}

function printIndividualCertificate(student) {
  const isPass = student.status === 'pass';
  const printContainer = document.getElementById('printReportContainer');

  printContainer.innerHTML = `
    <div style="border: 4px double #000000; padding: 25px; margin: 20px auto; max-width: 780px; position: relative;">
      <!-- الترويسة الرسمية النظيفة A4 -->
      <div class="clean-print-header" style="margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 12px;">
        <div class="clean-print-univ" style="font-size: 20pt; font-weight: 900; margin-bottom: 6px;">جامعة اللوتس بالمنيا</div>
        <div class="clean-print-title" style="font-size: 15pt; font-weight: 900; text-decoration: underline;">
          ${isPass ? 'شهــــادة إتمـــام دورة التربيـــة العسكريـــة' : 'بيـــــان حالـــــة تربيـــة عسكريـــة'}
        </div>
        <div style="font-size: 10pt; font-weight: 600; margin-top: 4px;">العام الدراسي: ${escapeHtml(student.academicYear || '2024/2025')}</div>
      </div>

      <!-- نص الإفادة -->
      <div style="font-size: 13pt; line-height: 2.1; margin: 30px 10px; text-align: justify;">
        تشهد إدارة التربية العسكرية بجامعة اللوتس بالمنيا بأن الطالب / الطالبة:
        <br>
        <strong>الاســـــــــم:</strong> <span style="font-size: 15pt; font-weight:900;">${escapeHtml(student.name)}</span>
        <br>
        <strong>الرقــم القومــي:</strong> <span style="font-family: monospace; font-size: 13pt; font-weight:800;">${escapeHtml(student.nationalId || '-')}</span>
        &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
        <strong>كود الطالب:</strong> <span style="font-family: monospace; font-weight:800;">${escapeHtml(student.code || '-')}</span>
        <br>
        <strong>الكليـــــــــة:</strong> ${escapeHtml(student.college || '-')}
        &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
        <strong>التخصص / الشعبة:</strong> ${escapeHtml(student.specialization || student.college || '-')}
        &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
        <strong>الفرقة الدراسية:</strong> ${escapeHtml(student.year || '-')}
        <br>
        ${student.status === 'pass' 
          ? `قد <strong>اجتـاز بنجـاح</strong> دورة التربية العسكرية المقررة قانوناً وحصل على تقدير: <strong>(${escapeHtml(student.grade || 'امتياز')})</strong>، وقد أُعطيت له هذه الشهادة بناءً على طلبه لتقديمها إلى شؤون الطلاب.`
          : student.status === 'fail'
          ? `قد التحق بالدورة <strong>ولم يجتـز (راسب / غياب)</strong> حتى تاريخه، ويعتبر باقياً لإعادة أداء الدورة المقررة في المواعيد اللاحقة.`
          : `<strong>لم يؤدِ حتى تاريخه أي دورة</strong> من دورات التربية العسكرية، ويعتبر مستهدفاً ومقيداً لأداء الدورة القادمة المقررة وفقاً لنظام التربية العسكرية بالجامعة.`
        }
      </div>

      <!-- التذييل الرسمي -->
      <div style="border-top: 1.5px solid #000; margin-top: 40px; padding-top: 10px; display:flex; justify-content:space-between; font-size: 9.5pt;">
        <div>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</div>
        <div style="font-weight:800;">جامعة اللوتس بالمنيا | نظام إدارة التربية العسكرية والتربية الوطنية | تصميم مهندس بولس سمير</div>
      </div>
    </div>
  `;

  preparePrintOrientation(false);
  window.print();
}

// ============================================================================
// محرك التقارير والإحصائيات الرسمية والفلاتر المتعددة (Multi-Filter Reports Engine)
// ============================================================================

// استخراج قائمة الطلاب المصفاة وفقاً لكافة الفلاتر المحددة بمركز التقارير
function getFilteredStudentsForReports() {
  let list = AppState.students || [];

  const college = document.getElementById('reportCollegeFilter')?.value || '';
  const year = document.getElementById('reportYearFilter')?.value || '';
  const gender = document.getElementById('reportGenderFilter')?.value || '';
  const course = document.getElementById('reportCourseFilter')?.value || '';
  const status = document.getElementById('reportStatusFilter')?.value || '';

  if (college) {
    list = list.filter(s => s.college === college || normalizeCollegeName(s.college) === normalizeCollegeName(college));
  }
  if (year) {
    list = list.filter(s => s.year === year || normalizeYearName(s.year) === normalizeYearName(year));
  }
  if (gender) {
    list = list.filter(s => s.gender === gender);
  }
  if (course) {
    list = list.filter(s => (s.course ? s.course.trim() : 'لم يسجل بدورة حتى الآن') === course);
  }
  if (status) {
    list = list.filter(s => s.status === status);
  }

  return list;
}

// بناء وصف نصي ذكي للفلاتر النشطة لعرضه وطباعته
function getActiveFiltersDescription() {
  const parts = [];
  const college = document.getElementById('reportCollegeFilter')?.value;
  const year = document.getElementById('reportYearFilter')?.value;
  const gender = document.getElementById('reportGenderFilter')?.value;
  const course = document.getElementById('reportCourseFilter')?.value;
  const status = document.getElementById('reportStatusFilter')?.value;

  if (college) parts.push(`الكلية: ${college}`);
  if (year) parts.push(`الفرقة: ${year}`);
  if (gender) parts.push(`النوع: ${gender === 'male' ? 'ذكور فقط' : 'إناث فقط'}`);
  if (status) parts.push(`الموقف: ${status === 'pass' ? 'حاصل' : status === 'fail' ? 'غير حاصل' : 'لم يدخل بعد'}`);
  if (course) parts.push(`الدورة: ${formatCourseDisplayName(course)}`);

  return parts.length > 0 ? parts.join(' | ') : '';
}

// تحديث شريط الإشعار الحي لمعلومات التصفية
function updateReportFilterNotice(filteredCount) {
  const noticeWrap = document.getElementById('reportFilterStatusNotice');
  const noticeEl = document.getElementById('reportFilterNoticeText');
  if (!noticeWrap || !noticeEl) return;
  const filterDesc = getActiveFiltersDescription();

  if (filterDesc) {
    noticeWrap.style.display = 'flex';
    noticeEl.innerHTML = `<strong>البيانات المعروضة وفق التصفية المطبقة:</strong> <span style="color:var(--gold); font-weight:800;">${filteredCount.toLocaleString('ar-EG')} طالب</span> (${escapeHtml(filterDesc)})`;
  } else {
    noticeWrap.style.display = 'none';
    noticeEl.innerHTML = '';
  }
}

// إعادة ضبط كافة فلاتر التقارير
function resetReportFilters() {
  const collegeEl = document.getElementById('reportCollegeFilter');
  const yearEl = document.getElementById('reportYearFilter');
  const genderEl = document.getElementById('reportGenderFilter');
  const statusEl = document.getElementById('reportStatusFilter');
  const courseEl = document.getElementById('reportCourseFilter');

  if (collegeEl) collegeEl.value = '';
  if (yearEl) yearEl.value = '';
  if (genderEl) genderEl.value = '';
  if (statusEl) statusEl.value = '';
  if (courseEl) courseEl.value = '';

  renderSelectedReport();
  showToast('تمت إعادة ضبط فلاتر وخيارات التقارير بنجاح', 'info');
}

function renderSelectedReport() {
  const reportType = document.getElementById('reportTypeSelector')?.value || 'officialLetter';
  const container = document.getElementById('reportPreviewArea');
  if (!container) return;

  if (reportType === 'officialLetter') {
    // 1. تقرير الإحصائية الرسمية المعتمدة (حاصل / غير حاصل / إجمالي)
    renderOfficialStatisticalReport(container);
  } else if (reportType === 'detailedStatisticsLetter') {
    // 2. تقرير الإحصائية التفصيلية الشاملة (حاصل / راسب / لم يسجل بعد)
    renderDetailedStatisticalReport(container);
  } else if (reportType === 'passedStudents') {
    // 3. كشف الناجحين الحاصلين على الدورة
    renderPassedStudentsReport(container);
  } else if (reportType === 'failedStudents') {
    // 4. كشف الراسبين والباقين للإعادة
    renderFailedStudentsReport(container);
  } else if (reportType === 'notAttendedStudents') {
    // 5. كشف الطلاب الذين لم يدخلوا أي دورة بعد (المستهدفون الجدد)
    renderNotAttendedStudentsReport(container);
  } else if (reportType === 'allStudents') {
    // 6. كشف جميع الطلاب المقيدين
    renderAllStudentsReport(container);
  } else if (reportType === 'collegeSummary') {
    // 7. ملخص الكليات وتخصصاتها
    renderCollegesSummaryReport(container);
  }
}

/**
 * 1. التطبيق الحرفي والمطابق 100% للمستند الثاني:
 * «احصائية باعداد الطلاب - تربية عسكرية من ضمن الخطابات.docx»
 * مع التوازن الحسابي الدقيق: حاصل + غير حاصل = إجمالي
 * وربط كامل مع منظومة الفلاتر المتعددة
 */
function renderOfficialStatisticalReport(container) {
  const filteredStudents = getFilteredStudentsForReports();
  updateReportFilterNotice(filteredStudents.length);
  const filterDesc = getActiveFiltersDescription();
  const selectedYear = document.getElementById('reportYearFilter')?.value || '';
  const yearsToProcess = selectedYear ? [selectedYear] : ACADEMIC_YEARS_LEVELS;

  // حساب الأعداد لكل سنة دراسية
  const rowsData = yearsToProcess.map(lvl => {
    const list = filteredStudents.filter(s => s.year === lvl || normalizeYearName(s.year) === normalizeYearName(lvl));
    const males = list.filter(s => s.gender === 'male');
    const females = list.filter(s => s.gender === 'female');

    const malePass = males.filter(s => s.status === 'pass').length;
    const maleFailOnly = males.filter(s => s.status === 'fail').length;
    const maleNotAtt = males.filter(s => s.status === 'not_attended').length;
    const maleNotPass = males.length - malePass; // إجمالي غير الحاصلين
    const maleTotal = males.length;

    const femalePass = females.filter(s => s.status === 'pass').length;
    const femaleFailOnly = females.filter(s => s.status === 'fail').length;
    const femaleNotAtt = females.filter(s => s.status === 'not_attended').length;
    const femaleNotPass = females.length - femalePass; // إجمالي غير الحاصلات
    const femaleTotal = females.length;

    const grandTotal = maleTotal + femaleTotal;

    return {
      level: lvl,
      malePass,
      maleFailOnly,
      maleNotAtt,
      maleNotPass,
      maleTotal,
      femalePass,
      femaleFailOnly,
      femaleNotAtt,
      femaleNotPass,
      femaleTotal,
      grandTotal
    };
  });

  // حساب المجاميع الكلية
  const totals = rowsData.reduce((acc, r) => ({
    malePass: acc.malePass + r.malePass,
    maleFailOnly: acc.maleFailOnly + r.maleFailOnly,
    maleNotAtt: acc.maleNotAtt + r.maleNotAtt,
    maleNotPass: acc.maleNotPass + r.maleNotPass,
    maleTotal: acc.maleTotal + r.maleTotal,
    femalePass: acc.femalePass + r.femalePass,
    femaleFailOnly: acc.femaleFailOnly + r.femaleFailOnly,
    femaleNotAtt: acc.femaleNotAtt + r.femaleNotAtt,
    femaleNotPass: acc.femaleNotPass + r.femaleNotPass,
    femaleTotal: acc.femaleTotal + r.femaleTotal,
    grandTotal: acc.grandTotal + r.grandTotal
  }), {
    malePass: 0, maleFailOnly: 0, maleNotAtt: 0, maleNotPass: 0, maleTotal: 0,
    femalePass: 0, femaleFailOnly: 0, femaleNotAtt: 0, femaleNotPass: 0, femaleTotal: 0,
    grandTotal: 0
  });

  const tableHtml = `
    <div class="report-sheet-card">
      <!-- ترويسة التقرير الرسمي المعروضة على الشاشة -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="font-size: 1.55rem; font-weight: 900; color: var(--primary); margin-bottom: 6px;">جامعة اللوتس بالمنيا</h2>
        <div style="display:inline-block; padding: 4px 14px; background: var(--bg-alt); border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700; color: var(--primary); margin-bottom: 8px; border: 1px solid var(--border-color);">
          النموذج الإحصائي المعتمد - إدارة التربية العسكرية
        </div>
        <h3 style="font-size: 1.35rem; font-weight: 900; color: var(--text-main); margin-bottom: 4px;">
          الاحصائية العددية للطلاب الذكور و الإناث مقسمة على السنوات الدراسية
        </h3>
        ${filterDesc ? `<p style="color: var(--gold); font-size: 0.85rem; font-weight: 600; margin-top: 4px;">(نطاق التصفية المطبق: ${escapeHtml(filterDesc)})</p>` : ''}
      </div>

      <!-- الجدول الرسمي المطابق تماماً للخطاب المطلوب -->
      <div class="table-responsive">
        <table class="custom-table official-print-table" style="text-align: center;">
          <thead>
            <tr>
              <th rowspan="2" style="vertical-align: middle; width: 45px;">م</th>
              <th rowspan="2" style="vertical-align: middle;">اسم الجامعة</th>
              <th rowspan="2" style="vertical-align: middle;">السنة الدراسية</th>
              <th colspan="3" style="text-align: center; background: rgba(56, 189, 248, 0.15); color: var(--primary); font-weight:800;">عدد الطلبة الذكور</th>
              <th colspan="3" style="text-align: center; background: rgba(244, 114, 182, 0.15); color: var(--gender-female); font-weight:800;">موقف الطالبات الإناث</th>
              <th rowspan="2" style="vertical-align: middle; background: rgba(245, 158, 11, 0.18); color: var(--gold); font-weight:900;">الإجمـــــــــــــــــــــــالي</th>
            </tr>
            <tr>
              <th style="background: rgba(16, 185, 129, 0.12); color: var(--success); font-weight:800;">حاصل</th>
              <th style="background: rgba(239, 68, 68, 0.12); color: var(--danger); font-weight:800;">غير حاصل</th>
              <th style="background: var(--bg-alt); font-weight: 900;">إجمالي</th>
              
              <th style="background: rgba(16, 185, 129, 0.12); color: var(--success); font-weight:800;">حاصل</th>
              <th style="background: rgba(239, 68, 68, 0.12); color: var(--danger); font-weight:800;">غير حاصل</th>
              <th style="background: var(--bg-alt); font-weight: 900;">إجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${rowsData.map((row, idx) => `
              <tr>
                <td><strong>${idx + 1}</strong></td>
                <td>${idx === 0 ? '<strong style="color:var(--primary);">جامعة اللوتس</strong>' : ''}</td>
                <td><strong>${escapeHtml(row.level)}</strong></td>
                <td>${row.grandTotal > 0 ? `<strong style="color: var(--success);">${row.malePass.toLocaleString('ar-EG')}</strong>` : '-'}</td>
                <td>${row.grandTotal > 0 ? `
                  <strong style="color: var(--danger);">${row.maleNotPass.toLocaleString('ar-EG')}</strong>
                  <span class="sub-detail">(راسب: ${row.maleFailOnly.toLocaleString('ar-EG')} / لم يؤدِ: ${row.maleNotAtt.toLocaleString('ar-EG')})</span>
                ` : '-'}</td>
                <td style="font-weight: 800;">${row.grandTotal > 0 ? row.maleTotal.toLocaleString('ar-EG') : '-'}</td>
                
                <td>${row.grandTotal > 0 ? `<strong style="color: var(--success);">${row.femalePass.toLocaleString('ar-EG')}</strong>` : '-'}</td>
                <td>${row.grandTotal > 0 ? `
                  <strong style="color: var(--danger);">${row.femaleNotPass.toLocaleString('ar-EG')}</strong>
                  <span class="sub-detail">(راسب: ${row.femaleFailOnly.toLocaleString('ar-EG')} / لم يؤدِ: ${row.femaleNotAtt.toLocaleString('ar-EG')})</span>
                ` : '-'}</td>
                <td style="font-weight: 800;">${row.grandTotal > 0 ? row.femaleTotal.toLocaleString('ar-EG') : '-'}</td>
                
                <td style="background: rgba(245, 158, 11, 0.15); font-weight: 900; font-size: 1rem; color: var(--gold);">${row.grandTotal > 0 ? row.grandTotal.toLocaleString('ar-EG') : '-'}</td>
              </tr>
            `).join('')}
            
            <!-- سطر الإجمالي العام المتوازن 100% -->
            <tr class="total-row" style="background: var(--bg-alt); font-size: 1rem; border-top: 3px double var(--border-color);">
              <td colspan="3" style="text-align: center; font-weight: 900;">
                الإجمـــــــــــــــــــــــالي العــــــــام
              </td>
              <td style="color: var(--success); font-weight: 900;">${totals.malePass.toLocaleString('ar-EG')}</td>
              <td style="color: var(--danger); font-weight: 900;">
                <strong>${totals.maleNotPass.toLocaleString('ar-EG')}</strong>
                <span class="sub-detail">(راسب: ${totals.maleFailOnly.toLocaleString('ar-EG')} / لم يؤدِ: ${totals.maleNotAtt.toLocaleString('ar-EG')})</span>
              </td>
              <td style="font-weight: 900;">${totals.maleTotal.toLocaleString('ar-EG')}</td>
              
              <td style="color: var(--success); font-weight: 900;">${totals.femalePass.toLocaleString('ar-EG')}</td>
              <td style="color: var(--danger); font-weight: 900;">
                <strong>${totals.femaleNotPass.toLocaleString('ar-EG')}</strong>
                <span class="sub-detail">(راسب: ${totals.femaleFailOnly.toLocaleString('ar-EG')} / لم يؤدِ: ${totals.femaleNotAtt.toLocaleString('ar-EG')})</span>
              </td>
              <td style="font-weight: 900;">${totals.femaleTotal.toLocaleString('ar-EG')}</td>
              
              <td style="background: rgba(245, 158, 11, 0.25); font-weight: 900; color: var(--gold); font-size: 1.05rem;">${totals.grandTotal.toLocaleString('ar-EG')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = tableHtml;

  // تجهيز حاوية الطباعة لنفس التقرير عند طلب الطباعة (أبيض وأسود رسمي A4)
  setupPrintView(`
    <div class="clean-print-header">
      <div class="clean-print-univ">جامعة اللوتس بالمنيا</div>
      <div class="clean-print-title">الاحصائية العددية للطلاب الذكور و الإناث مقسمة على السنوات الدراسية</div>
      ${filterDesc ? `<div style="font-size: 9pt; color: #333; margin-top: 3px;">نطاق التصفية المطبق: ${escapeHtml(filterDesc)}</div>` : ''}
    </div>

    <table class="official-print-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 30px;">م</th>
          <th rowspan="2">اسم الجامعة</th>
          <th rowspan="2">السنة الدراسية</th>
          <th colspan="3">عدد الطلبة الذكور</th>
          <th colspan="3">موقف الطالبات الإناث</th>
          <th rowspan="2">الإجمــــــــالي</th>
        </tr>
        <tr>
          <th>حاصل</th>
          <th>غير حاصل</th>
          <th>إجمالي</th>
          <th>حاصل</th>
          <th>غير حاصل</th>
          <th>إجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${rowsData.map((row, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${idx === 0 ? 'جامعة اللوتس' : ''}</td>
            <td>${row.level}</td>
            <td>${row.grandTotal > 0 ? row.malePass : '-'}</td>
            <td>${row.grandTotal > 0 ? `${row.maleNotPass} <span class="sub-detail">(${row.maleFailOnly} باقٍ / ${row.maleNotAtt} لم يدخل)</span>` : '-'}</td>
            <td>${row.grandTotal > 0 ? row.maleTotal : '-'}</td>
            <td>${row.grandTotal > 0 ? row.femalePass : '-'}</td>
            <td>${row.grandTotal > 0 ? `${row.femaleNotPass} <span class="sub-detail">(${row.femaleFailOnly} باقية / ${row.femaleNotAtt} لم تدخل)</span>` : '-'}</td>
            <td>${row.femaleTotal > 0 ? row.femaleTotal : '-'}</td>
            <td><strong>${row.grandTotal > 0 ? row.grandTotal : '-'}</strong></td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3">الإجمـــــــــــــــــــــــالي العــــــــام</td>
          <td>${totals.malePass}</td>
          <td>${totals.maleNotPass} <span class="sub-detail">(${totals.maleFailOnly} باقٍ / ${totals.maleNotAtt} لم يدخل)</span></td>
          <td>${totals.maleTotal}</td>
          <td>${totals.femalePass}</td>
          <td>${totals.femaleNotPass} <span class="sub-detail">(${totals.femaleFailOnly} باقية / ${totals.femaleNotAtt} لم تدخل)</span></td>
          <td>${totals.femaleTotal}</td>
          <td><strong>${totals.grandTotal}</strong></td>
        </tr>
      </tbody>
    </table>
  `);
}

/**
 * 2. تقرير الإحصائية التفصيلية الشاملة للتربية العسكرية
 * يعرض تفصيل: حاصل / غير حاصل (باقٍ للإعادة) / لم يدخل أي دورة بعد (مستهدف جديد)
 */
function renderDetailedStatisticalReport(container) {
  const filteredStudents = getFilteredStudentsForReports();
  updateReportFilterNotice(filteredStudents.length);
  const filterDesc = getActiveFiltersDescription();
  const selectedYear = document.getElementById('reportYearFilter')?.value || '';
  const yearsToProcess = selectedYear ? [selectedYear] : ACADEMIC_YEARS_LEVELS;

  const rowsData = yearsToProcess.map(lvl => {
    const list = filteredStudents.filter(s => s.year === lvl || normalizeYearName(s.year) === normalizeYearName(lvl));
    const males = list.filter(s => s.gender === 'male');
    const females = list.filter(s => s.gender === 'female');

    const mPass = males.filter(s => s.status === 'pass').length;
    const mFail = males.filter(s => s.status === 'fail').length;
    const mNotAtt = males.filter(s => s.status === 'not_attended').length;
    const mTotal = males.length;

    const fPass = females.filter(s => s.status === 'pass').length;
    const fFail = females.filter(s => s.status === 'fail').length;
    const fNotAtt = females.filter(s => s.status === 'not_attended').length;
    const fTotal = females.length;

    const grandTotal = mTotal + fTotal;
    const passTotal = mPass + fPass;
    const passRate = grandTotal > 0 ? ((passTotal / grandTotal) * 100).toFixed(1) : '0';

    return {
      level: lvl,
      mPass, mFail, mNotAtt, mTotal,
      fPass, fFail, fNotAtt, fTotal,
      grandTotal,
      passTotal,
      passRate
    };
  });

  const totals = rowsData.reduce((acc, r) => ({
    mPass: acc.mPass + r.mPass,
    mFail: acc.mFail + r.mFail,
    mNotAtt: acc.mNotAtt + r.mNotAtt,
    mTotal: acc.mTotal + r.mTotal,
    fPass: acc.fPass + r.fPass,
    fFail: acc.fFail + r.fFail,
    fNotAtt: acc.fNotAtt + r.fNotAtt,
    fTotal: acc.fTotal + r.fTotal,
    grandTotal: acc.grandTotal + r.grandTotal,
    passTotal: acc.passTotal + r.passTotal
  }), {
    mPass: 0, mFail: 0, mNotAtt: 0, mTotal: 0,
    fPass: 0, fFail: 0, fNotAtt: 0, fTotal: 0,
    grandTotal: 0, passTotal: 0
  });

  const html = `
    <div class="report-sheet-card">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="font-size: 1.55rem; font-weight: 900; color: var(--primary); margin-bottom: 6px;">جامعة اللوتس بالمنيا</h2>
        <div style="display:inline-block; padding: 4px 14px; background: var(--bg-alt); border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700; color: var(--primary); margin-bottom: 8px; border: 1px solid var(--border-color);">
          تقرير تحليلي تفصيلي لشؤون الطلاب والقيادة الجامعية
        </div>
        <h3 style="font-size: 1.35rem; font-weight: 900; color: var(--text-main); margin-bottom: 4px;">
          الاحصائية العددية التفصيلية الشاملة للتربية العسكرية (حاصل / غير حاصل / لم يسجل بعد)
        </h3>
        ${filterDesc ? `<p style="color: var(--gold); font-size: 0.85rem; font-weight: 600; margin-top: 4px;">(نطاق التصفية المطبق: ${escapeHtml(filterDesc)})</p>` : ''}
      </div>

      <div class="table-responsive">
        <table class="custom-table official-print-table" style="text-align: center;">
          <thead>
            <tr>
              <th rowspan="2" style="vertical-align: middle; width: 45px;">م</th>
              <th rowspan="2" style="vertical-align: middle;">اسم الجامعة</th>
              <th rowspan="2" style="vertical-align: middle;">السنة الدراسية</th>
              <th colspan="4" style="text-align: center; background: rgba(56, 189, 248, 0.15); color: var(--primary); font-weight:800;">الطلبة الذكور</th>
              <th colspan="4" style="text-align: center; background: rgba(244, 114, 182, 0.15); color: var(--gender-female); font-weight:800;">الطالبات الإناث</th>
              <th rowspan="2" style="vertical-align: middle; background: rgba(245, 158, 11, 0.18); color: var(--gold); font-weight:900;">الإجمالي الكلي</th>
            </tr>
            <tr>
              <th style="background: rgba(16, 185, 129, 0.12); color: var(--success);">حاصل (اجتاز)</th>
              <th style="background: rgba(239, 68, 68, 0.12); color: var(--danger);">راسب (باقٍ)</th>
              <th style="background: rgba(245, 158, 11, 0.12); color: var(--warning-text);">لم يدخل بعد</th>
              <th style="background: var(--bg-alt); font-weight: 900;">إجمالي الذكور</th>

              <th style="background: rgba(16, 185, 129, 0.12); color: var(--success);">حاصلة (اجتازت)</th>
              <th style="background: rgba(239, 68, 68, 0.12); color: var(--danger);">راسبة (باقية)</th>
              <th style="background: rgba(245, 158, 11, 0.12); color: var(--warning-text);">لم تدخل بعد</th>
              <th style="background: var(--bg-alt); font-weight: 900;">إجمالي الإناث</th>
            </tr>
          </thead>
          <tbody>
            ${rowsData.map((r, idx) => `
              <tr>
                <td><strong>${idx + 1}</strong></td>
                <td>${idx === 0 ? '<strong style="color:var(--primary);">جامعة اللوتس</strong>' : ''}</td>
                <td><strong>${escapeHtml(r.level)}</strong></td>

                <td style="color: var(--success); font-weight: 700;">${r.mPass.toLocaleString('ar-EG')}</td>
                <td style="color: var(--danger); font-weight: 700;">${r.mFail.toLocaleString('ar-EG')}</td>
                <td style="color: var(--warning-text); font-weight: 700;">${r.mNotAtt.toLocaleString('ar-EG')}</td>
                <td style="font-weight: 800;">${r.mTotal.toLocaleString('ar-EG')}</td>

                <td style="color: var(--success); font-weight: 700;">${r.fPass.toLocaleString('ar-EG')}</td>
                <td style="color: var(--danger); font-weight: 700;">${r.fFail.toLocaleString('ar-EG')}</td>
                <td style="color: var(--warning-text); font-weight: 700;">${r.fNotAtt.toLocaleString('ar-EG')}</td>
                <td style="font-weight: 800;">${r.fTotal.toLocaleString('ar-EG')}</td>

                <td style="background: rgba(245, 158, 11, 0.15); font-weight: 900; font-size: 1rem; color: var(--gold);">${r.grandTotal.toLocaleString('ar-EG')}</td>
              </tr>
            `).join('')}

            <tr class="total-row" style="background: var(--bg-alt); font-size: 1rem; border-top: 3px double var(--border-color);">
              <td colspan="3" style="text-align: center; font-weight: 900;">
                الإجمـــــــــــــــــــــــالي العــــــــام
              </td>
              <td style="color: var(--success); font-weight: 900;">${totals.mPass.toLocaleString('ar-EG')}</td>
              <td style="color: var(--danger); font-weight: 900;">${totals.mFail.toLocaleString('ar-EG')}</td>
              <td style="color: var(--warning-text); font-weight: 900;">${totals.mNotAtt.toLocaleString('ar-EG')}</td>
              <td style="font-weight: 900;">${totals.mTotal.toLocaleString('ar-EG')}</td>

              <td style="color: var(--success); font-weight: 900;">${totals.fPass.toLocaleString('ar-EG')}</td>
              <td style="color: var(--danger); font-weight: 900;">${totals.fFail.toLocaleString('ar-EG')}</td>
              <td style="color: var(--warning-text); font-weight: 900;">${totals.fNotAtt.toLocaleString('ar-EG')}</td>
              <td style="font-weight: 900;">${totals.fTotal.toLocaleString('ar-EG')}</td>

              <td style="background: rgba(245, 158, 11, 0.25); font-weight: 900; color: var(--gold); font-size: 1.05rem;">${totals.grandTotal.toLocaleString('ar-EG')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // تجهيز حاوية الطباعة لنفس التقرير عند طلب الطباعة (A4 رسمي)
  setupPrintView(`
    <div class="clean-print-header">
      <div class="clean-print-univ">جامعة اللوتس بالمنيا</div>
      <div class="clean-print-title">الاحصائية العددية التفصيلية الشاملة للتربية العسكرية (حاصل / راسب / لم يسجل بعد)</div>
      ${filterDesc ? `<div style="font-size: 9pt; color: #333; margin-top: 3px;">نطاق التصفية المطبق: ${escapeHtml(filterDesc)}</div>` : ''}
    </div>

    <table class="official-print-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 30px;">م</th>
          <th rowspan="2">اسم الجامعة</th>
          <th rowspan="2">السنة الدراسية</th>
          <th colspan="4">الطلبة الذكور</th>
          <th colspan="4">الطالبات الإناث</th>
          <th rowspan="2">الإجمالي</th>
        </tr>
        <tr>
          <th>حاصل</th>
          <th>راسب</th>
          <th>لم يدخل</th>
          <th>إجمالي</th>

          <th>حاصلة</th>
          <th>راسبة</th>
          <th>لم تدخل</th>
          <th>إجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${rowsData.map((r, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${idx === 0 ? 'جامعة اللوتس' : ''}</td>
            <td>${r.level}</td>

            <td>${r.mPass}</td>
            <td>${r.mFail}</td>
            <td>${r.mNotAtt}</td>
            <td><strong>${r.mTotal}</strong></td>

            <td>${r.fPass}</td>
            <td>${r.fFail}</td>
            <td>${r.fNotAtt}</td>
            <td><strong>${r.fTotal}</strong></td>

            <td><strong>${r.grandTotal}</strong></td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3">الإجمـــــــــــــــــــــــالي العــــــــام</td>
          <td>${totals.mPass}</td>
          <td>${totals.mFail}</td>
          <td>${totals.mNotAtt}</td>
          <td><strong>${totals.mTotal}</strong></td>

          <td>${totals.fPass}</td>
          <td>${totals.fFail}</td>
          <td>${totals.fNotAtt}</td>
          <td><strong>${totals.fTotal}</strong></td>

          <td><strong>${totals.grandTotal}</strong></td>
        </tr>
      </tbody>
    </table>
  `);
}

function renderPassedStudentsReport(container) {
  const filteredStudents = getFilteredStudentsForReports();
  const list = filteredStudents.filter(s => s.status === 'pass');
  updateReportFilterNotice(list.length);
  const filterDesc = getActiveFiltersDescription();

  const title = `كشف الطلاب الحاصلين على دورة التربية العسكرية (اجتازوا بنجاح)`;

  const html = `
    <div class="report-sheet-card">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.55rem; font-weight: 900; color: var(--primary); margin-bottom: 6px;">جامعة اللوتس بالمنيا</h2>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--success);">${title}</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem;">إجمالي المقيدين بالكشف: ${list.length.toLocaleString('ar-EG')} طالب وطالبة ${filterDesc ? `| نطاق التصفية: <strong style="color:var(--gold);">${escapeHtml(filterDesc)}</strong>` : ''}</p>
      </div>

      <div class="table-responsive">
        <table class="custom-table official-print-table">
          <thead>
            <tr>
              <th style="width: 40px;">م</th>
              <th>كود الطالب</th>
              <th>الرقم القومي</th>
              <th>اسم الطالب رباعي</th>
              <th>النوع</th>
              <th>الكلية</th>
              <th>التخصص / الشعبة</th>
              <th>الفرقة الدراسية</th>
              <th>الدورة المقيد بها / المنجزة</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((s, idx) => {
              const courseInfo = getCleanCourseAndGrade(s);
              return `
              <tr>
                <td>${idx + 1}</td>
                <td><span class="code-pill">${escapeHtml(s.code || '-')}</span></td>
                <td><span style="font-family: monospace;">${escapeHtml(s.nationalId || '-')}</span></td>
                <td><strong>${escapeHtml(s.name)}</strong></td>
                <td>${s.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
                <td>${escapeHtml(s.college || '-')}</td>
                <td><span style="font-weight:700; color: var(--gold-dark);">${escapeHtml(s.specialization || s.college || '-')}</span></td>
                <td>${escapeHtml(s.year || '-')}</td>
                <td><span style="font-weight:700; color: var(--success);">${escapeHtml(courseInfo.display)}</span></td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;
  setupPrintViewForStudentList(title, list);
}

function renderFailedStudentsReport(container) {
  const filteredStudents = getFilteredStudentsForReports();
  const list = filteredStudents.filter(s => s.status === 'fail');
  updateReportFilterNotice(list.length);
  const filterDesc = getActiveFiltersDescription();

  const title = `كشف الطلاب غير الحاصلين على دورة التربية العسكرية (لم يجتازوا - باقون للإعادة)`;

  const html = `
    <div class="report-sheet-card">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.55rem; font-weight: 900; color: var(--primary); margin-bottom: 6px;">جامعة اللوتس بالمنيا</h2>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--danger);">${title}</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem;">إجمالي الطلاب الباقين بالكشف: ${list.length.toLocaleString('ar-EG')} طالب وطالبة ${filterDesc ? `| نطاق التصفية: <strong style="color:var(--gold);">${escapeHtml(filterDesc)}</strong>` : ''}</p>
      </div>

      <div class="table-responsive">
        <table class="custom-table official-print-table">
          <thead>
            <tr>
              <th style="width: 40px;">م</th>
              <th>كود الطالب</th>
              <th>الرقم القومي</th>
              <th>اسم الطالب رباعي</th>
              <th>النوع</th>
              <th>الكلية</th>
              <th>التخصص / الشعبة</th>
              <th>الفرقة الدراسية</th>
              <th>الموقف / الدورة</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((s, idx) => {
              const courseInfo = getCleanCourseAndGrade(s);
              return `
              <tr>
                <td>${idx + 1}</td>
                <td><span class="code-pill">${escapeHtml(s.code || '-')}</span></td>
                <td><span style="font-family: monospace;">${escapeHtml(s.nationalId || '-')}</span></td>
                <td><strong>${escapeHtml(s.name)}</strong></td>
                <td>${s.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
                <td>${escapeHtml(s.college || '-')}</td>
                <td><span style="font-weight:700; color: var(--gold-dark);">${escapeHtml(s.specialization || s.college || '-')}</span></td>
                <td>${escapeHtml(s.year || '-')}</td>
                <td><span style="font-weight:700; color: var(--danger);">${courseInfo.course ? `${escapeHtml(courseInfo.course)} (باقٍ للإعادة)` : 'غير حاصل (لم يجتز)'}</span></td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;
  setupPrintViewForStudentList(title, list);
}

function renderNotAttendedStudentsReport(container) {
  const filteredStudents = getFilteredStudentsForReports();
  const list = filteredStudents.filter(s => s.status === 'not_attended');
  updateReportFilterNotice(list.length);
  const filterDesc = getActiveFiltersDescription();

  const title = `كشف الطلاب المقيدين الذين لم يدخلوا أي دورة بعد (المستهدفون الجدد)`;

  const html = `
    <div class="report-sheet-card">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.55rem; font-weight: 900; color: var(--primary); margin-bottom: 6px;">جامعة اللوتس بالمنيا</h2>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--warning-text);">${title}</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem;">إجمالي المستهدفين بالكشف: ${list.length.toLocaleString('ar-EG')} طالب وطالبة ${filterDesc ? `| نطاق التصفية: <strong style="color:var(--gold);">${escapeHtml(filterDesc)}</strong>` : ''}</p>
      </div>

      <div class="table-responsive">
        <table class="custom-table official-print-table">
          <thead>
            <tr>
              <th style="width: 40px;">م</th>
              <th>كود الطالب</th>
              <th>الرقم القومي</th>
              <th>اسم الطالب رباعي</th>
              <th>النوع</th>
              <th>الكلية</th>
              <th>التخصص / الشعبة</th>
              <th>الفرقة الدراسية</th>
              <th>الموقف الحالي</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((s, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><span class="code-pill">${escapeHtml(s.code || '-')}</span></td>
                <td><span style="font-family: monospace;">${escapeHtml(s.nationalId || '-')}</span></td>
                <td><strong>${escapeHtml(s.name)}</strong></td>
                <td>${s.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
                <td>${escapeHtml(s.college || '-')}</td>
                <td><span style="font-weight:700; color: var(--gold-dark);">${escapeHtml(s.specialization || s.college || '-')}</span></td>
                <td>${escapeHtml(s.year || '-')}</td>
                <td><span style="font-weight:700; color: var(--warning-text); background: rgba(245, 158, 11, 0.12); padding:2px 8px; border-radius:4px; border:1px solid rgba(245, 158, 11, 0.3);">لم يدخل أي دورة بعد</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;
  setupPrintViewForStudentList(title, list);
}

function renderAllStudentsReport(container) {
  const list = getFilteredStudentsForReports();
  updateReportFilterNotice(list.length);
  const filterDesc = getActiveFiltersDescription();

  const title = `كشف جميع طلاب جامعة اللوتس المقيدين بنظام التربية العسكرية`;

  const html = `
    <div class="report-sheet-card">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.55rem; font-weight: 900; color: var(--primary); margin-bottom: 6px;">جامعة اللوتس بالمنيا</h2>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">${title}</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem;">إجمالي الطلاب المقيدين بالكشف: ${list.length.toLocaleString('ar-EG')} طالب وطالبة ${filterDesc ? `| نطاق التصفية: <strong style="color:var(--gold);">${escapeHtml(filterDesc)}</strong>` : ''}</p>
      </div>

      <div class="table-responsive">
        <table class="custom-table official-print-table">
          <thead>
            <tr>
              <th style="width: 40px;">م</th>
              <th>كود الطالب</th>
              <th>الرقم القومي</th>
              <th>اسم الطالب</th>
              <th>النوع</th>
              <th>الكلية</th>
              <th>التخصص / الشعبة</th>
              <th>الفرقة</th>
              <th>موقف الدورة</th>
              <th>الدورة المقيد بها / المنجزة</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((s, idx) => {
              const courseInfo = getCleanCourseAndGrade(s);
              return `
              <tr>
                <td>${idx + 1}</td>
                <td><span class="code-pill">${escapeHtml(s.code || '-')}</span></td>
                <td><span style="font-family: monospace;">${escapeHtml(s.nationalId || '-')}</span></td>
                <td><strong>${escapeHtml(s.name)}</strong></td>
                <td>${s.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
                <td>${escapeHtml(s.college || '-')}</td>
                <td><span style="font-weight:700; color: var(--gold-dark);">${escapeHtml(s.specialization || s.college || '-')}</span></td>
                <td>${escapeHtml(s.year || '-')}</td>
                <td>${s.status === 'pass' ? '<span style="color:var(--success); font-weight:700;">حاصل</span>' : s.status === 'fail' ? '<span style="color:var(--danger); font-weight:700;">غير حاصل</span>' : '<span style="color:var(--warning-text); font-weight:700;">لم يدخل بعد</span>'}</td>
                <td>${escapeHtml(courseInfo.display)}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;
  setupPrintViewForStudentList(title, list);
}

function renderCollegesSummaryReport(container) {
  const filteredStudents = getFilteredStudentsForReports();
  updateReportFilterNotice(filteredStudents.length);
  const filterDesc = getActiveFiltersDescription();
  const selectedCollege = document.getElementById('reportCollegeFilter')?.value || '';
  const collegesToProcess = selectedCollege ? [selectedCollege] : LOTUS_COLLEGES;

  const stats = collegesToProcess.map(col => {
    const list = filteredStudents.filter(s => s.college === col || normalizeCollegeName(s.college) === normalizeCollegeName(col));
    const males = list.filter(s => s.gender === 'male');
    const females = list.filter(s => s.gender === 'female');
    const passed = list.filter(s => s.status === 'pass');
    const failed = list.filter(s => s.status === 'fail');
    const notAttended = list.filter(s => s.status === 'not_attended');
    return {
      college: col,
      total: list.length,
      males: males.length,
      females: females.length,
      passed: passed.length,
      failed: failed.length,
      notAttended: notAttended.length,
      rate: list.length > 0 ? ((passed.length / list.length) * 100).toFixed(1) : '0'
    };
  });

  const totals = stats.reduce((acc, st) => ({
    total: acc.total + st.total,
    males: acc.males + st.males,
    females: acc.females + st.females,
    passed: acc.passed + st.passed,
    failed: acc.failed + st.failed,
    notAttended: acc.notAttended + st.notAttended
  }), { total: 0, males: 0, females: 0, passed: 0, failed: 0, notAttended: 0 });

  const html = `
    <div class="report-sheet-card">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.55rem; font-weight: 900; color: var(--primary); margin-bottom: 6px;">جامعة اللوتس بالمنيا</h2>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">تقرير الموقف الإحصائي المجمع لكليات جامعة اللوتس بالمنيا</h3>
        <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 5px;">إجمالي الطلاب المقيدين: ${totals.total.toLocaleString('ar-EG')} طالب وطالبة ${filterDesc ? `| نطاق التصفية: <strong style="color:var(--gold);">${escapeHtml(filterDesc)}</strong>` : ''}</div>
      </div>

      <div class="table-responsive">
        <table class="custom-table official-print-table" style="text-align: center;">
          <thead>
            <tr>
              <th style="width: 40px;">م</th>
              <th style="text-align: right;">الكلية</th>
              <th>إجمالي الطلاب</th>
              <th>ذكور</th>
              <th>إناث</th>
              <th>حاصلين (اجتاز)</th>
              <th>لم يجتازوا (راسب)</th>
              <th>لم يدخلوا بعد</th>
            </tr>
          </thead>
          <tbody>
            ${stats.map((st, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td style="text-align: right;"><strong>${escapeHtml(st.college)}</strong></td>
                <td><strong>${st.total.toLocaleString('ar-EG')}</strong></td>
                <td>${st.males.toLocaleString('ar-EG')}</td>
                <td>${st.females.toLocaleString('ar-EG')}</td>
                <td style="color: var(--success); font-weight: 700;">${st.passed.toLocaleString('ar-EG')}</td>
                <td style="color: var(--danger); font-weight: 700;">${st.failed.toLocaleString('ar-EG')}</td>
                <td style="color: var(--warning-text); font-weight: 700;">${st.notAttended.toLocaleString('ar-EG')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot style="background: var(--bg-alt); font-weight: 800; border-top: 2px solid var(--primary);">
            <tr>
              <td colspan="2" style="text-align: right;">الإجمــــــــــــــــــــــــــــالي العــــــــام</td>
              <td>${totals.total.toLocaleString('ar-EG')}</td>
              <td>${totals.males.toLocaleString('ar-EG')}</td>
              <td>${totals.females.toLocaleString('ar-EG')}</td>
              <td style="color: var(--success);">${totals.passed.toLocaleString('ar-EG')}</td>
              <td style="color: var(--danger);">${totals.failed.toLocaleString('ar-EG')}</td>
              <td style="color: var(--warning-text);">${totals.notAttended.toLocaleString('ar-EG')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;

  setupPrintView(`
    <div class="clean-print-header">
      <div class="clean-print-univ">جامعة اللوتس بالمنيا</div>
      <div class="clean-print-title">تقرير الموقف الإحصائي المجمع لكليات جامعة اللوتس بالمنيا</div>
      ${filterDesc ? `<div style="font-size: 9pt; color: #333; margin-top: 3px;">نطاق التصفية المطبق: ${escapeHtml(filterDesc)}</div>` : ''}
    </div>

    <table class="official-print-table" style="text-align: center;">
      <thead>
        <tr>
          <th style="width: 35px;">م</th>
          <th style="text-align: right;">الكلية</th>
          <th>إجمالي الطلاب</th>
          <th>ذكور</th>
          <th>إناث</th>
          <th>حاصلين (اجتاز)</th>
          <th>لم يجتازوا (راسب)</th>
          <th>لم يدخلوا بعد</th>
        </tr>
      </thead>
      <tbody>
        ${stats.map((st, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td style="text-align: right; font-weight: 700;">${st.college}</td>
            <td><strong>${st.total}</strong></td>
            <td>${st.males}</td>
            <td>${st.females}</td>
            <td>${st.passed}</td>
            <td>${st.failed}</td>
            <td>${st.notAttended}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot style="background: #f1f5f9; font-weight: 800; border-top: 2px solid #000;">
        <tr>
          <td colspan="2" style="text-align: right;">الإجمــــــــــــــــــــــــــــالي العــــــــام</td>
          <td>${totals.total}</td>
          <td>${totals.males}</td>
          <td>${totals.females}</td>
          <td>${totals.passed}</td>
          <td>${totals.failed}</td>
          <td>${totals.notAttended}</td>
        </tr>
      </tfoot>
    </table>
  `);
}

function preparePrintOrientation(isLandscape = true) {
  let styleEl = document.getElementById('dynamic-print-orientation');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-print-orientation';
    document.head.appendChild(styleEl);
  }
  if (isLandscape) {
    styleEl.innerHTML = `
      @page {
        size: A4 landscape !important;
        margin: 8mm 6mm 8mm 6mm !important;
      }
    `;
    document.body.classList.remove('print-portrait');
    document.body.classList.add('print-landscape');
  } else {
    styleEl.innerHTML = `
      @page {
        size: A4 portrait !important;
        margin: 10mm 8mm 10mm 8mm !important;
      }
    `;
    document.body.classList.remove('print-landscape');
    document.body.classList.add('print-portrait');
  }
}

// استماع لأمر الطباعة بالمتصفح (Ctrl+P أو زر الطباعة) لضمان جاهزية المحتوى
window.addEventListener('beforeprint', () => {
  const cardModal = document.getElementById('cardDetailModal');
  if (cardModal && cardModal.classList.contains('active')) {
    return;
  }
  const dossierModal = document.getElementById('studentDossierModal');
  if (dossierModal && dossierModal.classList.contains('active')) {
    return;
  }
  renderSelectedReport();
  preparePrintOrientation(true);
});

function setupPrintView(innerHtml) {
  const container = document.getElementById('printReportContainer');
  if (container) {
    container.innerHTML = innerHtml;
  }
}

function setupPrintViewForStudentList(reportTitle, studentList) {
  const filterDesc = getActiveFiltersDescription();
  setupPrintView(`
    <div class="clean-print-header">
      <div class="clean-print-univ">جامعة اللوتس بالمنيا</div>
      <div class="clean-print-title">${reportTitle}</div>
      ${filterDesc ? `<div style="font-size: 9pt; color: #333; margin-top: 3px;">نطاق التصفية المطبق: ${escapeHtml(filterDesc)}</div>` : ''}
    </div>
    <div style="margin-bottom: 8px; font-size: 9.5pt; color: #222; display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding-bottom: 4px;">
      <span><strong>إجمالي العدد بالكشف:</strong> ${studentList.length.toLocaleString('ar-EG')} طالب</span>
      <span><strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString('ar-EG')}</span>
    </div>

    <table class="official-print-table">
      <thead>
        <tr>
          <th style="width: 35px;">م</th>
          <th>كود الطالب</th>
          <th>الرقم القومي</th>
          <th>اسم الطالب</th>
          <th>النوع</th>
          <th>الكلية</th>
          <th>التخصص / الشعبة</th>
          <th>الفرقة</th>
          <th>الموقف</th>
          <th>الدورة المقيد بها / المنجزة</th>
        </tr>
      </thead>
      <tbody>
        ${studentList.map((s, idx) => {
          const courseInfo = getCleanCourseAndGrade(s);
          return `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(s.code || '-')}</td>
            <td>${escapeHtml(s.nationalId || '-')}</td>
            <td style="text-align: right;">${escapeHtml(s.name)}</td>
            <td>${s.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
            <td>${escapeHtml(s.college || '-')}</td>
            <td>${escapeHtml(s.specialization || s.college || '-')}</td>
            <td>${escapeHtml(s.year || '-')}</td>
            <td>${s.status === 'pass' ? 'حاصل (اجتاز)' : s.status === 'fail' ? 'غير حاصل (لم يجتز)' : 'لم يدخل أي دورة بعد'}</td>
            <td>${escapeHtml(courseInfo.display)}</td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
  `);
}

function exportCurrentReportToExcel() {
  if (typeof XLSX === 'undefined') {
    showToast('مكتبة SheetJS غير متوفرة للتصدير', 'error');
    return;
  }

  const activeTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');
  let filename = 'تقرير_تربية_عسكرية_جامعة_اللوتس.xlsx';
  let sheetData = [];

  if (activeTab === 'studentsTab') {
    const list = getFilteredStudents();
    filename = `بيانات_الطلاب_المعروضة_${list.length}_طالب.xlsx`;
    sheetData = [
      ['جامعة اللوتس بالمنيا - إدارة التربية العسكرية والتربية الوطنية'],
      [`كشف الطلاب المصفى - العدد: ${list.length} طالب وطالبة`],
      [],
      ['م', 'كود الطالب', 'الرقم القومي', 'اسم الطالب بالكامل', 'النوع', 'الكلية', 'التخصص / الشعبة', 'الفرقة', 'موقف الدورة', 'الدورة المقيد بها / المنجزة']
    ];
    list.forEach((s, idx) => {
      const courseInfo = getCleanCourseAndGrade(s);
      sheetData.push([
        idx + 1,
        s.code || '',
        s.nationalId || '',
        s.name || '',
        s.gender === 'male' ? 'ذكر' : 'أنثى',
        s.college || '',
        s.specialization || s.college || '',
        s.year || '',
        s.status === 'pass' ? 'حاصل (اجتاز)' : s.status === 'fail' ? 'غير حاصل (لم يجتز)' : 'لم يدخل أي دورة بعد',
        courseInfo.plainText
      ]);
    });
  } else {
    const reportType = document.getElementById('reportTypeSelector')?.value || 'officialLetter';
    const filterDesc = getActiveFiltersDescription();
    const filteredStudents = getFilteredStudentsForReports();

    if (reportType === 'officialLetter') {
      const selectedYear = document.getElementById('reportYearFilter')?.value || '';
      const yearsToProcess = selectedYear ? [selectedYear] : ACADEMIC_YEARS_LEVELS;

      filename = 'احصائية_باعداد_الطلاب_تربية_عسكرية_جامعة_اللوتس.xlsx';
      sheetData = [
        ['جامعة اللوتس بالمنيا - إدارة التربية العسكرية والتربية الوطنية'],
        ['الاحصائية العددية للطلاب الذكور و الإناث مقسمة على السنوات الدراسية'],
        [`العام الجامعي: 2024 / 2025 ${filterDesc ? `- الفلاتر: ${filterDesc}` : ''}`],
        [],
        ['م', 'اسم الجامعة', 'السنة الدراسية', 'ذكور حاصل', 'ذكور غير حاصل', 'إجمالي الذكور', 'إناث حاصل', 'إناث غير حاصل', 'إجمالي الإناث', 'الإجمالي العام']
      ];

      let totMP = 0, totMF = 0, totFP = 0, totFF = 0, totGrand = 0;

      yearsToProcess.forEach((lvl, idx) => {
        const list = filteredStudents.filter(s => s.year === lvl || normalizeYearName(s.year) === normalizeYearName(lvl));
        const males = list.filter(s => s.gender === 'male');
        const females = list.filter(s => s.gender === 'female');
        const mPass = males.filter(s => s.status === 'pass').length;
        const mFail = males.length - mPass;
        const fPass = females.filter(s => s.status === 'pass').length;
        const fFail = females.length - fPass;

        totMP += mPass;
        totMF += mFail;
        totFP += fPass;
        totFF += fFail;
        totGrand += list.length;

        sheetData.push([
          idx + 1,
          idx === 0 ? 'جامعة اللوتس' : '',
          lvl,
          mPass,
          mFail,
          mPass + mFail,
          fPass,
          fFail,
          fPass + fFail,
          list.length
        ]);
      });

      sheetData.push([]);
      sheetData.push([
        '',
        'الإجمـــــــــــــــــــــــالي العام',
        '',
        totMP,
        totMF,
        totMP + totMF,
        totFP,
        totFF,
        totFP + totFF,
        totGrand
      ]);
    } else if (reportType === 'detailedStatisticsLetter') {
      const selectedYear = document.getElementById('reportYearFilter')?.value || '';
      const yearsToProcess = selectedYear ? [selectedYear] : ACADEMIC_YEARS_LEVELS;

      filename = 'احصائية_تفصيلية_شاملة_تربية_عسكرية_جامعة_اللوتس.xlsx';
      sheetData = [
        ['جامعة اللوتس بالمنيا - إدارة التربية العسكرية والتربية الوطنية'],
        ['الاحصائية العددية التفصيلية الشاملة للتربية العسكرية (حاصل / راسب / لم يسجل بعد)'],
        [`العام الجامعي: 2024 / 2025 ${filterDesc ? `- الفلاتر: ${filterDesc}` : ''}`],
        [],
        ['م', 'اسم الجامعة', 'السنة الدراسية', 'ذكور حاصل (اجتاز)', 'ذكور راسب (باقٍ)', 'ذكور لم يدخل (مستهدف)', 'إجمالي الذكور', 'إناث حاصلة (اجتازت)', 'إناث راسبة (باقية)', 'إناث لم تدخل (مستهدفة)', 'إجمالي الإناث', 'الإجمالي الكلي']
      ];

      let totMP = 0, totMF = 0, totMN = 0, totFP = 0, totFF = 0, totFN = 0, totGrand = 0;

      yearsToProcess.forEach((lvl, idx) => {
        const list = filteredStudents.filter(s => s.year === lvl || normalizeYearName(s.year) === normalizeYearName(lvl));
        const males = list.filter(s => s.gender === 'male');
        const females = list.filter(s => s.gender === 'female');
        const mp = males.filter(s => s.status === 'pass').length;
        const mf = males.filter(s => s.status === 'fail').length;
        const mn = males.filter(s => s.status === 'not_attended').length;
        const fp = females.filter(s => s.status === 'pass').length;
        const ff = females.filter(s => s.status === 'fail').length;
        const fn = females.filter(s => s.status === 'not_attended').length;

        totMP += mp; totMF += mf; totMN += mn;
        totFP += fp; totFF += ff; totFN += fn;
        totGrand += list.length;

        sheetData.push([
          idx + 1,
          idx === 0 ? 'جامعة اللوتس' : '',
          lvl,
          mp, mf, mn, males.length,
          fp, ff, fn, females.length,
          list.length
        ]);
      });

      sheetData.push([]);
      sheetData.push([
        '',
        'الإجمـــــــــــــــــــــــالي العام',
        '',
        totMP, totMF, totMN, totMP + totMF + totMN,
        totFP, totFF, totFN, totFP + totFF + totFN,
        totGrand
      ]);
    } else if (reportType === 'notAttendedStudents') {
      const list = filteredStudents.filter(s => s.status === 'not_attended');
      filename = `كشف_الطلاب_الذين_لم_يدخلوا_دورات_بعد_${list.length}_طالب.xlsx`;
      sheetData = [
        ['جامعة اللوتس بالمنيا - إدارة التربية العسكرية'],
        [`كشف الطلاب المقيدين الذين لم يدخلوا أي دورة بعد (المستهدفون الجدد) ${filterDesc ? `- الفلاتر: ${filterDesc}` : ''}`],
        [],
        ['م', 'كود الطالب', 'الرقم القومي', 'اسم الطالب رباعي', 'النوع', 'الكلية', 'التخصص / الشعبة', 'الفرقة الدراسية', 'الموقف الحالي']
      ];
      list.forEach((s, idx) => {
        sheetData.push([
          idx + 1,
          s.code || '',
          s.nationalId || '',
          s.name || '',
          s.gender === 'male' ? 'ذكر' : 'أنثى',
          s.college || '',
          s.specialization || s.college || '',
          s.year || '',
          'لم يدخل أي دورة بعد (مستهدف جديد)'
        ]);
      });
    } else if (reportType === 'passedStudents') {
      const list = filteredStudents.filter(s => s.status === 'pass');
      filename = `كشف_الطلاب_الحاصلين_على_التربية_العسكرية_${list.length}_طالب.xlsx`;
      sheetData = [
        ['جامعة اللوتس بالمنيا - إدارة التربية العسكرية'],
        [`كشف الطلاب الحاصلين على دورة التربية العسكرية (اجتياز بنجاح) ${filterDesc ? `- الفلاتر: ${filterDesc}` : ''}`],
        [],
        ['م', 'كود الطالب', 'الرقم القومي', 'اسم الطالب رباعي', 'النوع', 'الكلية', 'التخصص / الشعبة', 'الفرقة الدراسية', 'الدورة المقيد بها / المنجزة']
      ];
      list.forEach((s, idx) => {
        const courseInfo = getCleanCourseAndGrade(s);
        sheetData.push([
          idx + 1,
          s.code || '',
          s.nationalId || '',
          s.name || '',
          s.gender === 'male' ? 'ذكر' : 'أنثى',
          s.college || '',
          s.specialization || s.college || '',
          s.year || '',
          courseInfo.plainText
        ]);
      });
    } else if (reportType === 'failedStudents') {
      const list = filteredStudents.filter(s => s.status === 'fail');
      filename = `كشف_الطلاب_غير_الحاصلين_على_التربية_العسكرية_${list.length}_طالب.xlsx`;
      sheetData = [
        ['جامعة اللوتس بالمنيا - إدارة التربية العسكرية'],
        [`كشف الطلاب غير الحاصلين على دورة التربية العسكرية (لم يجتازوا - باقون للإعادة) ${filterDesc ? `- الفلاتر: ${filterDesc}` : ''}`],
        [],
        ['م', 'كود الطالب', 'الرقم القومي', 'اسم الطالب رباعي', 'النوع', 'الكلية', 'التخصص / الشعبة', 'الفرقة الدراسية', 'الموقف / الدورة']
      ];
      list.forEach((s, idx) => {
        const courseInfo = getCleanCourseAndGrade(s);
        sheetData.push([
          idx + 1,
          s.code || '',
          s.nationalId || '',
          s.name || '',
          s.gender === 'male' ? 'ذكر' : 'أنثى',
          s.college || '',
          s.specialization || s.college || '',
          s.year || '',
          courseInfo.course ? `${courseInfo.course} (باقٍ للإعادة)` : 'غير حاصل (لم يجتز)'
        ]);
      });
    } else if (reportType === 'collegeSummary') {
      const selectedCollege = document.getElementById('reportCollegeFilter')?.value || '';
      const collegesToProcess = selectedCollege ? [selectedCollege] : LOTUS_COLLEGES;

      filename = 'الموقف_الإحصائي_المجمع_لكليات_جامعة_اللوتس.xlsx';
      sheetData = [
        ['جامعة اللوتس بالمنيا - إدارة التربية العسكرية'],
        [`تقرير الموقف الإحصائي المجمع لكليات جامعة اللوتس ${filterDesc ? `- الفلاتر: ${filterDesc}` : ''}`],
        [],
        ['م', 'الكلية', 'إجمالي الطلاب', 'ذكور', 'إناث', 'حاصلين (اجتاز)', 'لم يجتازوا (راسب)', 'لم يدخلوا بعد']
      ];
      let eTot = 0, eM = 0, eF = 0, eP = 0, eFl = 0, eNa = 0;
      collegesToProcess.forEach((col, idx) => {
        const list = filteredStudents.filter(s => s.college === col || normalizeCollegeName(s.college) === normalizeCollegeName(col));
        const males = list.filter(s => s.gender === 'male').length;
        const females = list.filter(s => s.gender === 'female').length;
        const pass = list.filter(s => s.status === 'pass').length;
        const fail = list.filter(s => s.status === 'fail').length;
        const notAtt = list.filter(s => s.status === 'not_attended').length;
        eTot += list.length; eM += males; eF += females; eP += pass; eFl += fail; eNa += notAtt;
        sheetData.push([idx + 1, col, list.length, males, females, pass, fail, notAtt]);
      });
      sheetData.push([]);
      sheetData.push(['', 'الإجمــــــــــــــــــــــــالي العــــــــام', eTot, eM, eF, eP, eFl, eNa]);
    } else {
      const list = filteredStudents;
      filename = `بيانات_جميع_طلاب_جامعة_اللوتس_${list.length}_طالب.xlsx`;
      sheetData = [
        ['كود الطالب', 'الرقم القومي', 'اسم الطالب', 'النوع', 'الكلية', 'التخصص / الشعبة', 'الفرقة', 'العام الدراسي', 'الموقف', 'الدورة المقيد بها / المنجزة']
      ];
      list.forEach(s => {
        const courseInfo = getCleanCourseAndGrade(s);
        sheetData.push([
          s.code || '',
          s.nationalId || '',
          s.name || '',
          s.gender === 'male' ? 'ذكر' : 'أنثى',
          s.college || '',
          s.specialization || s.college || '',
          s.year || '',
          s.academicYear || '',
          s.status === 'pass' ? 'حاصل (اجتاز)' : s.status === 'fail' ? 'غير حاصل (لم يجتز)' : 'لم يدخل أي دورة بعد',
          courseInfo.plainText
        ]);
      });
    }
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!views'] = [{ rightToLeft: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'التقرير');
  XLSX.writeFile(wb, filename);
}

// ============================================================================
// رفع ومعالجة ملفات الإكسيل (Bulk Upload & Verification Engine)
// ============================================================================
function handleFileUpload(file, uploadType) {
  if (!file) return;
  if (typeof XLSX === 'undefined') {
    showToast('مكتبة معالجة ملفات الإكسيل غير محملة', 'error');
    return;
  }

  AppState.pendingUpload.type = uploadType;
  AppState.pendingUpload.fileName = file.name;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // الكشف التلقائي عن سطر العناوين في حال وجود أسطر فارغة أو ترويسات في أعلى الملف
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      let headerRowIndex = -1;
      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const rowStr = (rawRows[r] || []).map(c => normalizeKey(String(c))).join(' ');
        if (rowStr.includes('القومي') || rowStr.includes('قومي') || 
            rowStr.includes('اسمالطالب') || rowStr.includes('الاسم') || 
            rowStr.includes('كود') || rowStr.includes('الكليه') || 
            rowStr.includes('النتيجه') || rowStr.includes('ناجح') || 
            rowStr.includes('الدوره') || rowStr.includes('nationalid')) {
          headerRowIndex = r;
          break;
        }
      }

      let jsonRows;
      if (headerRowIndex > 0) {
        jsonRows = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });
      } else {
        jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      }

      if (!jsonRows || jsonRows.length === 0) {
        showToast('الملف المرفوع فارغ ولا يحتوي على صفوف بيانات!', 'warning');
        return;
      }

      validateAndPreviewUploadedRows(jsonRows, uploadType);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء قراءة ملف الإكسيل. تأكد من سلامة تنسيق الملف.', 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function normalizeKey(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[إأآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\s_\-\(\)\/\\.]+/g, '');
}

function normalizeColumnKeys(row) {
  const normalized = {};
  for (const [k, v] of Object.entries(row)) {
    const key = normalizeKey(k);
    normalized[key] = typeof v === 'string' ? v.trim() : v;
  }
  return normalized;
}

function validateAndPreviewUploadedRows(rows, uploadType) {
  const valid = [];
  const invalid = [];

  rows.forEach((row, idx) => {
    const norm = normalizeColumnKeys(row);

    // 1. استخراج المعرفات الأساسية (الرقم القومي وكود الطالب) بعد التنظيف الكامل
    const rawNid = norm['الرقمالقومي'] || norm['رقمقومي'] || norm['القومي'] || norm['الرقمالوطني'] || norm['nationalid'] || norm['nid'] || '';
    const nationalId = cleanNationalId(rawNid);

    const rawCode = norm['كودالطالب'] || norm['كود'] || norm['الكود'] || norm['الرقمالجامعي'] || norm['رقمجلوس'] || norm['code'] || norm['id'] || '';
    const code = cleanStudentCode(rawCode);

    const name = String(norm['الاسمبالكامل'] || norm['اسمالطالببالكامل'] || norm['اسمالطالب'] || norm['اسم'] || norm['الاسم'] || norm['إسمالطالب'] || norm['name'] || '').trim();

    // التحقق من وجود معرف أساسي أو اسم
    if (!nationalId && !code && !name) {
      invalid.push({ rowNumber: idx + 2, reason: 'صف فارغ أو ينقصه الاسم والرقم القومي والكود', rowData: row });
      return;
    }

    // 2. فحص هل الطالب موجود مسبقاً في قاعدة بيانات النظام
    let matchedStudent = null;
    let matchedIndex = -1;

    if (nationalId && nationalId.length >= 10) {
      matchedIndex = AppState.students.findIndex(s => cleanNationalId(s.nationalId) === nationalId);
    }
    if (matchedIndex === -1 && code) {
      matchedIndex = AppState.students.findIndex(s => cleanStudentCode(s.code) === code);
    }
    if (matchedIndex === -1 && name && name.length >= 6) {
      const normName = normalizeKey(name);
      matchedIndex = AppState.students.findIndex(s => normalizeKey(s.name) === normName);
    }

    if (matchedIndex >= 0) {
      matchedStudent = AppState.students[matchedIndex];
    }

    // 3. استخراج النوع (Gender)
    let gender = 'male';
    const genderRaw = String(norm['النوع'] || norm['الجنس'] || norm['النوعالمجموعه'] || norm['gender'] || '').toLowerCase();
    if (genderRaw.includes('انثى') || genderRaw.includes('أنثى') || genderRaw.includes('بنات') || genderRaw === 'female') {
      gender = 'female';
    } else if (genderRaw.includes('ذكر') || genderRaw.includes('بنين') || genderRaw === 'male') {
      gender = 'male';
    } else if (nationalId && nationalId.length === 14) {
      const parsed = parseEgyptianNationalId(nationalId);
      if (parsed.isValid) gender = parsed.gender;
    } else if (matchedStudent) {
      gender = matchedStudent.gender;
    }

    // 4. استخراج الكلية والفرقة والتخصص والهاتف
    const collegeRaw = norm['الكليه'] || norm['الكلية'] || norm['كليه'] || norm['كلية'] || norm['تخصصرئيسي'] || norm['التخصص'] || norm['college'] || '';
    const specRaw = norm['تخصصرئيسي'] || norm['التخصص'] || norm['الشعبه'] || norm['الشعبة'] || '';
    const yearRaw = norm['الفرقه'] || norm['الفرقة'] || norm['الفرقهالدراسيه'] || norm['السنه'] || norm['السنة'] || norm['level'] || norm['year'] || '';
    const academicYear = norm['العامالدراسي'] || norm['العامالجامعي'] || norm['العام'] || norm['academicyear'] || '2024/2025';
    const phone = String(norm['رقمالهاتف'] || norm['الهاتف'] || norm['الموبايل'] || norm['phone'] || norm['mobile'] || '').trim();

    let college = normalizeCollegeName(collegeRaw || specRaw);
    if (!college && matchedStudent) college = matchedStudent.college;
    if (!college) college = 'كلية التمريض';

    let year = normalizeYearName(yearRaw);
    if (!year && matchedStudent) year = matchedStudent.year;
    if (!year) year = 'السنة الاولى';

    let specialization = specRaw ? String(specRaw).trim() : (matchedStudent ? matchedStudent.specialization : college);

    // 5. استخراج بيانات الدورة والنتيجة وتاريخها
    let courseName = String(norm['اسمالدوره'] || norm['إسمالدوره'] || norm['اسمالدورة'] || norm['إسمالدورة'] || norm['الدوره'] || norm['الدورة'] || norm['رقمالدوره'] || norm['رقمالدورة'] || norm['course'] || '').trim();
    if (courseName && /^\d+$/.test(courseName)) {
      courseName = `دورة ${courseName}`;
    }

    const startDate = cleanDateStr(norm['تاريخبدءالدوره'] || norm['تاريخبدءالدورة'] || norm['تاريخالبدء'] || norm['تاريخالبدايه'] || norm['startdate'] || '');
    const endDate = cleanDateStr(norm['تاريخاتمامالدوره'] || norm['تاريخاتمامالدورة'] || norm['تاريخالانتهاء'] || norm['تاريخالنهايه'] || norm['enddate'] || '');
    let grade = String(norm['التقدير'] || norm['الدرجه'] || norm['grade'] || '').trim();

    // فحص النتيجة (ناجح / راسب / حاصل / غياب)
    let hasResult = false;
    let rowStatus = 'not_attended';

    const najahCol = String(norm['الناجح'] || norm['ناجح'] || '').toLowerCase().trim();
    const rasebCol = String(norm['راسب'] || '').toLowerCase().trim();
    const gheyabCol = String(norm['غياب'] || '').toLowerCase().trim();
    const statusRaw = String(norm['النتيجه'] || norm['النتيجة'] || norm['موقفالتربيهالعسكريه'] || norm['موقفالتربيةالعسكرية'] || norm['الموقف'] || norm['حالةالنجاح'] || norm['status'] || '').toLowerCase().trim();

    if (najahCol.includes('اجتاز') || najahCol === 'true' || najahCol === '1' || najahCol === 'نعم' || najahCol === 'ناجح') {
      rowStatus = 'pass';
      hasResult = true;
    } else if (najahCol.includes('لم يجتز') || rasebCol === 'true' || gheyabCol === 'true' || rasebCol === '1' || gheyabCol === '1' || rasebCol === 'نعم' || gheyabCol === 'نعم') {
      rowStatus = 'fail';
      hasResult = true;
    } else if (statusRaw.includes('ناجح') || statusRaw.includes('حاصل') || statusRaw.includes('اجتاز') || statusRaw.includes('معفى') || statusRaw.includes('اعفاء') || statusRaw.includes('pass')) {
      rowStatus = 'pass';
      hasResult = true;
    } else if (statusRaw.includes('راسب') || statusRaw.includes('غير حاصل') || statusRaw.includes('لم يجتز') || statusRaw.includes('fail') || statusRaw.includes('غياب') || statusRaw.includes('باق')) {
      rowStatus = 'fail';
      hasResult = true;
    } else if (grade) {
      const gLow = grade.toLowerCase();
      if (gLow.includes('امتياز') || gLow.includes('جيد') || gLow.includes('مقبول') || gLow.includes('اجتياز') || gLow.includes('معفى')) {
        rowStatus = 'pass';
        hasResult = true;
      } else if (gLow.includes('راسب') || gLow.includes('غياب') || gLow.includes('لم يجتز')) {
        rowStatus = 'fail';
        hasResult = true;
      }
    } else if (courseName) {
      // ملف دورة يتضمن أسماء المشاركين دون تحديد رسوب
      if (courseName.includes('اعفاء')) {
        rowStatus = 'pass';
        grade = grade || 'معفى';
        hasResult = true;
      } else {
        rowStatus = 'pass';
        hasResult = true;
      }
    }

    if (hasResult && !grade) {
      grade = rowStatus === 'pass' ? `اجتياز (${courseName || 'الدورة'})` : 'راسب';
    }

    valid.push({
      rowNumber: idx + 2,
      nationalId: nationalId || (matchedStudent ? matchedStudent.nationalId : ''),
      code: code || (matchedStudent ? matchedStudent.code : ''),
      name: name || (matchedStudent ? matchedStudent.name : 'طالب مسجل'),
      gender,
      college,
      specialization,
      year,
      academicYear,
      phone: phone || (matchedStudent ? matchedStudent.phone : ''),
      status: hasResult ? rowStatus : (matchedStudent ? matchedStudent.status : 'not_attended'),
      hasResult,
      course: courseName || (matchedStudent ? matchedStudent.course : ''),
      grade: grade || (matchedStudent ? matchedStudent.grade : ''),
      startDate: startDate || (matchedStudent ? matchedStudent.startDate : ''),
      endDate: endDate || (matchedStudent ? matchedStudent.endDate : ''),
      isExisting: !!matchedStudent,
      matchedIndex,
      matchedStudentName: matchedStudent ? matchedStudent.name : ''
    });
  });

  AppState.pendingUpload.validRows = valid;
  AppState.pendingUpload.invalidRows = invalid;
  AppState.pendingUpload.duplicateRows = [];

  showUploadPreviewModal(uploadType);
}

function showUploadPreviewModal(uploadType) {
  const modal = document.getElementById('uploadPreviewModal');
  const valid = AppState.pendingUpload.validRows || [];
  const invalid = AppState.pendingUpload.invalidRows || [];

  const existingCount = valid.filter(r => r.isExisting).length;
  const newCount = valid.filter(r => !r.isExisting).length;
  const totalAfter = AppState.students.length + newCount;

  document.getElementById('uploadStatsSummary').innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
      <div class="metric-card success" style="padding: 12px;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">إجمالي صفوف الملف الصالحة</div>
          <div style="font-size: 1.4rem; font-weight:800; color: var(--success-text);">${valid.length.toLocaleString('ar-EG')} صف</div>
        </div>
      </div>
      <div class="metric-card gold" style="padding: 12px;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">تعديل وتحديث (نفس الرقم القومي)</div>
          <div style="font-size: 1.4rem; font-weight:800; color: var(--gold-light);">${existingCount.toLocaleString('ar-EG')} طالب</div>
        </div>
      </div>
      <div class="metric-card info" style="padding: 12px;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">إضافة جديد (رقم قومي جديد)</div>
          <div style="font-size: 1.4rem; font-weight:800; color: var(--info-text);">${newCount.toLocaleString('ar-EG')} طالب</div>
        </div>
      </div>
      <div class="metric-card" style="padding: 12px; border: 1.5px solid var(--primary); background: var(--bg-alt);">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">إجمالي الطلاب بالنظام بعد الحفظ</div>
          <div style="font-size: 1.4rem; font-weight:800; color: var(--primary);">${totalAfter.toLocaleString('ar-EG')} طالب</div>
        </div>
      </div>
    </div>
  `;

  // معاينة العناوين والصفوف
  const thead = document.getElementById('uploadPreviewTableHead');
  if (thead) {
    thead.innerHTML = `
      <tr>
        <th>#</th>
        <th>الرقم القومي</th>
        <th>كود الطالب</th>
        <th>اسم الطالب</th>
        <th>الكلية</th>
        <th>الدورة / التقدير</th>
        <th>النتيجة</th>
        <th>الإجراء الذكي بالرقم القومي</th>
      </tr>
    `;
  }

  const tbody = document.getElementById('uploadPreviewTableBody');
  const sampleRows = valid.slice(0, 12);

  tbody.innerHTML = sampleRows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(r.nationalId || '-')}</strong></td>
      <td><span class="code-pill">${escapeHtml(r.code || '-')}</span></td>
      <td><strong>${escapeHtml(r.name || r.matchedStudentName || 'طالب مسجل')}</strong></td>
      <td>${escapeHtml(r.college || '-')}</td>
      <td><span style="font-size:0.8rem; font-weight:700;">${escapeHtml(r.course || r.grade || '-')}</span></td>
      <td>
        <span class="badge-status ${r.status === 'pass' ? 'pass' : (r.status === 'fail' ? 'fail' : 'not-attended')}">
          ${r.status === 'pass' ? 'حاصل (اجتياز)' : (r.status === 'fail' ? 'غير حاصل (لم يجتز)' : 'لم يدخل بعد')}
        </span>
      </td>
      <td>
        ${r.isExisting 
          ? '<span class="badge-status gold" style="font-size: 0.75rem;"><i class="fas fa-edit"></i> تعديل النتيجة (نفس الرقم القومي)</span>' 
          : '<span class="badge-status pass" style="font-size: 0.75rem;"><i class="fas fa-user-plus"></i> إضافة طالب جديد للقاعدة</span>'}
      </td>
    </tr>
  `).join('');

  modal.classList.add('active');
}

async function commitPendingUpload() {
  const valid = AppState.pendingUpload.validRows;

  if (!valid || valid.length === 0) {
    showToast('لا توجد صفوف صالحة للحفظ!', 'warning');
    return;
  }

  const btn = document.getElementById('btnConfirmUpload');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التعديل والحفظ في السحابة...';

  try {
    let updatedCount = 0;
    let addedCount = 0;

    valid.forEach(row => {
      let matchedIndex = -1;

      // 1. المطابقة الذكية بالرقم القومي أولاً
      if (row.nationalId && row.nationalId.length >= 10) {
        matchedIndex = AppState.students.findIndex(s => cleanNationalId(s.nationalId) === row.nationalId);
      }
      // 2. المطابقة بكود الطالب كخيار بديل
      if (matchedIndex === -1 && row.code) {
        matchedIndex = AppState.students.findIndex(s => cleanStudentCode(s.code) === row.code);
      }
      // 3. المطابقة بالاسم
      if (matchedIndex === -1 && row.name && row.name.length >= 6) {
        const normName = normalizeKey(row.name);
        matchedIndex = AppState.students.findIndex(s => normalizeKey(s.name) === normName);
      }

      if (matchedIndex >= 0) {
        // تعديل بيانات ونتيجة الطالب الموجود مسبقاً دون حذف أي بيانات قديمة
        const prev = AppState.students[matchedIndex];
        AppState.students[matchedIndex] = {
          ...prev,
          name: row.name || prev.name,
          code: row.code || prev.code,
          nationalId: row.nationalId || prev.nationalId,
          gender: row.gender || prev.gender,
          college: (row.college && row.college !== 'كلية التمريض' ? row.college : prev.college) || prev.college,
          specialization: row.specialization || prev.specialization,
          year: row.year || prev.year,
          academicYear: row.academicYear || prev.academicYear,
          phone: row.phone || prev.phone,
          status: row.hasResult ? row.status : prev.status,
          statusLabel: row.hasResult ? (row.status === 'pass' ? 'حاصل (اجتاز)' : 'غير حاصل (لم يجتز)') : (prev.statusLabel || (prev.status === 'pass' ? 'حاصل (اجتاز)' : 'لم يدخل')),
          course: (row.hasResult && row.course) ? row.course : prev.course,
          grade: (row.hasResult && row.grade) ? row.grade : (row.hasResult && row.status === 'pass' ? `اجتياز (${row.course || 'الدورة'})` : prev.grade),
          startDate: (row.hasResult && row.startDate) ? row.startDate : (prev.startDate || ''),
          endDate: (row.hasResult && row.endDate) ? row.endDate : (prev.endDate || '')
        };
        updatedCount++;
      } else {
        // إضافة طالب جديد برقم قومي جديد دون حذف أي طالب من الطلاب السابقين
        AppState.students.push({
          code: row.code || `2024${String(AppState.students.length + 1).padStart(4, '0')}`,
          nationalId: row.nationalId,
          name: row.name || `طالب مقيد جديد`,
          gender: row.gender || 'male',
          college: row.college || 'كلية التمريض',
          specialization: row.specialization || row.college || 'عام',
          year: row.year || 'السنة الاولى',
          academicYear: row.academicYear || '2024/2025',
          phone: row.phone || '',
          status: row.hasResult ? row.status : (row.status || 'not_attended'),
          statusLabel: row.hasResult ? (row.status === 'pass' ? 'حاصل (اجتاز)' : 'غير حاصل (لم يجتز)') : 'لم يدخل بعد',
          course: row.course || '',
          grade: row.grade || (row.status === 'pass' ? `اجتياز (${row.course || 'الدورة'})` : (row.status === 'fail' ? 'راسب' : '')),
          startDate: row.startDate || '',
          endDate: row.endDate || ''
        });
        addedCount++;
      }
    });

    logAuditAction('استيراد وتحديث إكسيل', `تم بالرقم القومي تعديل ${updatedCount} طالب وإضافة ${addedCount} طالب جديد من ملف ${AppState.pendingUpload.fileName} (إجمالي النظام: ${AppState.students.length})`);
    saveLocalState();
    await syncAllToFirebase();

    showToast(`تم الحفظ بنجاح! تم تعديل وتحديث بيانات ${updatedCount.toLocaleString('ar-EG')} طالب، وإضافة ${addedCount.toLocaleString('ar-EG')} طالب جديد، وإجمالي النظام الآن: ${AppState.students.length.toLocaleString('ar-EG')} طالب محفوظين بالكامل.`, 'success');
    closeModal('uploadPreviewModal');
    refreshAllViews();
  } catch (err) {
    console.error(err);
    showToast('حدث خطأ أثناء حفظ البيانات في Firebase', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> تأكيد الحفظ والاعتماد';
  }
}

// ============================================================================
// إدارة الطلاب يدوياً (Manual Add & Edit Student)
// ============================================================================
function openAddStudentModal() {
  document.getElementById('studentModalTitle').textContent = 'إضافة طالب جديد';
  document.getElementById('studentForm').reset();
  document.getElementById('editStudentOriginalKey').value = '';
  document.getElementById('studentModal').classList.add('active');
}

function openEditStudentModal(identifier) {
  const cleanId = cleanNationalId(identifier);
  const cleanCd = cleanStudentCode(identifier);

  const s = AppState.students.find(st => 
    (cleanId && cleanNationalId(st.nationalId) === cleanId) ||
    (cleanCd && cleanStudentCode(st.code) === cleanCd) ||
    st.nationalId === identifier || 
    st.code === identifier
  );
  if (!s) {
    showToast('لم يتم العثور على سجل الطالب المطلوب تعديله', 'error');
    return;
  }

  document.getElementById('studentModalTitle').textContent = 'تعديل بيانات الطالب';
  document.getElementById('editStudentOriginalKey').value = s.nationalId || s.code || identifier;

  document.getElementById('formStudentName').value = s.name || '';
  document.getElementById('formStudentNationalId').value = s.nationalId || '';
  document.getElementById('formStudentCode').value = s.code || '';
  document.getElementById('formStudentGender').value = s.gender || 'male';
  
  // ضبط الكلية والفرقة باستخدام التنسيق المعياري لكليات جامعة اللوتس
  const normCol = normalizeCollegeName(s.college);
  document.getElementById('formStudentCollege').value = normCol || s.college || 'كلية التمريض';
  
  document.getElementById('formStudentSpecialization').value = s.specialization || '';
  document.getElementById('formStudentYear').value = normalizeYearName(s.year);
  document.getElementById('formStudentAcademicYear').value = s.academicYear || '2024/2025';
  document.getElementById('formStudentPhone').value = s.phone || '';
  document.getElementById('formStudentStatus').value = s.status || 'not_attended';
  document.getElementById('formStudentCourse').value = s.course || '';
  document.getElementById('formStudentGrade').value = s.grade || '';

  document.getElementById('studentModal').classList.add('active');
}

function handleSaveStudentForm(e) {
  e.preventDefault();

  const originalKey = document.getElementById('editStudentOriginalKey').value.trim();
  const name = document.getElementById('formStudentName').value.trim();
  const rawNid = document.getElementById('formStudentNationalId').value.trim();
  const nationalId = cleanNationalId(rawNid);
  const rawCode = document.getElementById('formStudentCode').value.trim();
  const code = cleanStudentCode(rawCode);
  const gender = document.getElementById('formStudentGender').value;
  const rawCollege = document.getElementById('formStudentCollege').value;
  const college = normalizeCollegeName(rawCollege) || 'كلية التمريض';
  const specialization = document.getElementById('formStudentSpecialization').value.trim() || college;
  const rawYear = document.getElementById('formStudentYear').value;
  const year = normalizeYearName(rawYear);
  const academicYear = document.getElementById('formStudentAcademicYear').value.trim() || '2024/2025';
  const phone = document.getElementById('formStudentPhone').value.trim();
  const status = document.getElementById('formStudentStatus').value; // 'pass', 'fail', 'not_attended'
  let course = document.getElementById('formStudentCourse').value.trim();
  let grade = document.getElementById('formStudentGrade').value.trim();

  if (!name || (!nationalId && !code)) {
    showToast('يرجى إدخال اسم الطالب وتوفير الرقم القومي أو كود الطالب على الأقل', 'warning');
    return;
  }

  if (nationalId) {
    const nidCheck = parseEgyptianNationalId(nationalId);
    if (!nidCheck.isValid) {
      showToast(`تنبيه في الرقم القومي: ${nidCheck.error}`, 'error');
      return;
    }
  }

  // ضبط التقدير والدورة تلقائياً حسب الحالة إذا تُركت فارغة
  if (status === 'pass') {
    if (!course) course = 'دورة التربية العسكرية';
    if (!grade) grade = 'اجتياز';
  } else if (status === 'fail') {
    if (!course) course = 'دورة التربية العسكرية';
    if (!grade) grade = 'راسب';
  } else {
    if (!course) course = 'لم يسجل بدورة حتى الآن';
    if (!grade) grade = 'لم يؤدِ بعد';
  }

  const statusLabel = status === 'pass' 
    ? 'حاصل (اجتاز)' 
    : (status === 'fail' ? 'غير حاصل (لم يجتز)' : 'لم يدخل بعد');

  if (originalKey) {
    // تعديل طالب حالي: مطابقة ذكية بالرقم القومي أو الكود
    const cleanOrigKey = cleanNationalId(originalKey);
    const cleanOrigCode = cleanStudentCode(originalKey);
    
    let idx = AppState.students.findIndex(s => 
      (cleanOrigKey && cleanNationalId(s.nationalId) === cleanOrigKey) ||
      (cleanOrigCode && cleanStudentCode(s.code) === cleanOrigCode) ||
      s.nationalId === originalKey ||
      s.code === originalKey
    );

    // فحص إضافي بالرقم القومي الجديد إن وُجد
    if (idx === -1 && nationalId) {
      idx = AppState.students.findIndex(s => cleanNationalId(s.nationalId) === nationalId);
    }

    if (idx >= 0) {
      const prev = AppState.students[idx];
      const updatedStudent = {
        ...prev,
        code: code || prev.code || `2024${String(idx + 1).padStart(4, '0')}`,
        nationalId: nationalId || prev.nationalId,
        name,
        gender,
        college,
        specialization,
        course,
        year,
        academicYear,
        phone,
        status,
        statusLabel,
        grade
      };

      AppState.students[idx] = updatedStudent;
      logAuditAction('تعديل طالب', `تعديل بيانات ونتيجة الطالب: ${name} (${updatedStudent.code || updatedStudent.nationalId}) - الموقف: ${statusLabel}`);
      
      // حفظ فوري في التخزين المحلي والسحابي
      saveLocalState();
      pushStudentToFirebase(updatedStudent);

      showToast(`تم تعديل بيانات الطالب "${name}" بنجاح وتحديث كافة الإحصائيات والتقارير فورياً`, 'success');
    } else {
      showToast('تعذر العثور على سجل الطالب للتعديل', 'error');
      return;
    }
  } else {
    // إضافة طالب جديد
    const exists = AppState.students.some(s => 
      (nationalId && cleanNationalId(s.nationalId) === nationalId) || 
      (code && cleanStudentCode(s.code) === code)
    );
    if (exists) {
      showToast('الرقم القومي أو كود الطالب مسجل بالفعل مسبقاً!', 'error');
      return;
    }

    const newStudent = {
      code: code || `2024${String(AppState.students.length + 1).padStart(4, '0')}`,
      nationalId,
      name,
      gender,
      college,
      specialization,
      course,
      year,
      academicYear,
      phone,
      status,
      statusLabel,
      grade,
      startDate: '',
      endDate: ''
    };

    AppState.students.unshift(newStudent);
    logAuditAction('إضافة طالب', `إضافة طالب جديد: ${name} (${newStudent.code || newStudent.nationalId})`);
    
    saveLocalState();
    pushStudentToFirebase(newStudent);

    showToast(`تمت إضافة الطالب "${name}" بنجاح وتحديث كافة الإحصائيات`, 'success');
  }

  closeModal('studentModal');

  // تحديث فوري لكافة المؤشرات والجداول والتقارير في جميع الشاشات
  refreshAllViews();
}

function confirmDeleteStudent(identifier) {
  const cleanId = cleanNationalId(identifier);
  const cleanCd = cleanStudentCode(identifier);

  const s = AppState.students.find(st => 
    (cleanId && cleanNationalId(st.nationalId) === cleanId) ||
    (cleanCd && cleanStudentCode(st.code) === cleanCd) ||
    st.nationalId === identifier || 
    st.code === identifier
  );
  if (!s) return;

  if (confirm(`هل أنت متأكد تماماً من حذف بيانات الطالب:\n${s.name} (${s.code || s.nationalId})؟`)) {
    AppState.students = AppState.students.filter(st => 
      cleanNationalId(st.nationalId) !== cleanId && 
      cleanStudentCode(st.code) !== cleanCd &&
      st.nationalId !== identifier && 
      st.code !== identifier
    );
    removeStudentFromFirebase(identifier);
    logAuditAction('حذف طالب', `حذف الطالب: ${s.name} (${identifier})`);
    saveLocalState();
    showToast('تم حذف الطالب بنجاح وتحديث الإحصائيات فوراً', 'info');
    refreshAllViews();
  }
}

// ============================================================================
// إدارة الموظفين وسجل العمليات (Staff Management & Audit Trail)
// ============================================================================
function renderStaffManagement() {
  const tbody = document.getElementById('staffTableBody');
  if (!tbody) return;

  tbody.innerHTML = AppState.staffUsers.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(u.name || '-')}</strong></td>
      <td><span class="code-pill">${escapeHtml(u.username || '-')}</span></td>
      <td>
        <span class="badge-status ${u.active ? 'pass' : 'fail'}">
          ${u.active ? 'نشط ومصرح له' : 'معطل مؤقتاً'}
        </span>
      </td>
      <td>
        <div style="display:flex; gap: 6px;">
          <button class="btn btn-outline btn-sm" onclick="toggleStaffStatus('${u.id}')">
            ${u.active ? 'إيقاف الحساب' : 'تفعيل الحساب'}
          </button>
          <button class="btn btn-outline btn-sm" onclick="resetStaffPassword('${u.id}')">
            إعادة تعيين كلمة المرور
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function handleAddStaffUser(username, name, password) {
  if (!username || !password) {
    showToast('يرجى ملء اسم المستخدم وكلمة المرور للموظف', 'warning');
    return;
  }

  const exists = AppState.staffUsers.some(u => u.username === username);
  if (exists) {
    showToast('اسم المستخدم هذا محجوز مسبقاً!', 'error');
    return;
  }

  const newStaff = {
    id: `staff_${Date.now()}`,
    username,
    name: name || username,
    password,
    role: 'staff',
    active: true,
    createdAt: new Date().toISOString().split('T')[0]
  };

  AppState.staffUsers.push(newStaff);
  saveLocalState();
  if (AppState.isOnline) {
    fetch(`${DB_BASE_URL}/users/${newStaff.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff)
    }).catch(e => console.warn(e));
  }

  logAuditAction('إضافة موظف', `إنشاء حساب موظف جديد: ${name} (${username})`);
  showToast('تم إنشاء حساب الموظف بنجاح', 'success');
  renderStaffManagement();
}

function toggleStaffStatus(staffId) {
  const staff = AppState.staffUsers.find(u => u.id === staffId);
  if (!staff) return;

  staff.active = !staff.active;
  saveLocalState();
  logAuditAction('تعديل حالة موظف', `${staff.active ? 'تفعيل' : 'إيقاف'} حساب الموظف: ${staff.name}`);
  showToast(`تم ${staff.active ? 'تفعيل' : 'إيقاف'} حساب الموظف بنجاح`, 'info');
  renderStaffManagement();
}

function resetStaffPassword(staffId) {
  const staff = AppState.staffUsers.find(u => u.id === staffId);
  if (!staff) return;

  const newPass = prompt(`أدخل كلمة المرور الجديدة للموظف (${staff.name}):`, '123456');
  if (newPass) {
    staff.password = newPass;
    saveLocalState();
    logAuditAction('تغيير كلمة مرور موظف', `تغيير كلمة المرور للموظف: ${staff.name}`);
    showToast('تم تغيير كلمة المرور بنجاح', 'success');
  }
}

function renderAuditLogs() {
  const tbody = document.getElementById('auditLogsTableBody');
  if (!tbody) return;

  if (AppState.auditLogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">لا توجد عمليات مسجلة حتى الآن</td></tr>';
    return;
  }

  tbody.innerHTML = AppState.auditLogs.slice(0, 50).map((l, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="font-family: monospace; font-size: 0.82rem;">${escapeHtml(l.timestamp)}</td>
      <td><strong>${escapeHtml(l.user)}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(${escapeHtml(l.role)})</span></td>
      <td><span class="code-pill">${escapeHtml(l.action)}</span></td>
      <td>${escapeHtml(l.details)}</td>
    </tr>
  `).join('');
}

// عمليات منطقة الخطر (Danger Zone)
async function handleDeleteAcademicYear() {
  const yearToDelete = prompt('أدخل العام الدراسي المطلوب حذفه بالكامل (مثال: 2024/2025):');
  if (!yearToDelete) return;

  const confirmText = prompt(`⚠️ تحذير شديد الأهمية!\nسيتم حذف جميع سجلات الطلاب للعام الدراسي (${yearToDelete}).\nللتأكيد، اكتب باللغة العربية: تأكيد الحذف`);
  if (confirmText === 'تأكيد الحذف') {
    const beforeCount = AppState.students.length;
    AppState.students = AppState.students.filter(s => s.academicYear !== yearToDelete);
    const deletedCount = beforeCount - AppState.students.length;

    saveLocalState();
    await syncAllToFirebase();
    logAuditAction('حذف دفعة عام دراسي', `تم حذف ${deletedCount} سجل للعام الدراسي ${yearToDelete}`);
    showToast(`تم حذف ${deletedCount} سجل دراسي بنجاح.`, 'info');
    refreshAllViews();
  } else {
    showToast('تم إلغاء عملية الحذف', 'info');
  }
}

async function handleResetFullDatabase() {
  const confirmText = prompt('🚨 تحذير بالغ الخطورة!\nسيتم مسح جميع بيانات الطلاب ونتائجهم نهائياً من النظام ومن السحابة.\nللتأكيد، اكتب بدقة: تأكيد الحذف الكلي');
  if (confirmText === 'تأكيد الحذف الكلي') {
    AppState.students = [];
    saveLocalState();
    if (AppState.isOnline) {
      await fetch(`${DB_BASE_URL}/students.json`, { method: 'DELETE' });
    }
    logAuditAction('تفريغ قاعدة البيانات', 'تم تفريغ كافة بيانات الطلاب بالكامل');
    showToast('تم تفريغ قاعدة البيانات بنجاح', 'info');
    refreshAllViews();
  } else {
    showToast('تم إلغاء تفريغ البيانات', 'info');
  }
}

function exportFullBackupJSON() {
  const backup = {
    exportedAt: new Date().toISOString(),
    system: 'نظام إدارة التربية العسكرية والتربية الوطنية - جامعة اللوتس بالمنيا',
    designer: 'م. بولس سمير',
    students: AppState.students,
    users: AppState.staffUsers,
    auditLogs: AppState.auditLogs
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `نسخة_احتياطية_تربية_عسكرية_اللوتس_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تنزيل النسخة الاحتياطية بنجاح!', 'success');
}

// ============================================================================
// أدوات المساعدة وإشعارات الواجهة (UI Helpers & Toast Notifications)
// ============================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';

  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
  if (modalId === 'cardDetailModal') {
    AppState.activeCardModal = null;
  }
}

// ============================================================================
// نافذة تفاصيل كروت الإحصائيات التفاعلية (Interactive Metric Cards Modal)
// ============================================================================
let currentCardModalStudents = [];
let currentCardModalFilteredStudents = [];
let currentCardModalTitle = 'تفاصيل وبيانات الكشف';
let currentCardModalSubtitle = 'كشف تفصيلي بالطلاب المسجلين';

function openCardModal(cardType, customTitle = '', customSubtitle = '') {
  AppState.activeCardModal = { cardType, customTitle, customSubtitle };
  let list = [];
  let defaultTitle = '';
  let defaultSubtitle = '';

  switch (cardType) {
    case 'all':
      list = [...AppState.students];
      defaultTitle = 'كشف إجمالي طلاب الكليات المقيدين بالجامعة';
      defaultSubtitle = 'بيان شامل بجميع الطلاب والطالبات المقيدين في كافة الكليات والفرق';
      break;

    case 'pass':
      list = AppState.students.filter(s => s.status === 'pass');
      defaultTitle = 'كشف الطلاب الحاصلين على دورة التربية العسكرية';
      defaultSubtitle = 'بيان بالطلاب الذين اجتازوا دورة التربية العسكرية بنجاح';
      break;

    case 'fail':
      list = AppState.students.filter(s => s.status === 'fail');
      defaultTitle = 'كشف الطلاب غير الحاصلين (راسب / غياب)';
      defaultSubtitle = 'بيان بالطلاب الذين دخلوا الدورة ولم يجتازوا وباقون للإعادة';
      break;

    case 'not_attended':
      list = AppState.students.filter(s => s.status === 'not_attended');
      defaultTitle = 'كشف الطلاب الذين لم يدخلوا أي دورة بعد';
      defaultSubtitle = 'بيان بالطلاب المستهدفين للتسجيل في الدورات القادمة';
      break;

    case 'male':
      list = AppState.students.filter(s => s.gender === 'male');
      defaultTitle = 'كشف إجمالي الطلبة الذكور المقيدين بالجامعة';
      defaultSubtitle = 'بيان بجميع الطلبة الذكور بمختلف الكليات والفرق الدراسية';
      break;

    case 'female':
      list = AppState.students.filter(s => s.gender === 'female');
      defaultTitle = 'كشف إجمالي الطالبات الإناث المقيدات بالجامعة';
      defaultSubtitle = 'بيان بجميع الطالبات الإناث بمختلف الكليات والفرق الدراسية';
      break;

    case 'male_pass':
      list = AppState.students.filter(s => s.gender === 'male' && s.status === 'pass');
      defaultTitle = 'كشف الطلبة الذكور الحاصلين (اجتازوا الدورة)';
      defaultSubtitle = 'بيان بالطلبة الذكور الناجحين في دورة التربية العسكرية';
      break;

    case 'male_fail':
      list = AppState.students.filter(s => s.gender === 'male' && s.status === 'fail');
      defaultTitle = 'كشف الطلبة الذكور غير الحاصلين (راسب / غياب)';
      defaultSubtitle = 'بيان بالطلبة الذكور الذين لم يجتازوا الدورة وباقون للإعادة';
      break;

    case 'male_not_attended':
      list = AppState.students.filter(s => s.gender === 'male' && s.status === 'not_attended');
      defaultTitle = 'كشف الطلبة الذكور الذين لم يدخلوا دورات بعد';
      defaultSubtitle = 'بيان بالطلبة الذكور المستهدفين للالتحاق بالدورات القادمة';
      break;

    case 'female_pass':
      list = AppState.students.filter(s => s.gender === 'female' && s.status === 'pass');
      defaultTitle = 'كشف الطالبات الإناث الحاصلات (اجتزن الدورة)';
      defaultSubtitle = 'بيان بالطالبات الإناث الناجحات في دورة التربية العسكرية';
      break;

    case 'female_fail':
      list = AppState.students.filter(s => s.gender === 'female' && s.status === 'fail');
      defaultTitle = 'كشف الطالبات الإناث غير الحاصلات (راسب / غياب)';
      defaultSubtitle = 'بيان بالطالبات الإناث اللاتي لم يجتزن الدورة وباقيات للإعادة';
      break;

    case 'female_not_attended':
      list = AppState.students.filter(s => s.gender === 'female' && s.status === 'not_attended');
      defaultTitle = 'كشف الطالبات الإناث اللاتي لم يدخلن دورات بعد';
      defaultSubtitle = 'بيان بالطالبات الإناث المستهدفات للالتحاق بالدورات القادمة';
      break;

    case 'college':
      list = AppState.students.filter(s => s.college === customTitle || normalizeCollegeName(s.college) === normalizeCollegeName(customTitle));
      defaultTitle = `كشف إجمالي طلاب ${customTitle}`;
      defaultSubtitle = `بيان شامل بكافة الطلاب والطالبات المقيدين في ${customTitle}`;
      break;

    case 'college_male':
      list = AppState.students.filter(s => (s.college === customTitle || normalizeCollegeName(s.college) === normalizeCollegeName(customTitle)) && s.gender === 'male');
      defaultTitle = `كشف الطلبة الذكور - ${customTitle}`;
      defaultSubtitle = `بيان بجميع الطلبة الذكور المقيدين في ${customTitle}`;
      break;

    case 'college_female':
      list = AppState.students.filter(s => (s.college === customTitle || normalizeCollegeName(s.college) === normalizeCollegeName(customTitle)) && s.gender === 'female');
      defaultTitle = `كشف الطالبات الإناث - ${customTitle}`;
      defaultSubtitle = `بيان بجميع الطالبات الإناث المقيدات في ${customTitle}`;
      break;

    case 'college_pass':
      list = AppState.students.filter(s => (s.college === customTitle || normalizeCollegeName(s.college) === normalizeCollegeName(customTitle)) && s.status === 'pass');
      defaultTitle = `كشف الطلاب الحاصلين (اجتازوا الدورة) - ${customTitle}`;
      defaultSubtitle = `بيان بالطلاب الناجحين في دورة التربية العسكرية بـ ${customTitle}`;
      break;

    case 'college_fail':
      list = AppState.students.filter(s => (s.college === customTitle || normalizeCollegeName(s.college) === normalizeCollegeName(customTitle)) && s.status === 'fail');
      defaultTitle = `كشف الطلاب غير الحاصلين (راسب / غياب) - ${customTitle}`;
      defaultSubtitle = `بيان بالطلاب الذين لم يجتازوا الدورة وباقون للإعادة بـ ${customTitle}`;
      break;

    case 'college_not_attended':
      list = AppState.students.filter(s => (s.college === customTitle || normalizeCollegeName(s.college) === normalizeCollegeName(customTitle)) && s.status === 'not_attended');
      defaultTitle = `كشف الطلاب الذين لم يدخلوا دورات بعد - ${customTitle}`;
      defaultSubtitle = `بيان بالطلاب المستهدفين للتسجيل في الدورات القادمة بـ ${customTitle}`;
      break;

    default:
      list = [...AppState.students];
      defaultTitle = 'كشف تفصيلي بالطلاب';
      defaultSubtitle = 'بيان تفصيلي ببيانات الطلاب';
  }

  currentCardModalStudents = list;
  currentCardModalTitle = (customTitle && !cardType.startsWith('college')) ? customTitle : defaultTitle;
  currentCardModalSubtitle = customSubtitle || defaultSubtitle;

  const titleEl = document.getElementById('cardModalTitle');
  if (titleEl) titleEl.textContent = currentCardModalTitle;
  const subEl = document.getElementById('cardModalSubtitle');
  if (subEl) subEl.textContent = currentCardModalSubtitle;

  const searchInput = document.getElementById('cardModalSearchInput');
  if (searchInput) searchInput.value = '';

  filterAndRenderCardModalTable('');

  openModal('cardDetailModal');
}

function filterAndRenderCardModalTable(query = '') {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    currentCardModalFilteredStudents = currentCardModalStudents;
  } else {
    currentCardModalFilteredStudents = currentCardModalStudents.filter(s => {
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.nationalId && s.nationalId.includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.college && s.college.toLowerCase().includes(q)) ||
        (s.specialization && s.specialization.toLowerCase().includes(q)) ||
        (s.year && s.year.toLowerCase().includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q))
      );
    });
  }

  const countBadge = document.getElementById('cardModalCountBadge');
  if (countBadge) {
    countBadge.textContent = `${currentCardModalFilteredStudents.length.toLocaleString('ar-EG')} طالب`;
  }
  const showingText = document.getElementById('cardModalShowingText');
  if (showingText) {
    showingText.textContent = `من أصل ${currentCardModalStudents.length.toLocaleString('ar-EG')} سجل في هذا الكشف`;
  }

  const tbody = document.getElementById('cardModalTableBody');
  if (!tbody) return;

  if (currentCardModalFilteredStudents.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 32px 16px; color: var(--text-muted);">
          <i class="fas fa-search" style="font-size: 1.8rem; margin-bottom: 8px; display: block; opacity: 0.4;"></i>
          لا توجد بيانات مطابقة لمعايير البحث داخل هذا الكشف
        </td>
      </tr>
    `;
    return;
  }

  const displayLimit = 500;
  const listToRender = currentCardModalFilteredStudents.slice(0, displayLimit);

  tbody.innerHTML = listToRender.map((s, idx) => {
    const isPass = s.status === 'pass';
    const isFail = s.status === 'fail';
    const statusBadge = isPass
      ? `<span class="badge-status pass"><i class="fas fa-check-circle"></i> حاصل</span>`
      : isFail
      ? `<span class="badge-status fail"><i class="fas fa-times-circle"></i> غير حاصل</span>`
      : `<span class="badge-status not-attended"><i class="fas fa-clock"></i> لم يدخل</span>`;

    const genderBadge = s.gender === 'male'
      ? `<span class="badge-gender male"><i class="fas fa-mars"></i> ذكر</span>`
      : `<span class="badge-gender female"><i class="fas fa-venus"></i> أنثى</span>`;

    const courseInfo = getCleanCourseAndGrade(s);

    return `
      <tr style="cursor: pointer;" onclick="openStudentDossier('${escapeHtml(s.code || s.nationalId)}')" title="انقر لعرض بطاقة وبيان الطالب">
        <td style="font-weight: 700; color: var(--text-muted);">${idx + 1}</td>
        <td><span class="code-pill">${escapeHtml(s.code || '-')}</span></td>
        <td><span style="font-family: monospace; font-weight: 700;">${escapeHtml(s.nationalId || '-')}</span></td>
        <td style="text-align: right;"><strong style="color: var(--primary);">${escapeHtml(s.name || '-')}</strong></td>
        <td>${genderBadge}</td>
        <td style="text-align: right;">${escapeHtml(s.college || '-')}</td>
        <td style="text-align: right;"><span style="color: var(--gold-light); font-weight: 700;">${escapeHtml(s.specialization || s.college || '-')}</span></td>
        <td>${escapeHtml(s.year || '-')}</td>
        <td>${statusBadge}</td>
        <td><span style="font-size: 0.82rem; font-weight: 600;">${escapeHtml(courseInfo.display)}</span></td>
      </tr>
    `;
  }).join('');

  if (currentCardModalFilteredStudents.length > displayLimit) {
    tbody.innerHTML += `
      <tr style="background: rgba(245, 158, 11, 0.1);">
        <td colspan="10" style="text-align: center; padding: 10px; font-weight: 700; color: var(--gold);">
          <i class="fas fa-info-circle"></i> يتم عرض أول ${displayLimit.toLocaleString('ar-EG')} طالب في الجدول لتسريع التصفح. للتصدير بالكامل، استخدم زر «تصدير Excel».
        </td>
      </tr>
    `;
  }
}

function exportCardModalToExcel() {
  if (!currentCardModalFilteredStudents || currentCardModalFilteredStudents.length === 0) {
    showToast('لا توجد بيانات مطابقة لتصديرها إلى Excel', 'warning');
    return;
  }

  if (typeof XLSX === 'undefined') {
    showToast('مكتبة تصدير Excel غير محملة في المتصفح', 'error');
    return;
  }

  const exportData = currentCardModalFilteredStudents.map((s, idx) => ({
    "م": idx + 1,
    "كود الطالب": s.code || "",
    "الرقم القومي": s.nationalId || "",
    "اسم الطالب": s.name || "",
    "النوع": s.gender === 'male' ? 'ذكر' : 'أنثى',
    "الكلية": s.college || "",
    "التخصص / الشعبة": s.specialization || s.college || "",
    "الفرقة الدراسية": s.year || "",
    "العام الدراسي": s.academicYear || "",
    "موقف الدورة": s.status === 'pass' ? 'حاصل (اجتاز الدورة)' : s.status === 'fail' ? 'غير حاصل (لم يجتز)' : 'لم يدخل أي دورة بعد',
    "الدورة / التقدير": getCleanCourseAndGrade(s).plainText
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ RTL: true });

  const safeSheetName = (currentCardModalTitle || 'كشف الطلاب').slice(0, 30).replace(/[:\\\/\?\*\[\]]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  const cleanFileName = `${(currentCardModalTitle || 'كشف_الطلاب').replace(/[\/\?<>\\:\*\|"]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, cleanFileName);
  showToast(`تم تصدير ${currentCardModalFilteredStudents.length.toLocaleString('ar-EG')} طالب بنجاح إلى ملف Excel`, 'success');
}

function printCardModalList() {
  if (!currentCardModalFilteredStudents || currentCardModalFilteredStudents.length === 0) {
    showToast('لا توجد بيانات للطباعة', 'warning');
    return;
  }

  const printContainer = document.getElementById('printReportContainer');
  if (!printContainer) return;

  const rowsHtml = currentCardModalFilteredStudents.map((s, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="text-align: center; font-family: monospace;">${escapeHtml(s.code || '-')}</td>
      <td style="text-align: center; font-family: monospace;">${escapeHtml(s.nationalId || '-')}</td>
      <td style="text-align: right; font-weight: 700;">${escapeHtml(s.name || '-')}</td>
      <td style="text-align: center;">${s.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
      <td style="text-align: right;">${escapeHtml(s.college || '-')}</td>
      <td style="text-align: right;">${escapeHtml(s.specialization || s.college || '-')}</td>
      <td style="text-align: center;">${escapeHtml(s.year || '-')}</td>
      <td style="text-align: center; font-weight: 700;">${s.status === 'pass' ? 'حاصل' : s.status === 'fail' ? 'غير حاصل' : 'لم يدخل بعد'}</td>
      <td style="text-align: center;">${escapeHtml(getCleanCourseAndGrade(s).display)}</td>
    </tr>
  `).join('');

  printContainer.innerHTML = `
    <div class="clean-print-header">
      <div class="clean-print-univ">جامعة اللوتس بالمنيا</div>
      <div class="clean-print-title">${escapeHtml(currentCardModalTitle)}</div>
    </div>
    <div style="margin-bottom: 12px; font-size: 10pt; color: #222; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dotted #ccc; padding-bottom: 6px;">
      <span><strong>إجمالي عدد الطلاب بالكشف:</strong> ${currentCardModalFilteredStudents.length.toLocaleString('ar-EG')} طالب</span>
      <span><strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString('ar-EG')}</span>
    </div>
    <table class="official-print-table" style="width: 100%; border-collapse: collapse; font-size: 9pt; text-align: center;">
      <thead>
        <tr style="background: #f1f5f9;">
          <th style="width: 35px; text-align: center;">م</th>
          <th style="width: 90px; text-align: center;">كود الطالب</th>
          <th style="width: 120px; text-align: center;">الرقم القومي</th>
          <th style="text-align: right;">اسم الطالب</th>
          <th style="width: 55px; text-align: center;">النوع</th>
          <th style="text-align: right;">الكلية</th>
          <th style="text-align: right;">التخصص / الشعبة</th>
          <th style="width: 55px; text-align: center;">الفرقة</th>
          <th style="width: 80px; text-align: center;">الموقف</th>
          <th style="width: 100px; text-align: center;">الدورة / التقدير</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  preparePrintOrientation(true);
  window.print();
}

window.openModal = openModal;
window.closeModal = closeModal;
window.openCardModal = openCardModal;
window.exportCardModalToExcel = exportCardModalToExcel;
window.printCardModalList = printCardModalList;
window.openStudentDossier = openStudentDossier;

function refreshCurrentCardModal() {
  if (AppState.activeCardModal) {
    const { cardType, customTitle, customSubtitle } = AppState.activeCardModal;
    openCardModal(cardType, customTitle, customSubtitle);
  }
}

function refreshAllViews() {
  populateSpecializationFilter();
  populateCourseFilter();
  renderDashboardStats();
  renderStudentsTable();
  renderSelectedReport();

  // تحديث نافذة الكروت التفصيلية المنبثقة تلقائياً إذا كانت معروضة
  const cardModalEl = document.getElementById('cardDetailModal');
  if (cardModalEl && cardModalEl.classList.contains('active')) {
    refreshCurrentCardModal();
  }
}

// ============================================================================
// تهيئة التطبيق وربط أحداث الصفحة (App Initialization & Event Listeners)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. تفعيل الوضع الداكن الافتراضي ونظام الثيم الاحترافي
  initTheme();

  // 2. مزامنة قاعدة البيانات والجلسة
  initDataSync();
  initAuthSession();

  // 2. مستمعات أحداث الدخول الفوري بدون كلمة مرور
  document.getElementById('btnEnterAsAdmin')?.addEventListener('click', () => loginAsAdmin(true));
  document.getElementById('btnEnterAsStaff')?.addEventListener('click', () => loginAsStaff(true));
  document.getElementById('btnSwitchRole')?.addEventListener('click', toggleUserRole);

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const role = document.getElementById('loginRoleInput').value;
      if (role === 'admin') {
        loginAsAdmin(true);
      } else {
        loginAsStaff(true);
      }
    });
  }

  // أزرار التبديل في شاشة الدخول
  const tabAdminBtn = document.getElementById('tabLoginAdmin');
  const tabStaffBtn = document.getElementById('tabLoginStaff');
  if (tabAdminBtn && tabStaffBtn) {
    tabAdminBtn.addEventListener('click', () => {
      tabAdminBtn.classList.add('active');
      tabStaffBtn.classList.remove('active');
      document.getElementById('loginRoleInput').value = 'admin';
      document.getElementById('adminLoginGroup').style.display = 'block';
      document.getElementById('staffLoginGroup').style.display = 'none';
    });

    tabStaffBtn.addEventListener('click', () => {
      tabStaffBtn.classList.add('active');
      tabAdminBtn.classList.remove('active');
      document.getElementById('loginRoleInput').value = 'staff';
      document.getElementById('adminLoginGroup').style.display = 'none';
      document.getElementById('staffLoginGroup').style.display = 'block';
    });
  }

  // 3. أزرار الدخول السريع
  document.getElementById('btnQuickAdminDemo')?.addEventListener('click', () => {
    loginAsAdmin(true);
  });
  document.getElementById('btnQuickStaffDemo')?.addEventListener('click', () => {
    loginAsStaff(true);
  });

  // 4. زر تسجيل الخروج
  document.getElementById('btnLogout')?.addEventListener('click', logoutUser);

  // 5. التنقل بين التبويبات
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // 6. بحث وتصفية الطلاب
  const searchInput = document.getElementById('studentSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.studentFilters.search = e.target.value;
      AppState.pagination.currentPage = 1;
      renderStudentsTable();
    });
  }

  ['filterCollege', 'filterSpecialization', 'filterCourse', 'filterYear', 'filterGender', 'filterStatus', 'filterAcademicYear'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', (e) => {
        const key = id.replace('filter', '');
        const prop = key.charAt(0).toLowerCase() + key.slice(1);
        AppState.studentFilters[prop] = e.target.value;
        if (id === 'filterCollege') {
          // تحديث قائمة التخصصات والدورات المرتبطة بالكلية
          populateSpecializationFilter();
          populateCourseFilter();
        }
        AppState.pagination.currentPage = 1;
        renderStudentsTable();
      });
    }
  });

  document.getElementById('selectPageSize')?.addEventListener('change', (e) => {
    AppState.pagination.pageSize = parseInt(e.target.value, 10);
    AppState.pagination.currentPage = 1;
    renderStudentsTable();
  });

  // 7. زر إضافة طالب يدوي والتحقق التلقائي من الرقم القومي
  document.getElementById('btnOpenAddStudentModal')?.addEventListener('click', openAddStudentModal);
  document.getElementById('studentForm')?.addEventListener('submit', handleSaveStudentForm);

  // استماع فوري للرقم القومي المصري لاستنتاج النوع وتاريخ الميلاد والمحافظة تلقائياً
  document.getElementById('formStudentNationalId')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    const hintEl = document.getElementById('nationalIdHintText');
    if (val.length === 14) {
      const res = parseEgyptianNationalId(val);
      if (res.isValid) {
        document.getElementById('formStudentGender').value = res.gender;
        if (hintEl) {
          hintEl.innerHTML = `<span style="color:#059669; font-weight:700;"><i class="fas fa-check-circle"></i> تاريخ الميلاد: ${res.birthDate} | محافظة: ${res.governorate} | النوع التلقائي: ${res.genderAr}</span>`;
        }
      } else {
        if (hintEl) {
          hintEl.innerHTML = `<span style="color:#dc2626;"><i class="fas fa-exclamation-circle"></i> ${res.error}</span>`;
        }
      }
    } else if (hintEl) {
      hintEl.textContent = 'أدخل 14 رقماً للاستنتاج التلقائي لتاريخ الميلاد والمحافظة والنوع';
    }
  });

  // 8. اختيار نوع وتصفية التقرير (فلاتر مركز التقارير والإحصائيات المتعددة)
  ['reportTypeSelector', 'reportCollegeFilter', 'reportYearFilter', 'reportGenderFilter', 'reportStatusFilter', 'reportCourseFilter'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', renderSelectedReport);
  });
  document.getElementById('btnResetReportFilters')?.addEventListener('click', resetReportFilters);

  // أزرار طباعة وتصدير التقرير وإعادة تحميل البيانات المعتمدة
  document.getElementById('btnPrintReport')?.addEventListener('click', () => {
    renderSelectedReport();
    preparePrintOrientation(true);
    window.print();
  });
  document.getElementById('btnExportReportExcel')?.addEventListener('click', exportCurrentReportToExcel);
  document.getElementById('btnReloadMasterData')?.addEventListener('click', () => {
    forceReloadCleanMasterData(true);
  });

  // 9. مناطق رفع الملفات (Drag & Drop Dropzones)
  const dropzoneStudents = document.getElementById('dropzoneStudents');
  const fileInputStudents = document.getElementById('fileInputStudents');
  if (dropzoneStudents && fileInputStudents) {
    dropzoneStudents.addEventListener('click', () => fileInputStudents.click());
    fileInputStudents.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleFileUpload(e.target.files[0], 'students');
    });
  }

  const dropzoneResults = document.getElementById('dropzoneResults');
  const fileInputResults = document.getElementById('fileInputResults');
  if (dropzoneResults && fileInputResults) {
    dropzoneResults.addEventListener('click', () => fileInputResults.click());
    fileInputResults.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleFileUpload(e.target.files[0], 'results');
    });
  }

  // زر اعتماد وحفظ الرفع
  document.getElementById('btnConfirmUpload')?.addEventListener('click', commitPendingUpload);

  // 10. إغلاق النوافذ المنبثقة
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      closeModal(modalId);
    });
  });

  // 11. نموذج إضافة موظف
  document.getElementById('staffAddForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('newStaffUsername').value.trim();
    const n = document.getElementById('newStaffName').value.trim();
    const p = document.getElementById('newStaffPassword').value.trim();
    handleAddStaffUser(u, n, p);
    e.target.reset();
  });

  // 12. أزرار العمليات الإدارية الخاصة بالأدمن
  document.getElementById('btnDeleteBatchAcademicYear')?.addEventListener('click', handleDeleteAcademicYear);
  document.getElementById('btnResetDatabaseTotal')?.addEventListener('click', handleResetFullDatabase);
  document.getElementById('btnExportBackupJSON')?.addEventListener('click', exportFullBackupJSON);

  // 13. مستمعات أحداث كروت الإحصائيات وجداول المؤشرات التفاعلية
  document.querySelectorAll('.metric-card').forEach(card => {
    card.addEventListener('click', () => {
      const cardType = card.getAttribute('data-card-type') || 'all';
      openCardModal(cardType);
    });
  });

  // النقر على خانات الجدول الإحصائي لعرض تفاصيل النوع والموقف
  const crossCells = [
    { id: 'crossMalePassed', type: 'male_pass' },
    { id: 'crossMaleFailed', type: 'male_fail' },
    { id: 'crossMaleNotAttended', type: 'male_not_attended' },
    { id: 'crossMaleTotal', type: 'male' },
    { id: 'crossFemalePassed', type: 'female_pass' },
    { id: 'crossFemaleFailed', type: 'female_fail' },
    { id: 'crossFemaleNotAttended', type: 'female_not_attended' },
    { id: 'crossFemaleTotal', type: 'female' },
    { id: 'crossTotalPassed', type: 'pass' },
    { id: 'crossTotalFailed', type: 'fail' },
    { id: 'crossTotalNotAttended', type: 'not_attended' },
    { id: 'crossGrandTotal', type: 'all' }
  ];

  crossCells.forEach(({ id, type }) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.cursor = 'pointer';
      el.setAttribute('title', 'انقر لعرض كشف وتفاصيل هؤلاء الطلاب');
      el.addEventListener('click', () => openCardModal(type));
    }
  });

  // أحداث نافذة تفاصيل الكارت: بحث فوري وتصدير وطباعة
  const cardSearchInput = document.getElementById('cardModalSearchInput');
  if (cardSearchInput) {
    cardSearchInput.addEventListener('input', (e) => {
      filterAndRenderCardModalTable(e.target.value);
    });
  }

  document.getElementById('btnExportCardModalExcel')?.addEventListener('click', exportCardModalToExcel);
  document.getElementById('btnPrintCardModal')?.addEventListener('click', printCardModalList);
});
