import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TransactionType =
    | 'sale'
    | 'purchase'
    | 'expense';

export type ExpenseCategory =
    | 'employee'
    | 'electricity'
    | 'rent'
    | 'transport'
    | 'others';

export interface Transaction {
    id: string;
    localId: string;
    serverId?: string;
    type: TransactionType;
    referenceNumber: string;
    contactId?: string;
    contactName?: string;