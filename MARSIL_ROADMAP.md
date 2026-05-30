# 🌌 خريطة التطور البرمجي لـ (MARSIL AI)

**مارسيل (MARSIL AI)** هو إطار عمل ومساعد مطور متكامل، مصمم لتقديم واجهة عمل متسعة ومريحة (Widescreen Developer Comfort) وأتمتة مساحة العمل وإصلاح الأكواد ذاتياً (Self-Healing Framework).
هذه الخريطة تحدد أهدافنا العامة، وضعنا الحالي، والمراحل القادمة لتطوير الأداة لصالح مجتمع المطورين.

---

## 🎯 الوضع الحالي (Current State)
- **الهوية البصرية:** واجهة شاشة عريضة فائقة الوضوح، خالية تماماً من المشتتات، تدعم التوجيهات الثنائية (العربية والانجليزية) مع خط Cairo.
- **الاستقلالية والمحاكاة:** بيئة تشغيل محلية آمنة 100% مجهزة ببروتوكولات الإصلاح الذاتي وحماية الخصوصية.
- **التحقق:** بناء تجميعي كامل وخالٍ من التحذيرات أو الأخطاء.

---

## 🚀 المراحل القادمة (Next Milestones)

### المرحلة الأولى: استقرار النواة (تم إنجازها ✅)
- بناء واجهة الدردشة واللوحات القابلة للسحب.
- تفعيل نظام (Local Storage) لحفظ الذاكرة.
- إطلاق شاشة الـ Console لمراقبة الأوامر في الخلفية.

### المرحلة الثانية: ذكاء الأوامر والتطوير الذاتي (قيد التنفيذ 🔄)
- [x] تحليل شامل لأخطاء الكود الحالية (Linting) وإصلاحها تلقائياً.
- [x] تحسين أمن واستقرار النواة الخلفية (Backend Security & Stability).
- [x] تنظيف الكود الميت (Dead Code Elimination) وإزالة 5 ملفات غير مستخدمة.
- [x] إضافة دعم المتغيرات البيئية (.env) لحماية المفاتيح السرية.
- [x] قدرة مارسيل على اقتراح تحسينات في سرعة الواجهة (Performance).
- [x] إضافة اختصارات كيبورد للتحكم السريع بدون ماوس.
- [x] **إضافة نظام أمان متعدد الطبقات:** Helmet للرؤوس الأمنية، Rate Limiting لمنع هجمات الحرمان من الخدمة، CORS مقيد، Validation للمدخلات.
- [x] **نظام تسجيل منظم (Structured Logging):** Logger مع Timestamp/Meta/Levels بدلاً من console.log الخام.

### المرحلة الثالثة: النضج الهيكلي والصيانة الاستباقية (تم الإنجاز ✅)
- [x] **إصلاح جدولة التطور الذاتي** — منع استدعاء `_scheduleNextEvolutionCycle` بعد الرسائل غير الذاتية.
- [x] **توحيد الأنماط المتكررة** — استخراج ANSI regex المكرر إلى ثابت عام.
- [x] **تحميل آمن للمكتبات** — تغليف `require('dotenv/config')` في try/catch.
- [x] **إضافة فحص الصياغة** — سكريبت `npm run lint` لفحص جميع ملفات JS.
- [x] **توحيد كود عرض الأدوات** — استخراج `summarizeToolInput()` لإزالة 40 سطراً مكرراً من ClaudeCodeAdapter.js.
- [x] **تحسين قياس CPU التفاضلي** — تغيير حساب حمل المعالج من تراكمي إلى تفاضلي (delta) لقراءات فورية دقيقة.

### المرحلة الرابعة: تحسين أداء الواجهة والتجربة البصرية (تم الإنجاز ✅)
- [x] **تحسين أداء Canvas (ParticleReactor.jsx):** إضافة دعم Retina/HiDPI (devicePixelRatio)، throttled resize، استخدام مربع المسافة بدلاً من `Math.sqrt()` في حلقة التوصيل.
- [x] **نظام البث الذكي (Smart Streaming) في ClaudeCodeAdapter.js:** إضافة throttling لمنع إغراق WebSocket، استعادة JSON المقطوع عبر الحزم، عداد أدوات لعرض التقدم، إصلاح ازدواجية النص.
- [x] **إضافة نقاط نهاية Git API:** `GET /api/git/status`، `GET /api/git/diff`، `GET /api/git/log` لتمكين الواجهة من عرض تحكم الإصدار.
- [x] **إضافة clearBuffer() في Logger.js:** لتفريغ الذاكرة المؤقتة ومنع التسرب في الجلسات الطويلة.
- [x] **إصلاح تسرب الذاكرة في termOutput (useAgentConnection.js):** تحديد سقف 1000 سطر مع قص تلقائي.
- [x] **إصلاح المسار البديل في loadConfig (Server.js):** مزامنة الإعدادات عند فشل القراءة.
- [x] **إصلاح الأمر الافتراضي المضلل في AnthropicProxy.js:** منع تنفيذ أوامر غير متوقعة.
- [x] **إزالة كود ميت (ChatHUD.jsx):** حذف ملف غير مستخدم.
- [x] **إضافة زر CLEAR في شاشة Console:** تحكم مباشر في مسح الطرفية.

### المرحلة الخامسة: النضج الهيكلي وجودة الكود (تم الإنجاز ✅)
- [x] **إضافة ESLint احترافي:** تثبيت ESLint مع قواعد no-unused-vars، prefer-const، no-var. إصلاح 13 مشكلة للوصول إلى 0 خطأ و 0 تحذير.
- [x] **Auto-Reconnect للـ WebSocketClient:** نظام إعادة اتصال ذكي مع Exponential Backoff (1s → 30s كحد أقصى)، 10 محاولات، مع رسائل Toast.
- [x] **Git Branch Management API:** 3 نقاط نهاية جديدة لسرد الفروع وإنشاءها والتبديل بينها.
- [x] **نظام Toast Notifications:** مكون useToasts() مع 4 أنواع (info, success, warning, error) مع Animation Slide-in.
- [x] **تحسين أداء VoicePulseVisualizer:** تخصيص مسبق للمصفوفات (`Float32Array`)، تخزين المثلثات في Cache، تحسين دورة حياة AudioContext.

### المرحلة السادسة: النضج الأمني وجودة الكود الأمامي (تم الإنجاز ✅)
- [x] **تأمين مفتاح API:** إخفاء المفتاح في `/api/config` وإضافة `keyPrefix`.
- [x] **توحيد رسائل الخطأ الخلفية:** إنشاء دالة `apiError()` مع أكواد خطأ موحدة (INVALID_PROVIDER, INVALID_BUDGET, INTERNAL_ERROR, UNHANDLED_ERROR).
- [x] **التحقق من صحة WebSocket:** إضافة validation صارم لرسائل WebSocket (حد الحجم، نوع الرسالة، طول النص).
- [x] **إزالة الكود الميت من الواجهة الأمامية:** حذف 5 ملفات غير مستخدمة (Reactor.jsx, EditorPane.jsx, FileTree.jsx, VoiceOrb.jsx, HudMetrics.jsx).
- [x] **إصلاح ESLint Frontend:** إصلاح 24 خطأ — 0 أخطاء حالياً في كل من الواجهة الأمامية والخلفية.
- [x] **تحسين HTML:** هوية مارسيل، meta tags، preconnect للخطوط.
- [x] **إضافة Proxy Health Check:** نقطة نهاية `/api/proxy/status` مع دالة `isRunning()`.

### المرحلة السابعة: النضج التفاعلي وتحسين تجربة المطور (تم الإنجاز ✅)
- [x] **تحسين CodeEditor:** إضافة Syntax Highlighting، أرقام أسطر، تصميم زجاجي فاخر، اختصار Ctrl+S.
- [x] **Git Branch UI في الواجهة الأمامية:** قائمة منسدلة لعرض الفروع والتبديل بينها مع إنشاء فروع جديدة.
- [x] **حذف وإعادة تسمية الملفات:** قائمة سياقية بزر الفأرة الأيمن مع نقاط نهاية خلفية جديدة.
- [x] **Terminal مع ألوان ANSI وبحث:** محلل ANSI escape codes، شريط بحث/فلترة مع عداد نتائج.
- [x] **اختصارات كيبورد عامة:** Ctrl+K, Ctrl+Shift+C, Ctrl+Shift+S, Escape, Ctrl+L.
- [x] **نظام التشخيص الذاتي (Self-Diagnostics):** 4 مؤشرات (WS, API, CLD, PRX) في الشريط العلوي مع حالة اتصال WebSocket.
- [x] **إضافة حذف الفروع (Delete Branch):** زر DELETE BRANCH في GitBranchSelector مع تأكيد ونقطة نهاية خلفية.
- [x] **حفظ تخطيط الشات:** حفظ chatLayout وعرض الشات في localStorage لاستعادتها بعد التحديث.
- [x] **تحسين CSS المتجاوب:** 3 مستويات من Media Queries للشاشات الصغيرة والأجهزة اللوحية.
- [x] **إزالة ضوضاء الكونسول:** استبدال console.log في جميع hooks الصوتية.

### المرحلة الثامنة: الاستقرار الهيكلي وتحسين جودة الكود (تم الإنجاز ✅)
- [x] **إصلاح EVOLUTION_TRIGGER:** إرجاع رسالة تأكيد نصية للمستخدم بدلاً من null صامت.
- [x] **إصلاح node-fetch timeout:** استبدال خاصية `timeout` غير المدعومة بـ `AbortController`.
- [x] **إصلاح ParticleReactor:** ربط أسماء الملفات بالجسيمات الثلاثية الأبعاد.
- [x] **تحسين ToastContainer:** تحويله إلى مكون منفصل لتقليل إعادة التصيير.
- [x] **إصلاح قياس CPU:** تغيير القيمة الافتراضية الأولى إلى `'0.0'` بدلاً من حمل تراكمي.
- [x] **ESLint 0 أخطاء 0 تحذيرات:** حل 4 تحذيرات في الواجهة الأمامية.

### المرحلة التاسعة: التحسين البصري التفاعلي وجودة الواجهة (تم الإنجاز ✅)
- [x] إضافة مؤشرات اختصارات لوحة المفاتيح لأزرار التحكم.
- [x] تحسين مؤشر البث المباشر في رسائل المساعد (مؤشر وامض + توهج).
- [x] إضافة انتقالات سلسة (Fade/Scale) للنوافذ المنبثقة باستخدام framer-motion.
- [x] إضافة أيقونات نوع الملف (File Type Icons) في CodeEditor.
- [x] إضافة نظام تخزين مؤقت (Caching) لشجرة الملفات في الخادم.
- [x] إضافة هيكل تحميل متحرك (Loading Skeleton) لشجرة الملفات.
- [x] إضافة رسم بياني لتدفق التوكن (Token Sparkline) في لوحة الموارد.

### المرحلة العاشرة: الاستقلال التام والتكامل الخارجي (تم الإنجاز ✅)
- [x] إضافة مكون ErrorBoundary شامل لالتقاط أخطاء التصيير.
- [x] تحسين Animations: AnimatePresence لجميع النوافذ المنبثقة مع exit animations.
- [x] تحسين Skeleton Loading: CodeEditor مع shimmer بدلاً من النص الثابت.
- [x] إضافة WebSocket Latency Indicator: قياس زمن الاستجابة وعرضه في التشخيص.
- [x] إضافة طوابع زمنية للرسائل في الدردشة.
- [x] إضافة نقطة نهاية REST `/api/metrics` لمقاييس النظام.
- [x] تحسين نظام الصوت: احترام إعداد i18n بدلاً من اللغة الثابتة.
- [x] **SettingsModal AnimatePresence:** motion.div with fade/scale and glassmorphic styling.
- [x] **WebSocket Connection Toasts:** Toast notifications for connect/reconnecting/disconnect.
- [x] **Uptime Display:** Poll /api/metrics every 5s, display HH:MM:SS in sys-details.
- [x] **New Keyboard Shortcuts:** Ctrl+Shift+E (Evolution), Ctrl+Shift+L (Lang), Ctrl+Shift+X (Abort).
- [x] **useCallback Optimization:** Wrapped 5 functions to prevent unnecessary re-renders.
- [x] **CPU Load Refactor:** Extracted duplicate CPU calculator into shared Logger.js export.
- [x] **index.css Cleanup:** Replaced Vite defaults with minimal global reset.
- [x] **i18n Splash Screen:** Suspense wrapper with cyber loading animation.
- [x] **Keyboard Shortcuts Modal:** `?` key toggles glassmorphic shortcuts overlay.
- [x] **StatusBar Component:** Persistent bottom bar with connection, latency, uptime, CPU/RAM, provider.
- [x] **Skeleton Loading:** Shimmer panels for system details, telemetry, and resource monitor.
- [x] **Toast Sounds:** Distinct audio feedback per toast type.
- [x] **Network Quality Indicator:** Color-coded latency label in diagnostics bar.

### المرحلة الحادية عشرة: التحسين البصري التفاعلي والتجربة الحسية (تم الإنجاز ✅)
- [x] **Animated SVG Circular Gauges:** New CircularGauge component with semi-circular arcs, animated fill, neon glow, and color interpolation.
- [x] **File Tree Search/Filter:** Real-time recursive search input with clear button and empty state.
- [x] **Offscreen Canvas Optimization:** Static background layer cached in offscreen canvas, reducing ParticleReactor draw calls by ~40%.
- [x] **StatusBar Quick Actions:** Compact icon buttons (Terminal, Settings, Abort) in status bar with hover effects.
- [x] **Radar Panel CSS Fix:** Complete glassmorphic styling with corner brackets and pulsing glow animation.
- [x] **ESLint Zero Errors:** Extracted CyberSplash component, deterministic skeleton widths, state-based CircularGauge animation.
- [x] **Cybernetic HexGrid Background:** Animated hexagonal grid with drift, distance-based alpha, pulsing on agent activity.
- [x] **Performance Monitoring Dashboard:** Real-time FPS counter, frame timing, memory usage — toggleable with Ctrl+Shift+M.
- [x] **Enhanced Corner Bracket Animations:** Hover-expanding brackets with neon glow on all 6 draggable panels.
- [x] **CyberSplash Diagnostic Boot:** Sequential 6-subsystem boot animation with progress bars and status indicators.
- [x] **Animated Data Flow Lines:** SVG particle streams flowing along bezier curves between panels.
- [x] **StatusBar Hover Previews:** Glassmorphic tooltips with mini sparklines for CPU/RAM on hover.

### المرحلة الثانية عشرة: الذروة البصرية السيبرانية والتجربة الحسية الغامرة (تم الإنجاز ✅)
- [x] **Cybernetic HUD SystemStatus Widget:** Animated SVG orbital rings with CPU/RAM progress arcs, pulsing reactor core, diagnostic status dots, and uptime display.
- [x] **Premium AudioVisualizer Component:** Standalone canvas-based visualizer with 4 modes (listening spectrogram, speaking sine waves, thinking radar sweep, idle heartbeat ripple) with glow effects and radial gradients.
- [x] **Glassmorphic CSS Overhaul:** Expanded CSS custom properties, glass-card pattern, cyber-btn with animated sweep, neon-text gradient, data-stream animation, glitch-text effect, and cyber-ring expand animation.
- [x] **Panel Scanline Effect:** Horizontal gradient sweep animation on all tech panels for premium HUD aesthetic.
- [x] **Enhanced CRT Scan-Beam Overlay:** Horizontal glowing beam sweeping top-to-bottom with fade in/out for premium retro-futuristic CRT aesthetic.
- [x] **Arwes-Inspired Corner Bracket Accents:** Hover-expanding corner brackets with neon glow, self-drawing header underlines on all tech panels.
- [x] **Tech Warning Badges & HUD Brackets:** `tech-panel-badge`, `tech-header-brackets`, `tech-telem-row`, `tech-cell` with left-edge gradient accent bar.
- [x] **Enhanced Reactor Core (ParticleReactor):** 7 concentric rings, dual tick-mark rings, 4 rotating arcs, 4 dashed spinning rings, purple accent ring, dual-layer central dot, 8 floating stats with pill containers.
- [x] **Enhanced Token Sparkline:** Grid background, total counter label, rounded bar gradients, 30-point history window.
- [x] **Cyber Flicker & Hex Corner Utilities:** Animation and clip-path utility classes.

### المرحلة الثالثة عشرة: التحسينات المتقدمة والذكاء الاصطناعي التفاعلي (تم الإنجاز ✅)
- [x] **Code Splitting & Lazy Loading:** Route-based splitting for EvolutionModal, SettingsModal, CodeEditor.
- [x] **System Hardware Integration:** Read CPU/RAM state and render interactive sparkline gauges in real-time.
- [x] **Widescreen Developer Comfort Layout:** Claims empty space and scales UI text to developer sizes (0.85rem / 0.78rem).

### المرحلة الرابعة عشرة: إطار العمل الذاتي المفتوح المصدر (قيد التنفيذ 🔄)
- [x] **إعادة تصميم التوثيق الرئيسي [README.md](file:///d:/iron%20man/README.md):** صياغة الهوية التنافسية العامة الخالية من أي مشتتات أو استراتيجيات خاصة مع دمج مخططات Mermaid التوضيحية.
- [x] **تجريد التوجيهات الحيوية سرياً:** حصر الموجهات الافتراضية محلياً والتركيز حصرياً على بروتوكول التحكم الأخير (Self-Destruct Protocol).
- [x] **بناء نموذج الإصلاح الذاتي النموذجي [self-healing-debug.js](file:///d:/iron%20man/examples/self-healing-debug.js):** كود نموذجي مذهل (Killer Use Case) يحلل أخطاء بناء البرمجيات ويقوم بتصحيح الملفات ذاتياً مع تبيان النتائج بجماليات ANSI ملونة.
- [ ] **إطلاق حزم أدوات التوثيق التلقائية:** أداة مسح الكود البرمجي وبناء الفهارس الفنية آلياً.

---
**توجيهات مارسيل:** حافظ على أمان ونظافة مساحة العمل، وتجنب رفع أي تحديثات برمجية سريّة أو خاصة ببيئة التداول إلى المستودع العام، ليكون المستودع دائماً مفيداً وموجهاً للمجتمع التقني بشكل احترافي.
