/**
 * VoiceService - Voice recognition + NLP parser for transaction data extraction.
 */

export interface ExtractedTransactionData {
    type: 'sale' | 'purchase' | 'expense' | null;
    productName: string | null;
    quantity: number | null;
    unit: string | null;
    price: number | null;
    totalAmount: number | null;
    customerName: string | null;
    customerPhone: string | null;
    paymentMethod: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | null;
    isDue: boolean;
    notes: string | null;
    confidence: number;
}

const UNIT_PATTERNS: { pattern: RegExp; unit: string }[] = [
    { pattern: /কেজি|কিলো|kg/gi, unit: 'কেজি' },
    { pattern: /লিটার|litre|liter/gi, unit: 'লিটার' },
    { pattern: /পিস|টা|টি|piece|pcs/gi, unit: 'পিস' },
    { pattern: /ডজন|dozen/gi, unit: 'ডজন' },
    { pattern: /বস্তা|bag/gi, unit: 'বস্তা' },
    { pattern: /প্যাকেট|packet/gi, unit: 'প্যাকেট' },
    { pattern: /গজ|yard/gi, unit: 'গজ' },
    { pattern: /মিটার|meter/gi, unit: 'মিটার' },
    { pattern: /সেট|set/gi, unit: 'সেট' },
    { pattern: /জোড়া|pair/gi, unit: 'জোড়া' },
    { pattern: /বোতল|bottle/gi, unit: 'বোতল' },
    { pattern: /হালি/gi, unit: 'হালি' },
];

const BENGALI_DIGITS: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

function bengaliToEnglish(text: string): string {
    return text.replace(/[০-৯]/g, (m) => BENGALI_DIGITS[m] || m);
}

function extractNumbers(text: string): number[] {
    const n = bengaliToEnglish(text);
    const m = n.match(/\d+\.?\d*/g);
    return m ? m.map(Number) : [];
}

const SALE_KW = ['বিক্রি', 'বিক্রয়', 'sell', 'sale', 'দিন', 'দাও', 'নিন', 'লাগবে'];
const PURCHASE_KW = ['ক্রয়', 'কিনলাম', 'buy', 'purchase', 'আনলাম'];
const EXPENSE_KW = ['খরচ', 'ব্যয়', 'expense', 'বিল', 'ভাড়া', 'বেতন'];
const DUE_KW = ['বাকি', 'বাক্কি', 'due', 'credit', 'পরে দিব'];
const PHONE_RE = /(?:0?1[3-9]\d{8})/g;

const PAY_PATTERNS: { p: RegExp; m: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' }[] = [
    { p: /বিকাশ|bkash/gi, m: 'bkash' },
    { p: /নগদ\s*পে|nagad/gi, m: 'nagad' },
    { p: /রকেট|rocket/gi, m: 'rocket' },
    { p: /ব্যাংক|bank/gi, m: 'bank' },
    { p: /ক্যাশ|নগদ|cash/gi, m: 'cash' },
];

export function parseVoiceInput(
    text: string,
    products: { name: string; id: string; sellingPrice: number; unit: string }[] = [],
    contacts: { name: string; phone?: string }[] = [],
): ExtractedTransactionData {
    const r: ExtractedTransactionData = {
        type: null, productName: null, quantity: null, unit: null,
        price: null, totalAmount: null, customerName: null,
        customerPhone: null, paymentMethod: null, isDue: false,
        notes: null, confidence: 0,
    };
    const t = text.toLowerCase().trim();
    let cp = 0, tc = 0;

    tc++;
    if (SALE_KW.some(k => t.includes(k))) { r.type = 'sale'; cp++; }
    else if (PURCHASE_KW.some(k => t.includes(k))) { r.type = 'purchase'; cp++; }
    else if (EXPENSE_KW.some(k => t.includes(k))) { r.type = 'expense'; cp++; }
    else r.type = 'sale';

    tc++;
    let best: typeof products[0] | null = null, bs = 0;
    for (const p of products) {
        const pl = p.name.toLowerCase();
        if (t.includes(pl) && pl.length > bs) { bs = pl.length; best = p; }
    }
    if (best) { r.productName = best.name; r.price = best.sellingPrice; r.unit = best.unit; cp++; }

    tc++;
    const nums = extractNumbers(t);
    if (nums.length > 0) {
        for (const up of UNIT_PATTERNS) {
            const um = t.match(up.pattern);
            if (um) {
                r.unit = up.unit;
                const ui = t.indexOf(um[0].toLowerCase());
                const near = t.substring(Math.max(0, ui - 20), ui);
                const nn = extractNumbers(near);
                if (nn.length > 0) { r.quantity = nn[nn.length - 1]; cp++; }
                break;
            }
        }
        if (r.quantity === null && nums[0] < 10000) r.quantity = nums[0];
    }

    tc++;
    const pp = [/(?:টাকা|৳|taka|tk)\s*(\d+)/gi, /(\d+)\s*(?:টাকা|৳|taka|tk)/gi, /মোট\s*(\d+)/gi];
    for (const pat of pp) {
        const m = bengaliToEnglish(t).match(pat);
        if (m) { const n = extractNumbers(m[0]); if (n.length > 0) { r.totalAmount = n[n.length - 1]; cp++; } break; }
    }
    if (r.quantity && r.price && !r.totalAmount) r.totalAmount = r.quantity * r.price;
    if (r.totalAmount && r.quantity && !r.price) r.price = r.totalAmount / r.quantity;

    tc++;
    for (const pm of PAY_PATTERNS) { if (pm.p.test(t)) { r.paymentMethod = pm.m; cp++; break; } }

    tc++;
    if (DUE_KW.some(k => t.includes(k))) { r.isDue = true; cp++; }

    tc++;
    for (const c of contacts) {
        if (t.includes(c.name.toLowerCase())) { r.customerName = c.name; r.customerPhone = c.phone || null; cp++; break; }
    }
    if (!r.customerPhone) {
        const pm = bengaliToEnglish(t).match(PHONE_RE);
        if (pm) r.customerPhone = pm[0].startsWith('0') ? pm[0] : '0' + pm[0];
    }

    r.confidence = Math.min(100, Math.round((cp / tc) * 100));
    return r;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'done' | 'error';

export const SAMPLE_CONVERSATIONS = [
    'ভাই চাল 5 কেজি দিন, 60 টাকা কেজি',
    'তেল 2 লিটার বিক্রি, মোট 300 টাকা, বিকাশে',
    'ডিম 2 হালি লাগবে, 240 টাকা',
    '500 টাকার চিনি দিন',
];
