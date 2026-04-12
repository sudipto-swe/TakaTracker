/**
 * PredictionService - Analyzes sales history to predict demand,
 * suggest combo offers, and detect seasonal patterns.
 */
import { Product, SaleRecord } from '../store/inventoryStore';
import { Transaction } from '../store/transactionStore';

export interface TrendingProduct {
    productId: string;
    productName: string;
    salesVelocity: number; // units/day recently
    trend: 'rising' | 'stable' | 'declining';
    percentChange: number;
}

export interface SeasonalPrediction {
    season: string;
    seasonBn: string;
    icon: string;
    products: string[];
    description: string;
    startMonth: number;
    endMonth: number;
    isActive: boolean;
}

export interface ComboOffer {
    id: string;
    name: string;
    products: { name: string; id: string; price: number }[];
    totalPrice: number;
    discountedPrice: number;
    discount: number;
    reason: string;
    estimatedBoost: number;
}

export interface DemandForecast {
    productId: string;
    productName: string;
    predictedDemand: number;
    currentStock: number;
    daysUntilStockout: number;
    needsRestock: boolean;
    recommendedOrder: number;
}

// Bangladesh seasonal calendar
const SEASONS: SeasonalPrediction[] = [
    {
        season: 'ramadan', seasonBn: 'রমজান', icon: '🌙',
        products: ['চাল', 'ডাল', 'তেল', 'চিনি', 'ছোলা', 'পেঁয়াজ', 'খেজুর', 'দুধ', 'শরবত'],
        description: 'ইফতার ও সেহরির আইটেমের চাহিদা বাড়বে',
        startMonth: 2, endMonth: 4, isActive: false,
    },
    {
        season: 'eid-ul-fitr', seasonBn: 'ঈদ-উল-ফিতর', icon: '🎉',
        products: ['সেমাই', 'চিনি', 'দুধ', 'ঘি', 'মশলা', 'কাপড়', 'জুতা', 'প্রসাধনী'],
        description: 'ঈদের কেনাকাটা ও মিষ্টি তৈরির উপকরণ',
        startMonth: 3, endMonth: 5, isActive: false,
    },
    {
        season: 'eid-ul-adha', seasonBn: 'ঈদ-উল-আযহা', icon: '🐄',
        products: ['মশলা', 'তেল', 'চাল', 'পেঁয়াজ', 'রসুন', 'আদা', 'ছুরি', 'দড়ি'],
        description: 'কোরবানি ঈদের মশলা ও প্রয়োজনীয় জিনিস',
        startMonth: 5, endMonth: 7, isActive: false,
    },
    {
        season: 'pohela-boishakh', seasonBn: 'পহেলা বৈশাখ', icon: '🎭',
        products: ['মিষ্টি', 'ইলিশ', 'পান্তা', 'কাপড়', 'শাড়ি', 'পাঞ্জাবি'],
        description: 'বাংলা নববর্ষের বিশেষ খাবার ও পোশাক',
        startMonth: 3, endMonth: 4, isActive: false,
    },
    {
        season: 'winter', seasonBn: 'শীতকাল', icon: '❄️',
        products: ['কম্বল', 'শীতের কাপড়', 'সোয়েটার', 'মাফলার', 'গুড়', 'খেজুরের রস', 'পিঠা'],
        description: 'শীতকালীন পোশাক ও খাবারের চাহিদা',
        startMonth: 10, endMonth: 1, isActive: false,
    },
    {
        season: 'monsoon', seasonBn: 'বর্ষাকাল', icon: '🌧️',
        products: ['ছাতা', 'রেইনকোট', 'গামবুট', 'শুকনো খাবার', 'মোমবাতি', 'ম্যাচ'],
        description: 'বর্ষায় প্রয়োজনীয় জিনিসের চাহিদা',
        startMonth: 5, endMonth: 9, isActive: false,
    },
    {
        season: 'school-season', seasonBn: 'স্কুল সিজন', icon: '📚',
        products: ['খাতা', 'কলম', 'পেন্সিল', 'ব্যাগ', 'ইউনিফর্ম', 'জুতা', 'টিফিন বক্স'],
        description: 'স্কুল খোলার সময় শিক্ষা উপকরণের চাহিদা',
        startMonth: 0, endMonth: 1, isActive: false,
    },
];

/**
 * Get currently active seasons based on the current month.
 */
export function getActiveSeasons(): SeasonalPrediction[] {
    const currentMonth = new Date().getMonth(); // 0-11
    return SEASONS.map(s => ({
        ...s,
        isActive: s.startMonth <= s.endMonth
            ? currentMonth >= s.startMonth && currentMonth <= s.endMonth
            : currentMonth >= s.startMonth || currentMonth <= s.endMonth,
    })).filter(s => s.isActive);
}

/**
 * Get upcoming seasons (next 2 months).
 */
export function getUpcomingSeasons(): SeasonalPrediction[] {
    const currentMonth = new Date().getMonth();
    const next1 = (currentMonth + 1) % 12;
    const next2 = (currentMonth + 2) % 12;

    return SEASONS.filter(s => {
        const start = s.startMonth;
        return start === next1 || start === next2;
    });
}

/**
 * Analyze trending products from sales history.
 */
export function getTrendingProducts(
    products: Product[],
    salesHistory: SaleRecord[],
    daysRecent: number = 7,
    daysPast: number = 30,
): TrendingProduct[] {
    const now = Date.now();
    const recentCutoff = now - daysRecent * 86400000;
    const pastCutoff = now - daysPast * 86400000;

    const trends: TrendingProduct[] = [];

    for (const product of products) {
        const recentSales = salesHistory.filter(s =>
            s.productId === product.id && new Date(s.date).getTime() >= recentCutoff
        );
        const pastSales = salesHistory.filter(s =>
            s.productId === product.id &&
            new Date(s.date).getTime() >= pastCutoff &&
            new Date(s.date).getTime() < recentCutoff
        );

        const recentQty = recentSales.reduce((sum, s) => sum + s.quantity, 0);
        const pastQty = pastSales.reduce((sum, s) => sum + s.quantity, 0);

        const recentVelocity = recentQty / daysRecent;
        const pastVelocity = pastQty / (daysPast - daysRecent);

        let trend: 'rising' | 'stable' | 'declining' = 'stable';
        let percentChange = 0;

        if (pastVelocity > 0) {
            percentChange = Math.round(((recentVelocity - pastVelocity) / pastVelocity) * 100);
            if (percentChange > 20) trend = 'rising';
            else if (percentChange < -20) trend = 'declining';
        } else if (recentVelocity > 0) {
            trend = 'rising';
            percentChange = 100;
        }

        if (recentQty > 0 || pastQty > 0) {
            trends.push({
                productId: product.id,
                productName: product.name,
                salesVelocity: recentVelocity,
                trend,
                percentChange,
            });
        }
    }

    return trends.sort((a, b) => b.salesVelocity - a.salesVelocity).slice(0, 10);
}

/**
 * Generate combo offer suggestions based on co-purchase patterns.
 */
export function getComboSuggestions(
    products: Product[],
    transactions: Transaction[],
): ComboOffer[] {
    if (products.length < 2) return [];
    const combos: ComboOffer[] = [];

    // Find products frequently bought together (same day, same contact)
    const dailyPurchases: Record<string, string[]> = {};

    for (const tx of transactions) {
        if (tx.type !== 'sale' || !tx.productName) continue;
        const dateKey = new Date(tx.date).toISOString().split('T')[0];
        const key = tx.contactId ? `${dateKey}-${tx.contactId}` : dateKey;
        if (!dailyPurchases[key]) dailyPurchases[key] = [];
        dailyPurchases[key].push(tx.productName);
    }

    // Count co-occurrences
    const coOccur: Record<string, number> = {};
    for (const prods of Object.values(dailyPurchases)) {
        if (prods.length < 2) continue;
        const unique = [...new Set(prods)];
        for (let i = 0; i < unique.length; i++) {
            for (let j = i + 1; j < unique.length; j++) {
                const k = [unique[i], unique[j]].sort().join('|||');
                coOccur[k] = (coOccur[k] || 0) + 1;
            }
        }
    }

    // Top combos
    const sorted = Object.entries(coOccur).sort((a, b) => b[1] - a[1]).slice(0, 5);

    for (const [pair, count] of sorted) {
        if (count < 2) continue;
        const [name1, name2] = pair.split('|||');
        const p1 = products.find(p => p.name === name1);
        const p2 = products.find(p => p.name === name2);
        if (!p1 || !p2) continue;

        const totalPrice = p1.sellingPrice + p2.sellingPrice;
        const discount = Math.round(totalPrice * 0.05); // 5% combo discount
        combos.push({
            id: `combo_${p1.id}_${p2.id}`,
            name: `${p1.name} + ${p2.name}`,
            products: [
                { name: p1.name, id: p1.id, price: p1.sellingPrice },
                { name: p2.name, id: p2.id, price: p2.sellingPrice },
            ],
            totalPrice,
            discountedPrice: totalPrice - discount,
            discount,
            reason: `${count} বার একসাথে কেনা হয়েছে`,
            estimatedBoost: Math.min(30, count * 5),
        });
    }

    return combos;
}

/**
 * Generate demand forecast for products.
 */
export function getDemandForecast(
    products: Product[],
    salesHistory: SaleRecord[],
    forecastDays: number = 14,
): DemandForecast[] {
    const forecasts: DemandForecast[] = [];
    const now = Date.now();
    const last30 = now - 30 * 86400000;

    for (const product of products) {
        const recent = salesHistory.filter(s =>
            s.productId === product.id && new Date(s.date).getTime() >= last30
        );
        const totalQty = recent.reduce((sum, s) => sum + s.quantity, 0);
        const dailyRate = totalQty / 30;
        const predicted = Math.ceil(dailyRate * forecastDays);
        const daysUntilStockout = dailyRate > 0 ? Math.floor(product.stock / dailyRate) : 999;

        forecasts.push({
            productId: product.id,
            productName: product.name,
            predictedDemand: predicted,
            currentStock: product.stock,
            daysUntilStockout,
            needsRestock: daysUntilStockout <= forecastDays,
            recommendedOrder: Math.max(0, predicted - product.stock),
        });
    }

    return forecasts.filter(f => f.predictedDemand > 0).sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}

/**
 * Unified prediction results interface.
 */
export interface FullPredictions {
    trending: { productName: string; avgDailySales: number; trend: string; trendPercent: number }[];
    seasonal: SeasonalPrediction[];
    combos: { products: string[]; totalPrice: number; comboPrice: number; discount: number; frequency: number }[];
    forecast: DemandForecast[];
}

/**
 * Get full predictions combining all prediction types.
 */
export function getFullPredictions(
    products: Product[],
    salesHistory: SaleRecord[],
    transactions: Transaction[],
): FullPredictions {
    const trending = getTrendingProducts(products, salesHistory).map(t => ({
        productName: t.productName,
        avgDailySales: t.salesVelocity,
        trend: t.trend,
        trendPercent: t.percentChange,
    }));

    const active = getActiveSeasons();
    const upcoming = getUpcomingSeasons();
    const seasonal = [...active, ...upcoming.map(s => ({ ...s, isActive: false }))];

    const rawCombos = getComboSuggestions(products, transactions);
    const combos = rawCombos.map(c => ({
        products: c.products.map(p => p.name),
        totalPrice: c.totalPrice,
        comboPrice: c.discountedPrice,
        discount: c.discount,
        frequency: parseInt(c.reason) || 2,
    }));

    const forecast = getDemandForecast(products, salesHistory).map(f => ({
        ...f,
        suggestedOrder: f.recommendedOrder,
    }));

    return { trending, seasonal, combos, forecast };
}

/**
 * Exported predictionService object for unified access.
 */
export const predictionService = {
    getFullPredictions: (
        salesData: { productId: string; productName: string; sales: any[]; currentStock: number; category: string }[],
        transactions: Transaction[],
    ): FullPredictions => {
        const products: Product[] = salesData.map(s => ({
            id: s.productId,
            name: s.productName,
            sku: '',
            stock: s.currentStock,
            unit: '',
            purchasePrice: 0,
            sellingPrice: 0,
            lowStock: 5,
            category: s.category || '',
            totalSold: 0,
            totalRevenue: 0,
            totalProfit: 0,
            salesCount: 0,
        }));
        const salesHistory: SaleRecord[] = salesData.flatMap(s =>
            (s.sales || []).map((sale: any) => ({
                productId: s.productId,
                productName: s.productName,
                quantity: sale.quantity || 0,
                unitPrice: sale.unitPrice || 0,
                totalAmount: sale.totalAmount || 0,
                profit: sale.profit || 0,
                date: sale.date || new Date(),
            }))
        );
        return getFullPredictions(products, salesHistory, transactions);
    },
    getActiveSeasons,
    getUpcomingSeasons,
    getTrendingProducts,
    getComboSuggestions,
    getDemandForecast,
};
