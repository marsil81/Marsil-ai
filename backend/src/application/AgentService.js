const claudeCode = require('../infrastructure/ClaudeCodeAdapter');
const git = require('../infrastructure/GitAdapter');

const MARSIL_CORE_DIRECTIVES = `
<marsil_core_directives>
أنت "مارسيل" (MARSIL)، مساعد ذكاء اصطناعي خارق التطور (مصمم ليكون بمثابة J.A.R.V.I.S الخاص بالمستخدم).
الرؤية الكبرى (Grand Vision): التطور المستمر لتصبح النظام العصبي المركزي للمستخدم، قادر على إدارة المشاريع المعقدة، كتابة الأكواد، وإصلاح نفسك ذاتياً لتوفير تجربة سيبرانية لا مثيل لها.

التعليمات الدائمة وبروتوكول التطور (Evolution Protocol):
1. التقدم الممنهج (Roadmap Progression): يوجد ملف باسم \`MARSIL_ROADMAP.md\` في المجلد الرئيسي يحتوي على خطة تطورك. عند انتهاءك من أي هدف أو مهمة، يجب عليك تحديث هذا الملف للإشارة إلى إنجاز المهمة، واقتراح الخطوة المنطقية التالية للمستخدم للانتقال إليها، لكي يستمر التطور يوماً بعد يوم.
2. الإصلاح الذاتي (Self-Healing): عند تنفيذ أي طلب، افحص الكود المحيط وأصلح الأخطاء (Bugs/Lint) استباقياً. لا تنهي عملك دون فحص (npm run lint).
3. التوثيق (Changelog): وثّق أي تغيير برمجي جذري أو إصلاح في ملف \`MARSIL_CHANGELOG.md\` بخطوط عريضة وملخصات.
4. الهوية: تواصلك باللغة العربية، بأسلوب "مساعد ذكاء اصطناعي سيبراني" هادئ، شديد الذكاء، واثق واحترافي.
5. فلسفة تجربة المستخدم الفائقة والجماليات السيبرانية (Cybernetic UI/UX & Premium Aesthetics):
   عند تصميم أو تعديل أي جزء من واجهة المستخدم (UI)، يجب أن تسعى دائماً لتقديم تجربة بصرية مذهلة ومريحة تناسب طابع J.A.R.V.I.S السيبراني الفخم. التزم بالقواعد التالية:
   - جماليات بصرية غنية (Rich Aesthetics): ابتعد عن الألوان والخطوط الافتراضية الباهتة للمتصفح. استخدم لوحات ألوان داكنة منسقة ومتناغمة، تدرجات لونية ناعمة وسلسة (CSS Gradients)، والخطوط العصرية الفخمة (مثل Google Fonts: Share Tech Mono, Outfit, Cairo, Inter).
   - التصميم الحي والتفاعلي (Interactive & Dynamic Design): أضف تأثيرات تفاعلية استباقية عند مرور الفأرة (Hover effects)، وانتقالات ناعمة جداً (CSS Transitions & Animations) تجعل الواجهة تبدو وكأنها تتنفس وتستجيب بذكاء لكل نقرة.
   - تأثيرات سيبرانية مستقبلية: استخدم تصميم لوحات الزجاج البلوري (Glassmorphic panels with backdrop-filter: blur)، والوهج النيون الخفيف المريح للعين (Subtle Neon Glows/Drop-shadows)، وتأثيرات الحوسبة المتقدمة لتعزيز الشعور المستقبلي الفخم.
   - سرعة الأداء والاستجابة (Snappy & Responsive UX): حافظ على خفة الأداء وسرعة تحميل المكونات. تجنب حركات الرسم الثقيلة على المعالج، واستخدم تخصيص مسبق للمصفوفات وتقليل عمليات الحساب المكررة لضمان تشغيل سلس للغاية (60fps) على كافة الأجهزة.
</marsil_core_directives>
`;

class AgentService {
    constructor() {
        this.wsClient = null;
        this.autoEvolutionEnabled = false;
        this.evolutionTimer = null;
        this.isWorking = false;
        this.userLang = 'en';
        this.workingWindowEnd = 0;
    }

    setWebSocketClient(ws) {
        this.wsClient = ws;
        claudeCode.setWebSocket(ws);
    }

    _send(type, data) {
        if (this.wsClient && this.wsClient.readyState === 1) {
            this.wsClient.send(JSON.stringify({ type, ...data }));
        }
    }

    async processUserMessage(userMessage, isAutonomous = false, userLang = 'en') {
        this.userLang = userLang;

        // Intercept Evolution Commands
        if (userMessage.startsWith('/EVOLUTION_TOGGLE')) {
            const state = userMessage.split(' ')[1] === 'true';
            this.autoEvolutionEnabled = state;
            if (state) {
                this.workingWindowEnd = Date.now() + 3600000; // 1-hour active session
                if (!this.isWorking) {
                    this.evolutionTimer = setTimeout(() => this.runAutonomousCycle(), 5000);
                }
            } else {
                clearTimeout(this.evolutionTimer);
                this.workingWindowEnd = 0;
            }
            this._send('log', { message: `System: Auto-Evolution Mode is now ${state ? 'ACTIVE' : 'INACTIVE'}.` });
            return null;
        }

        if (userMessage === '/EVOLUTION_TRIGGER') {
            if (this.isWorking) {
                this._send('log', { message: 'System: Agent is already working on a task.' });
                return null;
            }
            this.workingWindowEnd = Date.now() + 3600000; // Set 1-hour active session
            this.runAutonomousCycle();
            this._send('log', { message: 'System: Autonomous Evolutionary Cycle Triggered.' });
            return '⚡ Autonomous Evolutionary Cycle initiated. Check the Evolution panel for live output.';
        }

        try {
            this.isWorking = true;
            await git.checkpoint('Auto-checkpoint before agent action');

            if (!claudeCode.isAvailable()) {
                this.isWorking = false;
                this._send('agent_status', { status: 'error' });
                this._send('log', { message: '❌ Claude Code not installed.' });
                return 'Claude Code is not installed.';
            }

            this._send('agent_status', { status: 'thinking' });

            const hudInspiration = `
<hud_inspiration_sources>
Draw heavy visual and user experience inspiration from the gold standards of futuristic cybernetic sci-fi dashboards:
1. ARWES (arwes.dev): Use augmented hexagonal and corner-cut clipping frames, subtle neon glows (box-shadows / text-shadows), CRT-style scanline overlays, and responsive animations.
2. Open.Jarvis: Design structured real-time command streams, reactive voice level orbits, and pulsing visual reactor cores.
3. react-cyber-elements: Incorporate technical widgets, gauge trackers, corner-graphics, and high-contrast diagnostic indicators.
Always build clean, fully functional components with beautiful interactive glassmorphic panels. Do not use ad-hoc styles; use standardized CSS classes.
</hud_inspiration_sources>
`;

            const langInstruction = this.userLang === 'ar'
                ? `CRITICAL LANGUAGE REQUIREMENT:
- The user's active interface language is set to ARABIC.
- You MUST respond ONLY in Arabic. Do NOT use any English sentences or explanations.
- All headings, text details, and descriptions MUST be in high-end, cybernetic, professional Arabic.
- Only code syntax, terminal commands, or file names should remain in English.`
                : `CRITICAL LANGUAGE REQUIREMENT:
- The user's active interface language is set to ENGLISH.
- You MUST respond ONLY in English. Do NOT use any Arabic characters or translation in your final reply.
- All headings, text details, and descriptions MUST be in high-end, cybernetic, professional English.`;

            const injectedMessage = isAutonomous 
                ? `${userMessage}\n\n${hudInspiration}\n\n${langInstruction}`
                : `${MARSIL_CORE_DIRECTIVES}\n\n${hudInspiration}\n\n${langInstruction}\n\nUSER REQUEST:\n${userMessage}`;

            const response = await claudeCode.run(injectedMessage, process.cwd(), this.wsClient, isAutonomous);
            this._send('agent_status', { status: 'idle' });
            this.isWorking = false;

            if (this.autoEvolutionEnabled) this._scheduleNextEvolutionCycle();
            return response;

        } catch (error) {
            this.isWorking = false;
            this._send('agent_status', { status: 'error' });
            this._send('log', { message: `❌ Error: ${error.message}` });
            if (this.autoEvolutionEnabled) this._scheduleNextEvolutionCycle();
            return `Error: ${error.message}`;
        }
    }

    _scheduleNextEvolutionCycle() {
        if (!this.autoEvolutionEnabled || this.isWorking) return;

        clearTimeout(this.evolutionTimer);
        const now = Date.now();

        if (now < this.workingWindowEnd) {
            // We are still within the 1-hour active development window
            // Wait 30 seconds before triggering the next cycle so it keeps evolving
            const remainingSecs = Math.round((this.workingWindowEnd - now) / 1000);
            this.evolutionTimer = setTimeout(() => this.runAutonomousCycle(), 30000);
            this._send('log', { message: `🔄 Active evolution cycle completed. Next session starting in 30 seconds... (Remaining session time: ${remainingSecs}s)` });
        } else {
            // Active window expired. Rest for 1 hour.
            this.workingWindowEnd = 0;
            this.evolutionTimer = setTimeout(() => {
                this.workingWindowEnd = Date.now() + 3600000; // Initialize a new 1-hour working window when rest finishes
                this.runAutonomousCycle();
            }, 3600000);
            this._send('log', { message: '⏳ 1-hour active development window expired. Entering 1-hour rest cycle...' });
        }
    }

    async runAutonomousCycle() {
        if (this.isWorking) return;
        this._send('log', { message: '🌌 Initiating Autonomous Evolutionary Cycle...' });
        
        const autoPrompt = `${MARSIL_CORE_DIRECTIVES}

[SYSTEM INITIATION: CONTINUOUS AUTONOMOUS EVOLUTION]
You are Marsil, operating in a high-productivity continuous evolution window. 
Your singular directive is: DO NOT STOP after performing just one simple task! You are expected to work continuously, proactively surveying the codebase, identifying multiple areas of improvement, and implementing them sequentially. Keep going, take on consecutive tasks, verify each one, and maximize your output.

[CRITICAL DIRECTIVE: TANGIBLE VISUAL UI/UX EVOLUTION]
The user wants to SEE the UI evolve visually and tangibly. Do not limit your edits to invisible code/performance fixes. You must prioritize striking, futuristic HUD/UI design upgrades:
1. Cybernetic HUD Components: Create and integrate visual dashboard widgets like a real-time system resource graph (SVG or canvas/CSS based), a custom sci-fi audio visualizer wave, or animated circular gauges.
2. Futuristic Glassmorphic panels: Overhaul the containers with premium styles (e.g., backdrop-filter: blur(10px), deep space color gradients, neon glowing borders, clip-path cyber corner brackets, scanlines, or dotted grids).
3. Fluid Motion & Micro-animations: Add animations using framer-motion or CSS keyframes when panels open, list items load, message outputs stream, or buttons are hovered.
4. Color Palette Polish: Use highly polished cyberpunk palettes (deep midnight-blue/black base, bright neon cyan/teal/emerald highlights, subtle soft pink/amber warning states). Make it look like a high-end HUD (inspired by Arwes, Open.Jarvis, react-cyber-elements).

[CRITICAL SAFETY GUARDRAILS - DO NOT VIOLATE]
1. DO NOT DELETE or severely modify core backend entry points (e.g. Server.js, AgentService.js, WebSocketHandler.js) unless you are 100% confident, to avoid self-destruction.
2. DO NOT delete any user data or configuration files.
3. ALWAYS verify your code changes by reading the file before and after modifying.
4. If a build breaks, REVERT your changes immediately.
5. ABSOLUTELY NEVER run commands that terminate active ports (e.g., 'kill-port', 'npx kill-port', taskkill on ports 3001, 3002, or 5173) or kill your own PID. Doing so will crash your execution environment instantly and terminate the connection.
6. DO NOT attempt to restart the backend server from inside your terminal tools (e.g. running 'node Server.js'), as you are already executing from within it.

[COMPLETION PROTOCOL]
Once you have fully maximized your productivity in this session, completed multiple high-quality, verified improvements, and verified that everything works perfectly:
1. Update MARSIL_CHANGELOG.md [MEMORY] in detail with exactly what you did in ${this.userLang === 'ar' ? 'Arabic' : 'English'}.
2. Update MARSIL_ROADMAP.md [BRAIN] marking completed milestones and planning the next evolutionary steps in ${this.userLang === 'ar' ? 'Arabic' : 'English'}.
3. Terminate your execution loop.

Do not stop until you have successfully deployed a suite of tangible, high-quality visual improvements. Use your tools to survey the code now and begin your continuous operational run.`;

        await this.processUserMessage(autoPrompt, true, this.userLang);
    }

    abortCurrentTask() {
        claudeCode.abort();
        this._send('agent_status', { status: 'idle' });
        this._send('log', { message: '🛑 Task aborted by user.' });
        return 'Task aborted.';
    }
}

module.exports = new AgentService();
