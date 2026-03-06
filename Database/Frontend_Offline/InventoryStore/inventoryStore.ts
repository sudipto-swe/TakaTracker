/**
 * Inventory store for managing products, stock, and sales tracking.
 * No demo data — all products are created via purchase transactions.
 * Persists to AsyncStorage.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Product {
    id: string;
    name: string;
    sku: string;
    stock: number;
    unit: string;
    purchasePrice: number;  // latest buy price per unit
    sellingPrice: number;   // owner-set selling price per unit
    lowStock: number;
    category: string;
    // Sales tracking
    totalSold: number;
    totalRevenue: number;
    totalProfit: number;
    salesCount: number;
}

export interface SaleRecord {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    profit: number;
    date: Date;
}

export interface LowStockWarning {
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
    unit: string;
}

export interface SellResult {
    success: boolean;
    message: string;
    lowStockWarning?: LowStockWarning;
}

interface InventoryState {
    products: Product[];
    salesHistory: SaleRecord[];
    addProduct: (product: Product) => void;
    deleteProduct: (id: string) => void;
    adjustStock: (id: string, delta: number) => void;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    updateSellingPrice: (id: string, newPrice: number) => void;
    setLowStockThreshold: (id: string, threshold: number) => void;
    sellProduct: (productId: string, quantity: number, sellingPrice: number) => SellResult;
    purchaseProduct: (name: string, qty: number, buyPrice: number, sellPrice: number, unit: string, category: string) => Product;
    getProductByName: (name: string) => Product | undefined;
    getLowStockProducts: () => Product[];
    getTopSellingProducts: (limit?: number) => Product[];
    getMostDemandedProducts: (limit?: number) => Product[];
    getInventoryValuation: () => { totalCost: number; totalRetail: number; potentialProfit: number };
    getCategoryBreakdown: () => { category: string; count: number; value: number; revenue: number }[];
}

export const useInventoryStore = create<InventoryState>()(
    persist(
        (set, get) => ({
            products: [],
            salesHistory: [],

            addProduct: (product) => {
                set({ products: [...get().products, product] });
            },

            deleteProduct: (id) => {
                set({ products: get().products.filter(p => p.id !== id) });
            },

            adjustStock: (id, delta) => {
                set({
                    products: get().products.map(p =>
                        p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
                    ),
                });
            },

            updateProduct: (id, updates) => {
                set({
                    products: get().products.map(p =>
                        p.id === id ? { ...p, ...updates } : p
                    ),
                });
            },

            updateSellingPrice: (id, newPrice) => {
                set({
                    products: get().products.map(p =>
                        p.id === id ? { ...p, sellingPrice: newPrice } : p
                    ),
                });
            },

            setLowStockThreshold: (id, threshold) => {
                set({
                    products: get().products.map(p =>
                        p.id === id ? { ...p, lowStock: threshold } : p
                    ),
                });
            },

            purchaseProduct: (name, qty, buyPrice, sellPrice, unit, category) => {
                const existing = get().products.find(
                    p => p.name.toLowerCase() === name.toLowerCase()
                );

                if (existing) {
                    // Update existing product stock and buy price
                    set({
                        products: get().products.map(p =>
                            p.id === existing.id
                                ? {
                                    ...p,
                                    stock: p.stock + qty,
                                    purchasePrice: buyPrice, // update to latest buy price
                                    sellingPrice: sellPrice > 0 ? sellPrice : p.sellingPrice,
                                }
                                : p
                        ),
                    });
                    return { ...existing, stock: existing.stock + qty, purchasePrice: buyPrice };
                } else {
                    // Create new product
                    const newProduct: Product = {
                        id: `prod_${Date.now()}`,
                        name,
                        sku: `SKU-${Date.now() % 100000}`,
                        stock: qty,
                        unit: unit || 'পিস',
                        purchasePrice: buyPrice,
                        sellingPrice: sellPrice > 0 ? sellPrice : buyPrice,
                        lowStock: 10,
                        category: category || 'অন্যান্য',
                        totalSold: 0,
                        totalRevenue: 0,
                        totalProfit: 0,
                        salesCount: 0,
                    };
                    set({ products: [...get().products, newProduct] });
                    return newProduct;
                }
            },

            getProductByName: (name) => {
                return get().products.find(
                    p => p.name.toLowerCase() === name.toLowerCase()
                );
            },

            sellProduct: (productId, quantity, sellingPrice) => {
                const product = get().products.find(p => p.id === productId);
                if (!product) return { success: false, message: 'পণ্য পাওয়া যায়নি' };
                if (product.stock < quantity) return { success: false, message: `স্টকে মাত্র ${product.stock} ${product.unit} আছে` };

                const totalAmount = quantity * sellingPrice;
                const profit = (sellingPrice - product.purchasePrice) * quantity;
                const newStock = product.stock - quantity;

                const saleRecord: SaleRecord = {
                    productId,
                    productName: product.name,
                    quantity,
                    unitPrice: sellingPrice,
                    totalAmount,
                    profit,
                    date: new Date(),
                };

                set({
                    products: get().products.map(p =>
                        p.id === productId
                            ? {
                                ...p,
                                stock: newStock,
                                totalSold: p.totalSold + quantity,
                                totalRevenue: p.totalRevenue + totalAmount,
                                totalProfit: p.totalProfit + profit,
                                salesCount: p.salesCount + 1,
                            }
                            : p
                    ),
                    salesHistory: [saleRecord, ...get().salesHistory],
                });

                // Check for low stock warning
                const result: SellResult = {
                    success: true,
                    message: `${product.name} ${quantity} ${product.unit} বিক্রয় হয়েছে`,
                };

                if (newStock <= product.lowStock) {
                    result.lowStockWarning = {
                        productId: product.id,
                        productName: product.name,
                        currentStock: newStock,
                        threshold: product.lowStock,
                        unit: product.unit,
                    };
                }

                return result;
            },

            getLowStockProducts: () => {
                return get().products.filter(p => p.stock > 0 && p.stock <= p.lowStock);
            },

            getTopSellingProducts: (limit = 5) => {
                return [...get().products]
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .slice(0, limit);
            },

            getMostDemandedProducts: (limit = 5) => {
                return [...get().products]
                    .sort((a, b) => b.totalSold - a.totalSold)
                    .slice(0, limit);
            },

            getInventoryValuation: () => {
                const products = get().products;
                const totalCost = products.reduce((sum, p) => sum + p.purchasePrice * p.stock, 0);
                const totalRetail = products.reduce((sum, p) => sum + p.sellingPrice * p.stock, 0);
                return { totalCost, totalRetail, potentialProfit: totalRetail - totalCost };
            },

            getCategoryBreakdown: () => {
                const products = get().products;
                const categories: Record<string, { count: number; value: number; revenue: number }> = {};

                for (const p of products) {
                    if (!categories[p.category]) {
                        categories[p.category] = { count: 0, value: 0, revenue: 0 };
                    }
                    categories[p.category].count++;
                    categories[p.category].value += p.sellingPrice * p.stock;
                    categories[p.category].revenue += p.totalRevenue;
                }

                return Object.entries(categories).map(([category, data]) => ({
                    category,
                    ...data,
                }));
            },
        }),
        {
            name: 'inventory-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                products: state.products,
                salesHistory: state.salesHistory,
            }),
        }
    )
);