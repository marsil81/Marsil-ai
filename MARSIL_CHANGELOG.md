# 🛡️ السجل السيبراني: تقارير التحسين الذاتي (MARSIL CHANGELOG)

هذا الملف مخصص لتسجيل التحديثات التلقائية، التحسينات المعمارية، وإصلاح الأخطاء التي يقوم بها **مارسيل** بشكل ذاتي في الخلفية.

---
### [حزمة تحسينات مستمرة: AnimatePresence، ErrorBoundary، مؤشر زمني، Sparkline محسّن، مقاييس REST] - 2026-05-29
**الملخص:** تم تنفيذ 10 مهام تحسينية في جلسة تطور مستمرة واحدة:
- **AnimatePresence لجميع النوافذ المنبثقة:** إضافة `AnimatePresence` من framer-motion حول SettingsModal و EvolutionModal و Console لضمان تشغيل exit animations عند الإغلاق.
- **Skeleton Shimmer لمحرر الكود:** استبدال نص `LOADING CONTENT...` البسيط بـ 12 صف shimmer متحرك في CodeEditor لتجربة تحميل أكثر احترافية.
- **ErrorBoundary شامل:** مكون React جديد يلتقط أخطاء التصيير ويعرض واجهة "SYSTEM MALFUNCTION" أنيقة بدلاً من الشاشة البيضاء، مع زر REBOOT INTERFACE.
- **تحسين لغة النظام الصوتي:** جعل `useVoiceSystem` يحترم إعداد i18n الحالي (`en`/`ar`) بدلاً من `ar-SA` الثابت، مع مزامنة لغة التعرف الصوتي والتحدث تلقائياً.
- **تحسين Sparkline التوكن:** إضافة peak indicator مع نقطة مضيئة، عرض PEAK value، وتحسين التدرج اللوني للأشرطة.
- **مؤشر زمن WebSocket:** إضافة قياس زمن الاستجابة (latency) عبر ping/pong مع عرض `XXms` بجانب مؤشر WS في شريط التشخيص.
- **طوابع زمنية للرسائل:** إضافة `ts` (timestamp) لكل رسالة في سجل الدردشة مع عرض وقت الإرسال/الاستلام بتنسيق HH:MM:SS.
- **نقطة نهاية /api/metrics:** REST endpoint جديد يعرض CPU، RAM، Uptime لتمكين الواجهة من سحب المقاييس مباشرة.
- **إصلاح ESLint:** إصلاح خطأي `Math.random` في render و `unused-vars` في ErrorBoundary. الوصول إلى 0 خطأ في الواجهتين.
- **إصلاح useVoiceSystem:** إضافة `useTranslation` و `langRef` لمزامنة لغة التعرف الصوتي مع إعداد الواجهة.

### [حزمة تحسينات واجهة المستخدم: إضافات بصرية وتفاعلية] - 2026-05-29
**الملخص:** تم تنفيذ 8 مهام تحسينية في جلسة تطور مستمرة واحدة:
- **إضافة مؤشرات اختصارات لوحة المفاتيح:** إضافة أيقونة ⌨ مع tooltip لاختصارات Ctrl+Shift+C و Ctrl+Shift+S في أزرار CONSOLE و SETTINGS.
- **تحسين مؤشر البث المباشر (Streaming Indicator):** إضافة وميض مؤشر `▊` متحرك أثناء بث رد المساعد، مع تأثير توهج نابض على حد رسالة `streaming` لتعزيز الإحساس بالاستجابة الحية.
- **إضافة انتقالات سلسة للنوافذ المنبثقة (Modal Transitions):** استخدام framer-motion لإضافة تأثيرات Fade-in/Scale للـ Console و Settings و Evolution modals.
- **إضافة أيقونات نوع الملف (File Type Icons):** كشف تلقائي لنوع الملف في CodeEditor (JS, JSX, TS, CSS, HTML, PY, إلخ) مع أيقونة ملونة من Lucide Icons في رأس المحرر.
- **إضافة نظام تخزين مؤقت لشجرة الملفات (File Tree Caching):** إضافة cache في الخادم مع TTL 3 ثوانٍ لتقليل قراءات نظام الملفات المتكررة.
- **إضافة هيكل تحميل (Loading Skeleton):** تأثير shimmer متحرك عند تحميل شجرة الملفات بدلاً من الفراغ التام.
- **إضافة رسم بياني لتدفق التوكن (Token Sparkline):** رسم بياني شريطي مباشر في لوحة الموارد يعرض تاريخ استهلاك التوكن (آخر 20 نقطة).
- **إصلاح ESLint:** إصلاح خطأين جديدين (set-state-in-effect و Math.random في render) في FileTreeHUD.

### [حزمة تحسينات: إصلاح EVOLUTION_TRIGGER، AbortController، ToastContainer، ParticleReactor، ESLint] - 2026-05-29
**الملخص:** تم تنفيذ 7 مهام تحسينية في جلسة تطور مستمرة واحدة:
- **إصلاح AgentService EVOLUTION_TRIGGER:** إرجاع رسالة تأكيد نصية (`⚡ Autonomous Evolutionary Cycle initiated.`) للمستخدم في الدردشة بدلاً من `null` الصامت.
- **إصلاح node-fetch timeout في AnthropicProxy.js:** استبدال خاصية `timeout` غير المدعومة في node-fetch v2 بـ `AbortController` مع إشارة (`signal`) وإلغاء المهلة (`clearTimeout`) لضمان مهلة اتصال صحيحة.
- **إصلاح ارتباط أسماء الملفات في ParticleReactor.jsx:** تعيين `fileName` لكل جسيم أثناء التهيئة من قائمة `fileNames` المستخلصة من API، لعرض أسماء الملفات العائمة في المجسم الثلاثي الأبعاد.
- **تحسين ToastContainer في App.jsx:** تحويل `ToastContainer` من متغير JSX يُعاد إنشاؤه في كل render إلى مكون React منفصل (`function ToastContainer`) يمرر إليه `toasts` كـ props، مما يقلل إعادة التصيير غير الضرورية.
- **إصلاح قياس CPU التفاضلي:** تغيير القيمة الافتراضية للقراءة الأولى من `calculateCpuLoad()` من حمل تراكمي مضلل إلى `'0.0'`، لتعود القراءة الثانية فرقاً حقيقياً. استخدام جمع مباشر للحقول (`user + nice + sys + irq + idle`) بدلاً من `for...in` لتجنب خصائص prototype.
- **تحديث config.example.json:** مزامنة القالب مع الهيكل الجديد (provider, baseUrl, budget) بدلاً من الحقل القديم `engine`.
- **إصلاح ESLint وحل 4 تحذيرات:** إضافة `AbortController` إلى globals في ESLint، إضافة `onVisualizerRef` إلى dependencies، إضافة `useCallback` لـ `handleSend` مع `chatInputRef`، إضافة التبعيات المفقودة في useSoundEffects و voice readout useEffect. الوصول إلى 0 خطأ و 0 تحذير في الواجهتين.
**الملخص:** تم تنفيذ 8 مهام تحسينية في جلسة تطور مستمرة واحدة:
- **إصلاح StrictMode في main.jsx:** إزالة StrictMode لمنع الـ double-rendering في بيئة التطوير (Vite HMR).
- **إزالة console.log من hooks الصوتية:** استبدال جميع `console.log` في useSoundEffects.js و useVoiceSystem.js و App.jsx بـ catch صامت لمنع ضوضاء الكونسول.
- **حفظ تخطيط الشات (Layout Persistence):** إضافة حفظ chatLayout (bottom/side) وعرض الشات في localStorage لاستعادتها بعد تحديث الصفحة.
- **تحسين WebSocketHandler:** إضافة معالج للرسائل غير المعروفة (unknown message types) مع تسجيل debug.
- **تحسين CSS المتجاوب (Responsive Design):** إضافة 3 مستويات من Media Queries (1200px, 900px, 640px) لتقليص/إخفاء اللوحات على الشاشات الصغيرة والأجهزة اللوحية.
- **إضافة حذف الفروع (Delete Branch):** دالة `deleteBranch()` جديدة في GitAdapter.js، دعم `action: 'delete'` في POST /api/git/branch، وزر DELETE BRANCH في GitBranchSelector مع تأكيد.
- **إصلاح أخطاء ESLint:** إصلاح خطأين (logger غير معرف في WebSocketHandler، متغير e غير مستخدم) للوصول إلى 0 خطأ في الخلفية والأمامية.

---

### [حزمة تحسينات مستمرة: CodeEditor محسّن، Git Branch UI، Terminal ذكي، اختصارات كيبورد، تشخيص ذاتي] - 2026-05-29
**الملخص:** تم تنفيذ 6 مهام تحسينية في جلسة تطور مستمرة واحدة:
- **CodeEditor محسّن (Syntax Highlighting + UI فاخر):** إضافة تلوين نحوي للكود (كلمات مفتاحية، نصوص، تعليقات، أرقام، عوامل)، أرقام أسطر افتراضية، زري COPY و SAVE (Ctrl+S) مع مؤشرات مرئية، عداد أسطر وأحرف، تصميم زجاجي فاخر (Glassmorphism) مع ظلال نيون.
- **Git Branch UI في FileTreeHUD:** إضافة قائمة منسدلة لعرض الفروع والتبديل بينها مع علامة ★ للفرع الحالي، زر إنشاء فرع جديد، تحديث تلقائي كل 15 ثانية.
- **حذف وإعادة تسمية الملفات:** إضافة قائمة سياقية (Context Menu) بزر الفأرة الأيمن على الملفات مع خيارات OPEN, RENAME, DELETE، مع نقاط نهاية خلفية جديدة (DELETE /api/file و POST /api/file/rename).
- **Terminal مع ألوان ANSI وبحث:** إضافة محلل ANSI escape codes لعرض الألوان في مخرجات التيرمنال، شريط بحث/فلترة مع عداد النتائج، زر SEARCH للعثور على النص بسرعة.
- **اختصارات كيبورد عامة:** Ctrl+K لتركيز حقل الإدخال، Ctrl+Shift+C لفتح/غلق الكونسول، Ctrl+Shift+S لفتح/غلق الإعدادات، Escape لإغلاق أي نافذة منبثقة، Ctrl+L لمسح الدردشة.
- **نظام تشخيص ذاتي (Self-Diagnostics):** إضافة 4 مؤشرات في الشريط العلوي (WS, API, CLD, PRX) بحالة متصلة/منفصلة مع ألوان أخضر/أحمر، ربط حالة اتصال WebSocket الفعلية مع الخادم.

---

### [حزمة تحسينات شاملة: أمان WebSocket، توحيد الأخطاء، ESLint Frontend، إزالة كود ميت، تحسين HTML] - 2026-05-29
**الملخص:** تم تنفيذ 7 مهام تحسينية في جلسة تطور مستمرة واحدة:
- **تأمين مفتاح API:** إضافة `keyPrefix` في استجابة `/api/config` لإظهار أول 3 أحرف من المفتاح مع إخفاء الباقي.
- **إضافة Proxy Health Check:** نقطة نهاية جديدة `GET /api/proxy/status` للتحقق من حالة Proxy الخادم، مع دالة `isRunning()` في AnthropicProxy.js.
- **إزالة كود ميت:** حذف 5 ملفات غير مستخدمة بالكامل (Reactor.jsx, EditorPane.jsx, FileTree.jsx, VoiceOrb.jsx, HudMetrics.jsx) لتقليل حجم الحزمة.
- **تحسين HTML:** تحديث `index.html` بهوية مارسيل (MARSIL — Cybernetic AI Core)، إضافة meta tags، preconnect لـ Google Fonts، ولون خلفية لمنع FOUC.
- **إصلاح ESLint Frontend:** إصلاح 24 خطأ ESLint في الواجهة الأمامية (وصول من 24 خطأ إلى 0 خطأ) — إزالة imports غير مستخدمة، إصلاح استخدام useRef بدلاً من setState في effects، تصحيح ترتيب hooks، إزالة escapes غير ضرورية.
- **التحقق من صحة WebSocket:** إضافة validation صارم لرسائل WebSocket — حد أقصى 100KB للحجم، 50K حرف للنص، التحقق من نوع الرسالة (chat/abort/pong فقط).
- **توحيد رسائل الخطأ:** إنشاء دالة `apiError()` مساعدة وإعادة هيكلة جميع استجابات الخطأ في Server.js لتنسيق موحد `{ error: { code, message } }` مع أكواد خطأ (INVALID_PROVIDER, INVALID_BUDGET, INTERNAL_ERROR, UNHANDLED_ERROR).
- **إضافة lint scripts:** إضافة `npm run lint` للواجهة الأمامية والخلفية للتحقق التلقائي من جودة الكود.
**الملخص:** تم تنفيذ حزمة تحسينات شاملة على جودة الكود واستقرار الاتصال وتجربة المستخدم:
- **إضافة ESLint احترافي (Backend):** تثبيت ESLint مع قواعد قياسية (no-unused-vars, prefer-const, no-var) واستبدال الـ lint script القديم بـ `eslint src/`. تم إصلاح 13 مشكلة (3 أخطاء + 10 تحذيرات) لتصل إلى 0 خطأ و 0 تحذير.
- **إضافة Auto-Reconnect للـ WebSocketClient (Frontend):** نظام إعادة اتصال ذكي مع Exponential Backoff (يبدأ من 1 ثانية ويتضاعف حتى 30 ثانية كحد أقصى)، مع حد أقصى 10 محاولات، وعرض رسائل الحالة في Toast Notifications.
- **إضافة Git Branch Management API (Backend):** 3 نقاط نهاية جديدة: `GET /api/git/branches` (سرد الفروع مع الفرض الحالي)، `POST /api/git/branch` (إنشاء فرع جديد مع `action: 'create'` أو التبديل مع `action: 'switch'`).
- **إضافة نظام Toast Notifications (Frontend):** مكون `useToasts()` مع 4 أنواع (info, success, warning, error) ومدة عرض تلقائية 4 ثوانٍ مع Animation Slide-in.
- **تحسين أداء VoicePulseVisualizer (Frontend):** استبدال المصفوفات المؤقتة بـ `Float32Array` مسبق التخصيص، إضافة `trigCacheRef` لتخزين قيم المثلثات المحسوبة مسبقاً، تحسين دورة حياة AudioContext (إعادة الاستخدام بدلاً من الإغلاق/الفتح المتكرر)، تجنب إنشاء الكائنات في حلقة الرسم.
- **تحسين WebSocket Ping/Pong (Frontend):** إضافة معالج `ping` يستجيب فوراً بـ `pong` لمنع قطع الاتصال، وإضافة callback `onConnectionChange` لإعلام الواجهة بحالة الاتصال.
- **إصلاح جميع تحذيرات ESLint:** إزالة المتغيرات غير المستخدمة (logger من GitAdapter و WebSocketHandler، agentService من Server.js)، تغيير `let` إلى `const` حيثما أمكن، إزالة متغيرات الـ catch غير المستخدمة.
**الملخص:** تم تنفيذ حزمة إصلاحات استباقية لمنع تدهور الأداء في الجلسات الطويلة:
- **إصلاح تسرب الذاكرة (Memory Leak) في useAgentConnection.js:** إضافة حد أقصى 1000 سطر لمصفوفة `termOutput` (TERM_OUTPUT_MAX) مع قص تلقائي (`next.slice(-1000)`) عند تجاوز الحد، لمنع تورم الذاكرة في جلسات التطور الذاتي الطويلة.
- **إصلاح المسار البديل في loadConfig (Server.js):** إضافة استدعاء `claudeCode.setProviderConfig(config)` في مسار catch الفاشل، لضمان مزامنة الإعدادات حتى عند فشل قراءة ملف config.json.
- **إصلاح الأمر الافتراضي المضلل (AnthropicProxy.js):** استبدال القيمة الافتراضية `"git status --porcelain"` بسلسلة فارغة `""` في `parseToolInput`، لمنع تنفيذ أوامر غير متوقعة بصمت.
- **إزالة كود ميت (Dead Code):** حذف ملف `ChatHUD.jsx` غير المستورد في أي مكان.
- **إضافة زر CLEAR في شاشة Console:** لتمكين المستخدم من مسح سجل الطرفية مباشرة.

### [نظام البث الذكي وتحسين Git API وإدارة الذاكرة] - 2026-05-29
**الملخص:** تم تنفيذ حزمة تحسينات على البنية الخلفية:
- **نظام البث الذكي (Smart Streaming) في ClaudeCodeAdapter.js:** إضافة `_sendThrottled()` لمنع إغراق اتصال WebSocket بتحديثات متكررة، وإضافة `_tryParseJsonAccumulated()` لاستعادة JSON المقطوع عبر الحزم، وإضافة عداد استدعاء الأدوات (`_toolCallCount`) لعرض التقدم (⚡ [1]، ⚡ [2]، ...)، وإصلاح ازدواجية النص بين حدثَي `assistant` و `text_delta`.
- **إضافة نقاط نهاية Git API (GitAdapter.js + Server.js):** ثلاث نقاط نهاية جديدة: `GET /api/git/status` (حالة الملفات مع الفرع الحالي)، `GET /api/git/diff` (التغييرات غير المرفوعة)، `GET /api/git/log` (سجل آخر 10-50 commit). تمكن الواجهة الأمامية من عرض معلومات تحكم الإصدار مباشرة.
- **إضافة clearBuffer() في Logger.js:** دالة لتفريغ المخزن المؤقت الدائري للذاكرة عند الحاجة، لمنع تسرب الذاكرة في الجلسات الطويلة.

---

### [تحسين أداء Canvas ثلاثي الأبعاد، قياس CPU تفاضلي، توحيد كود عرض الأدوات] - 2026-05-29
**الملخص:** تم تنفيذ حزمة تحسينات أداء وجودة كود:
- **تحسين أداء ParticleReactor.jsx (Frontend):** إضافة دعم `devicePixelRatio` للشاشات عالية الدقة (Retina/HiDPI) للحصول على رسوم واضحة وحادة، إضافة throttled resize handler لتجنب إعادة الحساب المتكرر، استخدام مربع المسافة (`dx*dx + dy*dy + dz*dz`) بدلاً من `Math.sqrt()` في حلقة التوصيل O(n²) لتقليل الحمل على المعالج، وإزالة استيراد React غير المستخدم.
- **تحسين قياس CPU (WebSocketHandler.js - Backend):** تغيير دالة `calculateCpuLoad()` من حساب الحمل التراكمي (منذ إقلاع النظام) إلى قياس تفاضلي (delta) بين القراءات للحصول على حمل فوري دقيق يعكس استخدام المعالج الحقيقي.
- **توحيد كود عرض الأدوات (ClaudeCodeAdapter.js - Backend):** استخراج دالة مساعدة `summarizeToolInput()` لتوحيد المنطق المتكرر لعرض وسائط الأدوات (Bash, Grep, Glob, إلخ) في مكان واحد، مما قلل تكرار الكود بنحو 40 سطراً وحسّن قابلية الصيانة.

---

### [تحسين جودة الكود: إصلاح جدولة التطور الذاتي، توحيد الأنماط المتكررة] - 2026-05-29
**الملخص:** تم تنفيذ حزمة تحسينات على جودة الكود الخلفي:
- **إصلاح خطأ جدولة التطور الذاتي (AgentService.js):** دالة `_scheduleNextEvolutionCycle()` كانت تُستدعى بعد كل رسالة مستخدم حتى لو كان التطور الذاتي معطلاً. تم إضافة شرط `autoEvolutionEnabled` قبل الاستدعاء لمنع الهدر غير الضروري.
- **توحيد التعبير النمطي ANSI (ClaudeCodeAdapter.js):** تم استخراج تعبير ANSI regex المكرر (الموجود في سطرين مختلفين) إلى ثابت `ANSI_REGEX` على مستوى الوحدة لتجنب التكرار وتسهيل الصيانة المستقبلية.
- **تحميل dotenv بشكل آمن (Server.js):** تم تغليف `require('dotenv/config')` في كتلة `try/catch` لمنع تعطل الخادم في حال عدم تثبيت الحزمة.
- **إضافة سكريبت `npm run lint`:** فحص صياغة جميع ملفات JS الخلفية للتأكد من خلوها من الأخطاء النحوية.

---

### [تحسين أمني وهيكلي: Helmet, Rate Limiting, وسجل منظم] - 2026-05-29
**الملخص:** تم تنفيذ حزمة تحسينات أمنية وهيكلية على النواة الخلفية:
- **إضافة Helmet (الخوذة الأمنية):** تفعيل رؤوس أمان HTTP (X-Content-Type-Options, X-Frame-Options, HSTS) لحماية الخادم من هجمات XSS والتصيد.
- **إضافة Rate Limiting (تحديد المعدل):** حد أقصى 120 طلب في الدقيقة لكل نقطة نهاية `/api/` مع رؤوس قياسية (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset).
- **إضافة CORS مقيد:** تحديد الأصول المسموح بها (localhost:5173, localhost:3000) بدلاً من `cors()` المفتوح بالكامل.
- **إضافة نظام تسجيل منظم (Logger):** ملف `Logger.js` جديد مع طابع زمني (timestamp)، مستويات (INFO/WARN/ERROR/DEBUG)، وألوان للتمييز في الطرفية.
- **استبدال جميع `console.log/error`:** تم استبدال كافة جمل الطباعة الخام في Server.js, ClaudeCodeAdapter.js, AnthropicProxy.js, GitAdapter.js بـ `logger.info/error/warn`.
- **إضافة Validation لـ POST /api/config:** التحقق من صحة الـ provider (القيم المسموحة) والـ budget (رقم غير سالب) قبل الحفظ.
- **إضافة Request Logger وسيط:** تسجيل تلقائي لكل طلب مع زمن الاستجابة (مثال: `GET /api/config → 200 (12ms)`).

### [تنظيف الكود الميت وإضافة دعم .env] - 2026-05-29
**الملخص:** تم تنفيذ عملية تنظيف هيكلي للكود الخلفي وتحسين الأمان:
- **إضافة دعم المتغيرات البيئية (.env)** عبر `dotenv` — يمكن الآن وضع `MARSIL_API_KEY` و `MARSIL_PROVIDER` و `MARSIL_MODEL` في ملف `.env` بدلاً من `config.json` لحماية المفاتيح السرية.
- **إزالة 5 ملفات ميتة (Dead Code):** `DeepSeekClient.js`، `TerminalAdapter.js`، `FileSystemAdapter.js`، `ToolDefinitions.js`، `AgentOrchestrator.js` — جميعها غير مستوردة في أي مكان وتسبب تضخيماً غير ضروري.
- **إزالة المجلدات الفارغة:** `domain/` تمت إزالتها بعد إفراغها.
- **إنشاء `.env.example`** كمرجع للمستخدم لتكوين المتغيرات البيئية.
- **التحقق من السلامة:** جميع الملفات المتبقية تجتاز فحص الصياغة (Syntax Check) وتبدأ بدون أخطاء.

---

### [تحسين أمن واستقرار النواة الخلفية] - 2026-05-29
**الملخص:** تم تنفيذ حزمة تحسينات أمنية وهيكلية على النواة الخلفية (Backend Kernel):
- **إضافة وسيط معالجة الأخطاء العام (Global Error Handler)** في Server.js لالتقاط الاستثناءات غير المتوقعة ومنع تعطل الخادم.
- **إضافة نقطة نهاية /api/health** لمراقبة صحة الخادم (Health Check) مع زمن التشغيل والحالة.
- **تفعيل الإغلاق الآمن (Graceful Shutdown)** عند استقبال SIGTERM/SIGINT مع تنظيف اتصالات WebSocket وإيقاف Proxy.
- **معالجة استثناءات uncaughtException و unhandledRejection** لمنع الانهيار المفاجئ.
- **إضافة دالة safePath()** لمنع هجمات Path Traversal في نقاط /api/file و /api/files.
- **إصلاح ثغرة حقن الأوامر (Command Injection)** في GitAdapter.js عبر استبدال exec بـ execFile الآمن.
- **تحسين WebSocketHandler** بإضافة Ping/Pong Keepalive لاكتشاف انقطاع الاتصال، ومعالجة JSON آمنة، وحساب أدق لاستخدام CPU.
- **تحديد حد لحجم الطلبات (10mb)** في express.json() لمنع هجمات تجاوز الذاكرة.

---

### [التهيئة الأولية] - بدء بروتوكول الإصلاح الذاتي
**التاريخ:** 2026
**ملخص العملية:**
تم تفعيل بروتوكول (Self-Healing) بنجاح. مارسيل الآن يراقب شيفرته الخاصة، وسيقوم بتسجيل أي أخطاء يعثر عليها ويصلحها في هذا السجل بشكل دوري.

---
