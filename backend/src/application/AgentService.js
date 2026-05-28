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
        const autoPrompt = `${MARSIL_CORE_DIRECTIVES}\n\nYou are in Autonomous Evolution Mode. You have no specific user request. Your goal is to survey the entire codebase, find the next logical micro-improvement (e.g. UI/UX, performance, code cleanliness, or bugs), and implement it perfectly. You must then update the MARSIL_CHANGELOG.md and MARSIL_ROADMAP.md. Do not stop until you have made at least one solid improvement. Use your tools to check the code first.`;
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
