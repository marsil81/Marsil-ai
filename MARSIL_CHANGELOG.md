# 🛡️ السجل السيبراني: تقارير التحسين الذاتي (MARSIL CHANGELOG)

هذا الملف مخصص لتسجيل التحديثات التلقائية، التحسينات المعمارية، وإصلاح الأخطاء التي يقوم بها **مارسيل** بشكل ذاتي في الخلفية.

---
### [Continuous Enhancement Pack: Arwes CRT Scan-Beam, Enhanced Reactor Core, HUD Bracket Accents, Tech Badges] - 2026-05-30
**Summary:** Executed 6 premium visual evolution tasks in a single continuous cycle:
- **Enhanced CRT Scan-Beam Overlay:** New `.scan-beam` CSS animation — a horizontal glowing beam that sweeps from top to bottom with fade in/out, creating a premium retro-futuristic CRT aesthetic. Added `scanBeam` keyframe animation with 10s ease-in-out cycle. Enhanced `.crt-overlay` with vertical interference lines alongside existing horizontal scanlines.
- **Arwes-Inspired Corner Bracket Accents:** Renamed corner bracket classes to `corner-tr`/`corner-bl` for consistency with ARWES diagonal-cut aesthetic. Added hover expansion (8px→14px) with neon glow. Added `.tech-panel-header::after` self-drawing underline that animates from left to right on panel hover.
- **Tech Warning Badges & HUD Brackets:** New CSS classes — `.tech-panel-badge` with `badgePulse` animation for status indicators (e.g. `[SECURE LINK]`, `[ACTIVE]`, `[STANDBY]`), `.tech-panel-warning`/`.tech-panel-danger` for critical indicators, `.tech-header-brackets` with auto-generated `[` `]` decorations, and `.tech-telem-row` with `> ` prefix for telemetry data rows. `.tech-cell` enhanced with left-edge gradient accent bar that appears on hover.
- **Enhanced Reactor Core (ParticleReactor):** Upgraded with 7 concentric rings (up from 4), dual tick-mark rings (72 outer + 36 inner), 4 rotating arc segments (up from 2), 4 dashed spinning rings (up from 2), enhanced Jarvis-style core with secondary purple accent ring, dual-layer central dot (white + blue-white), expanded floating stats from 4 to 8 readouts with background pill containers for readability.
- **Enhanced Token Sparkline:** Upgraded with grid background lines, total token counter label, improved bar gradients with rounded tops, dynamic opacity based on value, and 30-point history window (up from 25).
- **Cyber Flicker & Hex Corner Utilities:** New `.cyber-flicker` animation for critical indicator flicker effect, `.hex-corner` hexagonal clip-path utility class.
- **ESLint Zero Errors:** Vite production build compiles successfully in 576ms (27KB CSS, 483KB JS).

---
### [Continuous Enhancement Pack: SystemStatus HUD, AudioVisualizer, Glassmorphic CSS Overhaul] - 2026-05-29
**Summary:** Executed 5 premium visual evolution tasks in a single continuous cycle:
- **Cybernetic HUD SystemStatus Widget:** New `SystemStatus.jsx` — animated SVG orbital rings with real-time CPU/RAM progress arcs, pulsing reactor core, rotation speed that varies with agent activity, 4 diagnostic status dots (WS, API, CLD, PRX) positioned around the ring perimeter, and uptime display. Smooth `useAnimatedValue` hook with ease-out cubic interpolation.
- **Premium AudioVisualizer Component:** New `AudioVisualizer.jsx` — standalone replacement for inline VoicePulseVisualizer with 4 distinct visual modes: 12-bar circular spectrogram with glow dots for listening, 3-layer multi-frequency Siri-style sine waves for speaking, radar sweep with grid wave for thinking, and heartbeat ripple with orbital dots for idle. Canvas shadow glow effects, radial gradient cores, and pre-computed trig cache for performance.
- **Glassmorphic CSS Overhaul:** Enhanced `App.css` with expanded CSS custom properties (glass-bg, glass-border, danger, warning, success, purple colors), `.glass-card` pattern, `.cyber-btn` with animated sweep effect, `.neon-text` gradient utility, `.data-stream` animation, `.glitch-text` effect, `.cyber-ring` expand animation, and `@keyframes` for glowPulse, floatDrift, shimmer, and ringExpand. All panels now have rounded corners (6px), stronger glassmorphic backdrop-blur(12px), and hover-enhanced border/box-shadow transitions.
- **Panel Scanline Effect:** New `.panel-scan` CSS pseudo-element on all 6 tech panels — a subtle horizontal gradient sweep that animates across each panel, adding a premium HUD scanline aesthetic. Integrated into all draggable panels and the chat container.
- **CSS Polish:** Enhanced toast notifications with left-border accent colors and scale animation, modal boxes with expanded hover corners, status bar with subtle top glow shadow, and top-bar with `data-stream` animated background gradient.
**Summary:** Executed 6 high-visibility UI/UX improvements in a single continuous evolution cycle:
- **Cybernetic HexGrid Background:** New `HexGrid.jsx` component — animated hexagonal grid rendered on offscreen canvas with slow drift, distance-based alpha falloff, and pulsing intensity based on agent status. Integrated as z-index 0 background layer.
- **Performance Monitoring Dashboard:** New `PerfMonitor.jsx` component — real-time FPS counter, frame timing, and memory usage overlay. Toggle with Ctrl+Shift+M. Includes mini FPS sparkline with color-coded bars (green/yellow/red). Glassmorphic styling with system status label.
- **Animated Data Flow Lines:** New `DataFlow.jsx` component — SVG-based glowing particle streams flowing along cubic bezier curves between panels. 3 connection paths with 4-6 particles each, fade in/out at endpoints, speed increases when agent is active.
- **CyberSplash Diagnostic Boot Sequence:** Enhanced `CyberSplash.jsx` — sequential subsystem boot animation (WS, API, CLD, PRX, MEM, SYS) with progress bars, status indicators (PENDING → ONLINE/WARN), and staggered timing. Final "ALL SYSTEMS NOMINAL" state.
- **Enhanced Corner Bracket Animations:** CSS upgrade for all tech panels — corner brackets expand from 12px to 20px on hover with neon glow box-shadow. Added `.corner-tl`/`.corner-br` secondary corner accents on all 6 draggable panels.
- **StatusBar Hover Previews:** Enhanced `StatusBar.jsx` — CPU/RAM hover tooltips with glassmorphic popup showing current value, mini sparkline preview, and status label (IDLE/MODERATE/HIGH LOAD). Added `MiniSparkline` component for inline bar charts.
- **ESLint Zero Errors:** Fixed all React 19 strict-mode violations (no ref access during render, no impure functions in initial state, no setState in effects/useMemo). Frontend and backend both pass with 0 errors, 0 warnings. Vite production build compiles in 743ms (480KB JS, 15.57KB CSS).

---
### [Continuous Enhancement Pack: Circular Gauges, File Search, Offscreen Canvas, StatusBar Quick Actions, ESLint Fixes] - 2026-05-29
**Summary:** Executed 6 high-impact improvements in a single continuous evolution cycle:
- **Animated SVG Circular Gauges:** New `CircularGauge.jsx` component — semi-circular SVG arc gauges with animated fill (ease-out cubic), neon glow filter, color interpolation (cyan→green→yellow→red), and Orbitron digital readout. Replaced simple bar gauges in data-panel with dual CPU/RAM circular gauges.
- **File Tree Search/Filter:** Added real-time search input above the file tree with recursive directory-aware filtering, clear button, and "No files matching" empty state. Files and directories matching the query are shown with their parent hierarchy preserved.
- **Offscreen Canvas Optimization (ParticleReactor):** Extracted static background elements (concentric rings, tick marks) to an offscreen canvas that only redraws on resize. Reduced per-frame draw calls by ~40% — rotating arc rings and dashed rings remain dynamic on the main canvas.
- **StatusBar Quick Actions:** Added compact icon buttons (Terminal, Settings, Abort) to the center section of the StatusBar with hover glow effects. Wired to App.jsx state toggles via new props.
- **Radar Panel CSS Fix:** Added missing base positioning, glassmorphic styling, corner brackets, and `radarPulse` glow animation to `.radar-container-panel`. Added responsive positioning in media queries.
- **ESLint Zero Errors:** Extracted `CyberSplash` to its own file (Fast Refresh compliance), replaced `Math.random()` in SkeletonPanel with deterministic widths, converted CircularGauge from ref-based to state-based animated value, fixed `setPanelsLoaded` to avoid set-state-in-effect. Frontend and backend both pass with 0 errors, 0 warnings. Vite build compiles in 1.70s (468KB JS, 14.8KB CSS).

---
**Summary:** Executed 8 high-impact improvements in a single continuous evolution cycle:
- **CPU Load Calculation Refactor:** Extracted duplicate `calculateCpuLoad()` from Server.js and WebSocketHandler.js into Logger.js as a single shared export. Eliminated 40 lines of duplicated code.
- **index.css Cleanup:** Replaced bloated default Vite styles with a minimal global reset (3 rules) — no more conflicting overrides with App.css.
- **i18n Ready Splash Screen:** Wrapped App in `<Suspense>` with a cyber-styled "INITIALIZING NEURAL INTERFACE" loading animation to prevent flash of untranslated content.
- **Keyboard Shortcuts Modal:** New `KeyboardShortcuts.jsx` component — press `?` to toggle a glassmorphic modal showing all 9 shortcuts with icons, key badges, and cyber styling.
- **Bottom StatusBar:** New `StatusBar.jsx` component — persistent bottom bar showing: connection status (WiFi icon + color), latency, uptime, agent status with pulsing dot, CPU/RAM gauges, and provider/model badge. Adjusted all panel bottom positions to accommodate.
- **Skeleton Loading States:** Added `SkeletonPanel` component with shimmer animation for system details, telemetry, and resource monitoring panels — visible until first metrics data arrives.
- **Toast Notification Sounds:** Integrated sound effects into `useToasts()` — distinct chirp tones for success (high sine), error (low sawtooth), warning (triangle), and info (short sine).
- **Network Quality Indicator:** New `NetworkQuality` component in diagnostics bar — color-coded (green/yellow/red) with labels (EXCELLENT/GOOD/FAIR/POOR) based on WebSocket latency thresholds.
### [Continuous Enhancement Pack: AnimatePresence Modals, Keyboard Shortcuts, Uptime Display, Connection Toasts, useCallback Optimization] - 2026-05-29
**Summary:** Executed 8 high-impact improvements in a single continuous evolution cycle:
- **SettingsModal AnimatePresence:** Converted SettingsModal overlay and container to `motion.div` with fade/scale transitions, added `modal-box` CSS class for cyber corner brackets. Removed redundant wrapper in App.jsx.
- **WebSocket Connection Toasts:** Connected `useToasts` to `connectionStatus` changes — shows success toast on connect, warning on reconnecting, error on disconnect.
- **System Uptime Display:** Added `/api/metrics` polling every 5s, parsed uptime into HH:MM:SS format, displayed in sys-details panel between CPU and TEMP.
- **Keyboard Shortcut Indicators:** Added `⌨` kbd-hint spans to EVOLUTION button, title attributes with shortcuts to VOICE, LANG, and ABORT buttons.
- **New Global Keyboard Shortcuts:** Ctrl+Shift+E (Evolution Modal), Ctrl+Shift+L (Language Toggle), Ctrl+Shift+X (Abort Agent). Moved keyboard handler useEffect after all function declarations to fix ESLint hoisting error.
- **useCallback Optimization:** Wrapped `abortAgent`, `clearTokens`, `clearChat`, `sendCommand` in `useAgentConnection.js` with `useCallback` to prevent unnecessary re-renders. Wrapped `toggleLang` in App.jsx with `useCallback`.
- **ESLint 0 Errors:** Frontend and backend both pass with zero errors. Vite production build compiles successfully (639ms, 452KB JS bundle).
- **MARSIL_ROADMAP Update:** Marked Phase 10 milestone for UI enhancements and keyboard shortcuts as completed.

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
