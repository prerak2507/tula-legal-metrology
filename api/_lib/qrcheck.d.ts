export interface QrFlag { level: 'warn' | 'info'; message: string }
export interface QrPrecheck { kind: 'payment' | 'wifi' | 'contact' | 'phone' | 'product_code' | 'link' | 'text'; host?: string; flags: QrFlag[] }
export function maskSensitive(text: string): string;
export function precheckQr(raw: string): QrPrecheck;
export function safeAiText(t: string): string | null;
