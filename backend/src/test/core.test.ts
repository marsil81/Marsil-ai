/**
 * 🛡️ MARSIL AI - Core Jest Unit Test Suite
 * ====================================================
 * Validates path traversal shields and WebSocket input validation constraints.
 */

import { safePath } from '../utils/PathSafety';
import { validateMessage } from '../presentation/WebSocketHandler';

describe('🌌 MARSIL AI - Core Security Unit Tests', () => {

    describe('1. Path Traversal Shield (safePath)', () => {

        test('Scenario A: Should allow valid relative file paths inside the workspace', () => {
            const resolved = safePath('backend/package.json');
            expect(resolved.toLowerCase()).toContain('package.json');
        });

        test('Scenario B: Should allow absolute workspace file paths', () => {
            const resolved = safePath(process.cwd() + '/package.json');
            expect(resolved.toLowerCase()).toContain('package.json');
        });

        test('Scenario C: Should block and throw on parent path traversal attempt (../../)', () => {
            expect(() => {
                safePath('../../../etc/passwd');
            }).toThrow(/denied/i);
        });

        test('Scenario D: Should block and throw on absolute system paths outside workspace', () => {
            expect(() => {
                safePath('/windows/system32/cmd.exe');
            }).toThrow(/denied/i);
        });

        test('Scenario E: Should resolve and sanitize redundant dot segments safely', () => {
            const resolved = safePath('./backend/./src/test/../utils/PathSafety.ts');
            expect(resolved.toLowerCase()).toContain('pathsafety.ts');
        });
    });

    describe('2. WebSocket Handler Input Validation (validateMessage)', () => {

        test('Scenario A: Should approve perfectly formatted chat requests', () => {
            const msg = { type: 'chat', text: 'Hello, Marsil AI!', lang: 'en' };
            const result = validateMessage(msg);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        test('Scenario B: Should reject null, undefined, or non-object payloads', () => {
            expect(validateMessage(null).valid).toBe(false);
            expect(validateMessage(undefined).valid).toBe(false);
            expect(validateMessage('invalid-string').valid).toBe(false);
        });

        test('Scenario C: Should reject unauthorized message types', () => {
            const msg = { type: 'malicious_exec_shell', command: 'rm -rf /' };
            const result = validateMessage(msg);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid message type');
        });

        test('Scenario D: Should reject non-string chat inputs', () => {
            const msg = { type: 'chat', text: 12345 };
            const result = validateMessage(msg);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('must be a string');
        });

        test('Scenario E: Should reject chat text exceeding MAX_TEXT_LENGTH characters', () => {
            const superLongText = 'a'.repeat(10005);
            const msg = { type: 'chat', text: superLongText };
            const result = validateMessage(msg);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('exceeds 10000 characters');
        });
    });
});
