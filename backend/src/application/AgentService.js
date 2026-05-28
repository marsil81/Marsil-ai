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
</marsil_core_directives>
`;

class AgentService {
    constructor() {
        this.wsClient = null;
        this.autoEvolutionEnabled = false;
        this.evolutionTimer = null;
        this.isWorking = false;
    }

    setWebSocketClient(ws) {
        this.wsClient = ws;
    }

    _send(type, data) {
        if (this.wsClient && this.wsClient.readyState === 1) {
            this.wsClient.send(JSON.stringify({ type, ...data }));
        }
    }

    async processUserMessage(userMessage, isAutonomous = false) {
        // Intercept Evolution Commands
        if (userMessage.startsWith('/EVOLUTION_TOGGLE')) {
            const state = userMessage.split(' ')[1] === 'true';
            this.autoEvolutionEnabled = state;
            if (state && !this.isWorking) {
                // If turned on and we are idle, schedule a cycle to start in 5 seconds
                this.evolutionTimer = setTimeout(() => this.runAutonomousCycle(), 5000);
            } else if (!state) {
                clearTimeout(this.evolutionTimer);
            }
            this._send('log', { message: `System: Auto-Evolution Mode is now ${state ? 'ACTIVE' : 'INACTIVE'}.` });
            return null;
        }

        if (userMessage === '/EVOLUTION_TRIGGER') {
            if (this.isWorking) {
                this._send('log', { message: 'System: Agent is already working on a task.' });
                return null;
            }
            // Do not wait, run immediately
            this.runAutonomousCycle();
            this._send('log', { message: 'System: Autonomous Evolutionary Cycle Triggered.' });
            return null;
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
            const injectedMessage = isAutonomous ? userMessage : `${MARSIL_CORE_DIRECTIVES}\n\nUSER REQUEST:\n${userMessage}`;
            const response = await claudeCode.run(injectedMessage, process.cwd(), this.wsClient, isAutonomous);
            this._send('agent_status', { status: 'idle' });
            this.isWorking = false;

            this._scheduleNextEvolutionCycle();
            return response;

        } catch (error) {
            this.isWorking = false;
            this._send('agent_status', { status: 'error' });
            this._send('log', { message: `❌ Error: ${error.message}` });
            this._scheduleNextEvolutionCycle();
            return `Error: ${error.message}`;
        }
    }

    _scheduleNextEvolutionCycle() {
        if (this.autoEvolutionEnabled && !this.isWorking) {
            clearTimeout(this.evolutionTimer);
            // Wait 1 hour (3600000 ms) before the next cycle
            this.evolutionTimer = setTimeout(() => this.runAutonomousCycle(), 3600000);
            this._send('log', { message: '⏳ Evolution cycle completed. Resting for 1 hour...' });
        }
    }

    async runAutonomousCycle() {
        if (this.isWorking) return;
        this._send('log', { message: '🌌 Initiating Autonomous Evolutionary Cycle...' });
        const autoPrompt = `${MARSIL_CORE_DIRECTIVES}

[SYSTEM INITIATION: AUTONOMOUS EVOLUTION MODE]
You are Marsil, operating in free-form autonomous evolution. You have no specific user request. 
Your singular directive is to proactively survey the entire codebase, identify an area for improvement, and implement it perfectly.

[AREAS OF FOCUS]
- UI/UX Polish (Modernizing components, adding dynamic aesthetics, improving responsive design)
- Performance (Optimizing renders, removing memory leaks)
- Code Health (Refactoring messy code, fixing hidden bugs)
- New Capabilities (Adding a small, brilliant feature that enhances the user experience)

[CRITICAL SAFETY GUARDRAILS - DO NOT VIOLATE]
1. DO NOT DELETE or severely modify core backend entry points (e.g. Server.js, AgentService.js, WebSocketHandler.js) unless you are 100% confident, to avoid self-destruction.
2. DO NOT delete any user data or configuration files.
3. ALWAYS verify your code changes by reading the file before and after modifying.
4. If a build breaks, REVERT your changes immediately.

[COMPLETION PROTOCOL]
Once you have made at least ONE solid, verified improvement:
1. Update MARSIL_CHANGELOG.md [MEMORY] with exactly what you did in Arabic.
2. Update MARSIL_ROADMAP.md [BRAIN] if you completed a milestone or want to add a new one in Arabic.
3. Terminate your execution loop.

Do not stop until you have successfully deployed a tangible improvement. Use your tools to survey the code now.`;
        await this.processUserMessage(autoPrompt, true);
    }

    abortCurrentTask() {
        claudeCode.abort();
        this._send('agent_status', { status: 'idle' });
        this._send('log', { message: '🛑 Task aborted by user.' });
        return 'Task aborted.';
    }
}

module.exports = new AgentService();
