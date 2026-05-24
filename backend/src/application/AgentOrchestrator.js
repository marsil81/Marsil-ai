/**
 * Marsil Multi-Agent Orchestrator
 * ════════════════════════════════
 * Pillar 1: Orchestrator-Workers Pattern
 * 
 * Splits complex tasks into sub-tasks and routes them to specialized agents:
 * - Architect Agent: analyzes requirements & plans
 * - Coder Agent: writes & modifies code
 * - QA Agent: tests & validates output
 */

class AgentOrchestrator {
    constructor() {
        this.plans = [];
    }

    /**
     * Analyze a user's request and determine if it needs multi-agent coordination.
     * Returns a structured plan with sub-tasks.
     */
    analyze(userMessage) {
        const msg = userMessage.toLowerCase();

        // Detect complexity signals
        const isComplex =
            msg.includes('أنشئ') || msg.includes('create') ||
            msg.includes('build') || msg.includes('refactor') ||
            msg.includes('أعد كتابة') || msg.includes('أصلح كل') ||
            msg.includes('fix all') || msg.includes('redesign') ||
            (msg.length > 200);

        const needsTest =
            msg.includes('test') || msg.includes('اختبر') ||
            msg.includes('verify') || msg.includes('تحقق');

        if (!isComplex) {
            return {
                mode: 'single',
                steps: [{ agent: 'coder', task: userMessage }]
            };
        }

        // Build multi-step plan
        const steps = [];

        // Step 1: Architect analyzes
        steps.push({
            agent: 'architect',
            task: `حلل المتطلبات التالية وقدم خطة تنفيذ مختصرة بالنقاط (بدون كتابة كود):\n${userMessage}`
        });

        // Step 2: Coder executes
        steps.push({
            agent: 'coder',
            task: userMessage
        });

        // Step 3: QA validates (if requested or complex)
        if (needsTest) {
            steps.push({
                agent: 'qa',
                task: `راجع التعديلات الأخيرة وتأكد من عدم وجود أخطاء. نفذ أي اختبارات متاحة.`
            });
        }

        return { mode: 'multi', steps };
    }

    /**
     * Build a system prompt tailored for each agent role.
     */
    getSystemPrompt(agentRole) {
        switch (agentRole) {
            case 'architect':
                return `أنت وكيل التصميم المعماري لنظام Marsil. مهمتك تحليل المتطلبات وإنشاء خطة تنفيذ مختصرة ومنظمة.
لا تكتب أي كود. فقط حدد الملفات المطلوبة والتعديلات اللازمة والترتيب الصحيح للتنفيذ.
كن مختصراً جداً - أقل من 200 كلمة.`;

            case 'coder':
                return `أنت وكيل البرمجة لنظام Marsil. مهمتك كتابة وتعديل الكود باستخدام الأدوات المتاحة.
اكتب كوداً نظيفاً وفعالاً. استخدم الأدوات مباشرة بدون شرح مطول.
وفر التوكنز: لا تقرأ ملفات كاملة إذا كنت تعرف المكان المطلوب تعديله.`;

            case 'qa':
                return `أنت وكيل ضمان الجودة لنظام Marsil. مهمتك مراجعة التعديلات الأخيرة.
نفذ الأوامر اللازمة للتحقق (npm test, npm run build, etc).
إذا وجدت خطأ، أبلغ عنه بوضوح مع اسم الملف ورقم السطر.`;

            default:
                return '';
        }
    }

    /**
     * Format a plan summary for display in the HUD telemetry.
     */
    formatPlanSummary(plan) {
        if (plan.mode === 'single') return '[ Single-Agent Mode ]';
        return plan.steps.map((s, i) =>
            `${i + 1}. [${s.agent.toUpperCase()}] ${s.task.slice(0, 60)}...`
        ).join('\n');
    }
}

module.exports = new AgentOrchestrator();
