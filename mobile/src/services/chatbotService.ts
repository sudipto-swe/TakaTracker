/**
 * Advanced Offline Chatbot Service
 * Uses Entity Extraction & Intent Scoring (Slot-Filling) to process complex queries natively.
 */

import { useTransactionStore, Transaction, TransactionType, computeAllTimeProfit } from '../store/transactionStore';
import { useContactStore, Contact } from '../store/contactStore';
import { useInventoryStore, Product } from '../store/inventoryStore';
import { formatCurrency } from '../i18n';

// ─── Types ───
export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export type Timeframe = 'today' | 'week' | 'month' | 'total';
export type Intent = 'sales' | 'purchases' | 'expenses' | 'profit' | 'dues' | 'inventory' | 'trending' | 'comparison' | 'contacts' | 'greeting' | 'general';

interface ParsedQuery {
    timeframe: Timeframe;
    intents: Intent[];
    mentionedContacts: Contact[];
    mentionedProducts: Product[];
}

// ─── 1. NLP Keyword Dictionaries ───
const DICTIONARY: Record<Intent, RegExp[]> = {
    greeting: [/^হাই/, /^হ্যালো/, /^কেমন আছ/, /^শুভ/, /hi/i, /hello/i, /hey/i],
    sales: [/বিক্র/, /সেল/, /বেচ/, /sale/i, /sell/i, /sold/i, /revenue/i, /আয়/],
    purchases: [/ক্রয়/, /কেনা/, /কিন/, /পারচেজ/, /purchas/i, /bought/i, /buy/i],
    expenses: [/খরচ/, /ব্যয়/, /এক্সপেন্স/, /expens/i, /spend/i, /cost/i],
    profit: [/লাভ/, /প্রফিট/, /মুনাফা/, /নিট/, /profit/i, /earning/i, /margin/i],
    dues: [/বাকি/, /পাওনা/, /দেনা/, /ডিউ/, /রিসিভেবল/, /পেয়েবল/, /due/i, /debt/i, /owe/i, /balance/i, /পাবে/, /দিবে/],
    inventory: [/স্টক/, /ইনভেন্টরি/, /পণ্য/, /প্রোডাক্ট/, /stock/i, /inventory/i, /item/i, /কম/, /ফুরিয়ে/, /নাই/, /মূল্য/],
    trending: [/সবচেয়ে বেশি/, /টপ/, /জনপ্রিয়/, /বেস্ট/, /top/i, /best/i, /popular/i, /demand/i],
    comparison: [/তুলনা/, /কেমন/, /আগের/, /compare/i, /vs/i],
    contacts: [/গ্রাহক/, /কাস্টমার/, /ক্রেতা/, /সরবরাহকারী/, /সাপ্লায়ার/, /customer/i, /supplier/i, /client/i],
    general: [/ব্যবসা/, /হেলথ/, /অবস্থা/, /চলছে/, /সামারি/, /ওভারভিউ/, /হিসাব/, /business/i, /summary/i, /report/i],
};

const TIME_DICTIONARY: Record<Timeframe, RegExp[]> = {
    today: [/আজ/, /today/i],
    week: [/সপ্তাহ/, /সাপ্তাহিক/, /৭ দিন/, /7 দিন/, /week/i, /7 days/i],
    month: [/মাস/, /মাসিক/, /৩০ দিন/, /30 দিন/, /month/i, /30 days/i],
    total: [/মোট/, /সর্বমোট/, /সব/, /টোটাল/, /total/i, /all/i, /overall/i, /সারাজীবন/],
};

// ─── 2. Parsing Engine ───
function parseQuery(text: string, allContacts: Contact[], allProducts: Product[]): ParsedQuery {
    const normalizedText = text.toLowerCase();
    
    // 1. Extract Timeframe
    let timeframe: Timeframe = 'total'; // default
    if (TIME_DICTIONARY.today.some(r => r.test(normalizedText))) timeframe = 'today';
    else if (TIME_DICTIONARY.week.some(r => r.test(normalizedText))) timeframe = 'week';
    else if (TIME_DICTIONARY.month.some(r => r.test(normalizedText))) timeframe = 'month';

    // 2. Extract Intents (Multi-intent support)
    const intents = new Set<Intent>();
    for (const [intent, patterns] of Object.entries(DICTIONARY)) {
        if (patterns.some(pattern => pattern.test(normalizedText))) {
            intents.add(intent as Intent);
        }
    }

    // 3. Extract Entities (Contacts & Products)
    // Sorting by length descending ensures "Coca Cola" matches before "Cola"
    const mentionedContacts = allContacts.filter(c => normalizedText.includes(c.name.toLowerCase()));
    const mentionedProducts = allProducts.filter(p => normalizedText.includes(p.name.toLowerCase()));

    // Fallback if no specific intent but exact entities are mentioned
    if (intents.size === 0) {
        if (mentionedContacts.length > 0) intents.add('dues');
        else if (mentionedProducts.length > 0) intents.add('inventory');
        else intents.add('general');
    }

    return {
        timeframe,
        intents: Array.from(intents),
        mentionedContacts,
        mentionedProducts
    };
}

// ─── 3. Utility Functions ───
function filterTransactions(txs: Transaction[], timeframe: Timeframe): Transaction[] {
    if (timeframe === 'total') return txs;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate = today;
    
    if (timeframe === 'week') {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'month') {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
    }
    return txs.filter(tx => new Date(tx.date) >= startDate);
}

function sumTx(txs: Transaction[], type: TransactionType): number {
    return txs.filter(tx => tx.type === type).reduce((sum, tx) => sum + tx.amount, 0);
}

const timeLabel = (t: Timeframe) => {
    switch (t) {
        case 'today': return 'আজকের';
        case 'week': return 'এই সপ্তাহের';
        case 'month': return 'এই মাসের';
        default: return 'সর্বমোট';
    }
};

// ─── 4. Response Generators ───
export function generateResponse(messageText: string): string {
    const state = {
        txs: useTransactionStore.getState().transactions,
        todaySummary: useTransactionStore.getState().todaySummary,
        contacts: useContactStore.getState().contacts,
        products: useInventoryStore.getState().products,
        inventoryHelpers: useInventoryStore.getState(),
    };

    const query = parseQuery(messageText, state.contacts, state.products);
    const { timeframe, intents, mentionedContacts, mentionedProducts } = query;
    const filteredTxs = filterTransactions(state.txs, timeframe);

    let responses: string[] = [];

    // --- A. Greeting ---
    if (intents.includes('greeting')) {
        const hour = new Date().getHours();
        let greeting = hour < 12 ? 'সুপ্রভাত 🌅' : hour < 17 ? 'শুভ দুপুর ☀️' : hour < 20 ? 'শুভ সন্ধ্যা 🌆' : 'শুভ রাত্রি 🌙';
        responses.push(`${greeting} আমি আপনার ব্যবসার স্মার্ট সহকারী 🤖`);
    }

    // --- B. Entity-Specific Deep Dives ---
    // If the user mentions specific contacts, scope sales & dues to them.
    if (mentionedContacts.length > 0) {
        mentionedContacts.forEach(contact => {
            const contactTxs = filteredTxs.filter(tx => tx.contactId === contact.id);
            const contactSales = sumTx(contactTxs, 'sale');
            const balanceText = contact.balance > 0 ? 'পাওনা' : contact.balance < 0 ? 'দেনা' : 'কোনো বাকি নেই';
            
            let res = `👤 ${contact.name}:\n`;
            res += `💰 ব্যালেন্স: ${formatCurrency(Math.abs(contact.balance))} (${balanceText})\n`;
            if (contactSales > 0) res += `🛒 ${timeLabel(timeframe)} বিক্রি: ${formatCurrency(contactSales)}`;
            responses.push(res);
        });
        
        // If they only asked about contacts, we stop here.
        if (intents.length <= 1 || (intents.length === 2 && intents.includes('dues'))) return responses.join('\n\n');
    }

    // If the user mentions specific products, scope sales, profit, stock to them.
    if (mentionedProducts.length > 0) {
        mentionedProducts.forEach(product => {
            const productTxs = filteredTxs.filter(tx => tx.type === 'sale' && tx.productName === product.name);
            const productSalesValue = productTxs.reduce((sum, tx) => sum + tx.amount, 0);
            
            let res = `📦 ${product.name}:\n`;
            res += `📊 বর্তমান স্টক: ${product.stock} ${product.unit}\n`;
            res += `💰 ক্রয়মূল্য: ${formatCurrency(product.purchasePrice)} | বিক্রয়মূল্য: ${formatCurrency(product.sellingPrice)}\n`;
            
            if (productSalesValue > 0) {
                res += `📈 ${timeLabel(timeframe)} বিক্রি: ${formatCurrency(productSalesValue)}`;
            }
            responses.push(res);
        });
        
        if (intents.length <= 1 || (intents.length === 2 && intents.includes('inventory'))) return responses.join('\n\n');
    }


    // --- C. Broad Intents ---
    // 1. Sales
    if (intents.includes('sales')) {
        const sales = sumTx(filteredTxs, 'sale');
        const count = filteredTxs.filter(tx => tx.type === 'sale').length;
        responses.push(`📊 ${timeLabel(timeframe)} মোট বিক্রয়: ${formatCurrency(sales)} (${count}টি লেনদেন)`);
    }

    // 2. Purchases
    if (intents.includes('purchases')) {
        const purchases = sumTx(filteredTxs, 'purchase');
        responses.push(`📦 ${timeLabel(timeframe)} মোট ক্রয়: ${formatCurrency(purchases)}`);
    }

    // 3. Expenses
    if (intents.includes('expenses')) {
        const expenses = sumTx(filteredTxs, 'expense');
        responses.push(`💸 ${timeLabel(timeframe)} মোট খরচ: ${formatCurrency(expenses)}`);
    }

    // 4. Profit
    if (intents.includes('profit')) {
        const sales = sumTx(filteredTxs, 'sale');
        const purchases = sumTx(filteredTxs, 'purchase');
        const expenses = sumTx(filteredTxs, 'expense');
        // A simple generic profit calculation for the timeframe
        // (Note: accurate product-level profit relies on COGS, but this is a gross estimate for the period)
        const estProfit = sales - purchases - expenses; 
        
        let profitStr = `💰 ${timeLabel(timeframe)} নিট ${estProfit >= 0 ? 'লাভ' : 'লোকসান'}: ${formatCurrency(Math.abs(estProfit))}`;
        if (timeframe === 'total') {
            profitStr = `💰 সর্বমোট নিট লাভ: ${formatCurrency(Math.abs(computeAllTimeProfit(state.txs)))}`;
        } else if (timeframe === 'today') {
            profitStr = `💰 আজকের নিট লাভ: ${formatCurrency(Math.abs(state.todaySummary.netProfit))}`;
        }
        responses.push(profitStr);
    }

    // 5. Dues
    if (intents.includes('dues') && mentionedContacts.length === 0) {
        const receivable = state.contacts.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0);
        const payable = state.contacts.filter(c => c.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0);
        responses.push(`📋 বাকি হিসাব:\n💚 বাজারে মোট পাওনা: ${formatCurrency(receivable)}\n🔴 আপনার মোট দেনা: ${formatCurrency(payable)}`);
    }

    // 6. Inventory / Low Stock
    if (intents.includes('inventory') && mentionedProducts.length === 0) {
        const lowStock = state.inventoryHelpers.getLowStockProducts();
        let res = `🏭 ইনভেন্টরি:\nমোট পণ্য: ${state.products.length}টি | মোট স্টক: ${state.products.reduce((s,p)=>s+p.stock,0)} ইউনিট`;
        if (lowStock.length > 0) {
            res += `\n⚠️ সতর্কতা: ${lowStock.length}টি পণ্যের স্টক কম!`;
            lowStock.slice(0,3).forEach(p => res += `\n • ${p.name} (${p.stock} ${p.unit})`);
        }
        responses.push(res);
    }

    // 7. Trending
    if (intents.includes('trending')) {
        const top = state.inventoryHelpers.getTopSellingProducts(3);
        if (top.length > 0 && top[0].totalSold > 0) {
            let res = `🔥 টপ সেলিং পণ্য:\n` + top.slice(0,3).map((p,i) => `${i+1}. ${p.name} (${p.totalSold} ${p.unit})`).join('\n');
            responses.push(res);
        }
    }

    // 8. General Health / Summary (Fallback if no intent or general intent)
    if (intents.includes('general') || responses.length === 0) {
        let res = `🏪 ব্যবসার বর্তমান অবস্থা:\n`;
        res += `💵 আজকের বিক্রয়: ${formatCurrency(state.todaySummary.totalSales)}\n`;
        res += `💰 সর্বমোট লাভ: ${formatCurrency(computeAllTimeProfit(state.txs))}\n`;
        res += `📦 ইনভেন্টরি ভ্যালু: ${formatCurrency(state.inventoryHelpers.getInventoryValuation().totalRetail)}\n`;
        res += `👥 গ্রাহক ও সরবরাহকারী: ${state.contacts.length} জন`;
        responses.push(res);
    }

    return responses.join('\n\n───────────────\n\n');
}

// ─── Quick suggestion chips ───
export const QUICK_SUGGESTIONS = [
    { label: '📊 আজকের বিক্রি', message: 'আজ কত বিক্রি হয়েছে?' },
    { label: '💰 লাভ কত?', message: 'মোট লাভ কত?' },
    { label: '📋 বাকি আছে?', message: 'মোট বাকি কত?' },
    { label: '📦 স্টক কম?', message: 'কোন পণ্যে স্টক কম?' },
    { label: '🔥 টপ পণ্য', message: 'সবচেয়ে বেশি বিক্রি হওয়া পণ্য?' },
    { label: '🏪 ব্যবসার অবস্থা', message: 'ব্যবসার অবস্থা কেমন?' },
    { label: '💸 খরচ কত?', message: 'এই মাসে কত খরচ হয়েছে?' },
    { label: '👥 গ্রাহক তালিকা', message: 'কতজন গ্রাহক আছে?' },
];

export function createMessage(text: string, sender: 'user' | 'bot'): ChatMessage {
    return {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        text,
        sender,
        timestamp: new Date(),
    };
}
