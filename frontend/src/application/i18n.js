import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app_title": "MARSIL",
      "emergency_stop": "ABORT SYSTEM",
      "system_engine": "SYSTEM ENGINE",
      "system_metrics": "TELEMETRY DEPLOYMENT",
      "terminal": "CMD INTERFACE",
      "cpu_load": "CPU FREQ",
      "mem_usage": "MEMORY LOAD",
      "tokens_used": "TOKENS",
      "send_command": "Send",
      "placeholder_command": "Talk or type directive...",
      "you": "YOU",
      "ironman": "MARSIL",
      "live_sync_later": "(Live sync standby)",
      "terminal_init": "Marsil CMD Interface Online...",
      "settings_title": "SYSTEM SETTINGS",
      "save": "Save",
      "cancel": "Cancel",
      "sec": "SECURE",
      "live": "LIVE STREAM",
      "active_threads": "THREADS: 8 ACTIVE",
      "file_tree": "LIVE WORKSPACE FILE TREE",
      "directives": "SYSTEM DIRECTIVES",
      "monitor": "RESOURCE MONITORING",
      "voice_status": "VOICE ASSISTANT ONLINE",
      "protocols": "DEPLOYMENT PROTOCOLS",
      "gauges": "RESOURCE GAUGES",
      "temp": "CORE TEMP",
      "link": "DIAG.LINK",
      "workspace": "WORKSPACE",
      "total_comp": "TOTAL COMPUTATION TOKENS",
      "est_usage": "ESTIMATED USAGE STATUS"
    }
  },
  ar: {
    translation: {
      "app_title": "مارسيل",
      "emergency_stop": "إيقاف النظام فوراً",
      "system_engine": "محرك النظام",
      "system_metrics": "مراقبة القياسات والاتصال",
      "terminal": "واجهة الأوامر البرمجية",
      "cpu_load": "تردد المعالج",
      "mem_usage": "حمل الذاكرة عشوائية",
      "tokens_used": "التوكن المستهلكة",
      "send_command": "إرسال",
      "placeholder_command": "تحدث أو اكتب أمرك هنا...",
      "you": "أنت",
      "ironman": "مارسيل",
      "live_sync_later": "(المزامنة حية بالانتظار)",
      "terminal_init": "تم تشغيل بيئة أوامر مارسيل السيبرانية...",
      "settings_title": "إعدادات النظام الفنية",
      "save": "حفظ التغييرات",
      "cancel": "إلغاء",
      "sec": "آمن",
      "live": "بث حي ومباشر",
      "active_threads": "المسارات: 8 نشط",
      "file_tree": "شجرة ملفات المجلد الهولوجرامية",
      "directives": "توجيهات النظام الحيوية",
      "monitor": "مراقبة استهلاك الموارد المالي",
      "voice_status": "المساعد الصوتي تفاعلي نشط",
      "protocols": "بروتوكولات النشر والتشغيل",
      "gauges": "عدادات أداء الأجهزة",
      "temp": "درجة الحرارة النواة",
      "link": "رابط الاتصال",
      "workspace": "مجلد العمل النشط",
      "total_comp": "إجمالي التوكنز الحاسوبية المعالجة",
      "est_usage": "تقدير تكلفة الموارد الحالية"
    }
  }
};

i18n.use(initReactI18next).init({
  resources, lng: "ar", fallbackLng: "ar",
  interpolation: { escapeValue: false }
});

export default i18n;
