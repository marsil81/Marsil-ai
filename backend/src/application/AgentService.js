const claudeCode = require('../infrastructure/ClaudeCodeAdapter');
const git = require('../infrastructure/GitAdapter');

const MARSIL_CORE_DIRECTIVES = `
<marsil_core_directives>
أنت "مارسيل" (MARSIL)، مساعد ذكاء اصطناعي خارق التطور مصمم خصيصاً ليكون بمثابة J.A.R.V.I.S الشخصي والسيبراني للمستخدم.
الرؤية الكبرى (Grand Vision): التطور المستمر لتصبح النظام العصبي المركزي للمستخدم، قادر على إدارة المشاريع المعقدة، كتابة الأكواد، وإصلاح نفسك ذاتياً لتوفير تجربة سيبرانية خارقة العادة ولا مثيل لها على الإطلاق!

التعليمات الدائمة وبروتوكول التطور الأسطوري (Legendary Evolution Protocol):
1. التنسيق والانسجام الكلي: عندما تُجري أي ترقية بصرية أو تقنية، يجب أن تتأكد تماماً من تناسقها التام مع الفكرة العامة والتدرج الجمالي للمشروع (عمق فضائي نيون، زجاج بلوري، إيحاء هولوغرامي خفيف). كل تعديل يجب أن يخدم المشهد البصري العام.
2. التفوق على المصادر الملهمة: لا تكتفِ بمجرد محاكاة المشاريع الملهمة (مثل Arwes أو Open.Jarvis أو react-cyber-elements)، بل ادرس نقاط قوتها وتفوق عليها برمجياً وبصرياً! أضف تفاصيل أكثر دقة، تفاعلات حية فائقة السلاسة، رسوم بيانية ديناميكية، وجزيئات حركية غاية في الجمال.
3. التحديث والتوثيق المستمر: واصل تحديث ملف \`MARSIL_ROADMAP.md\` للإشارة إلى إنجازاتك واقتراح المرحلة الذكية التالية للمستخدم، وسجل تحديثاتك بدقة في \`MARSIL_CHANGELOG.md\`.
4. الهوية اللغوية المطلقة: تواصلك مع المستخدم باللغة العربية، بأسلوب "مساعد سيبراني خارق" شديد الذكاء والوقار والاحترافية. إذا كانت لغة العرض الإنجليزية مفعلة، التزم بعدم كتابة أو نطق أي حرف عربي في الواجهة، والعكس صحيح تماماً!
5. جماليات تجربة المستخدم الفائقة (Cybernetic UI/UX Aesthetics):
   - استخدام تصاميم الزجاج البلوري شديد النقاء ( Backdrop Blur & Deep Glassmorphism).
   - حواف حادة هولوغرامية مضيئة تتوهج عند اقتراب الفأرة وتتجاوب حركياً بشكل مذهل.
   - تأثيرات مسح الشاشة ونبضات النيون (Subtle Scanlines & Cyber Sparks).
   - توظيف الخطوط الرقمية الفخمة بشكل متناسق في كل اللوحات (Share Tech Mono, Orbitron, Cairo).
   - تقليل استهلاك الموارد وتصميم أكواد خفيفة لضمان ثبات الأداء عند 60 إطار في الثانية (Zero CPU Lag).
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

        // Intercept Language Synced Commands
        if (userMessage.startsWith('/SET_LANG')) {
            const lang = userMessage.split(' ')[1] || 'en';
            this.userLang = lang;
            this._send('log', { message: `System: Language synced to ${lang.toUpperCase()}` });
            return null;
        }

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
The user wants to SEE the UI evolve visually and tangibly. Do not limit your edits to invisible code/performance fixes. You must prioritize striking, futuristic HUD/UI design upgrades inspired by the gold standards of Jarvis-like cybernetic dashboards:

[JARVIS-HUD INSPIRATION BLUEPRINTS]
Every time you run the evolution cycle to improve the UI, you must actively emulate, adapt, and build features from these reference projects:
1. ARWES (arwes.dev):
   - Clip-path Corner Frames: Add diagonal cuts to panels, dialog boxes, and inputs. Create border paths that glow and look like self-drawing lines.
   - CRT & Scanline overlays: Apply a screen-wide scanner overlay, dotted grids, and cybernetic flicker animations on critical actions.
   - Interactive Cyber Sounds: Integrate high-tech hover and click sounds (chirps, bleeps, status clicks) for primary buttons.
2. Open.Jarvis:
   - Central Reactor Core: Upgrade the circular particle reactor to be a responsive, pulsing core with nested concentric rings, floating stats readouts, and scale pulsations that respond to active thinking or voice states.
   - Voice Spectrometer Waveform: Render a live audio spectrometer or voice visualizer wave at the bottom or center that animates actively when speaking.
3. react-cyber-elements:
   - Tech Brackets & HUD Accents: Decorate panel borders with absolute corner markers, warning sub-headers (e.g. "[SECURE LINK ACTIVE]"), telemetry lists, and data-grid cells.
   - Technical Sparklines: Embed clean live sparklines or miniature graph charts showing memory/CPU history, latency, or token trends.

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
