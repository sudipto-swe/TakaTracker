/**
 * Contact store for managing customers and suppliers.
 * Contacts are auto-created from transactions. Persists to AsyncStorage.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { produce } from 'immer';

export interface Contact {
    id: string;
    localId: string;
    serverId?: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    image?: string;
    type: 'customer' | 'supplier';
    isActive: boolean;
    balance: number;
    creditLimit: number;
    notes?: string;
    isSynced: boolean;
    syncedAt?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface DuesSummary {
    totalReceivable: number;
    totalPayable: number;
    receivableCount: number;
    payableCount: number;
}

interface ContactState {
    contacts: Contact[];
    customers: Contact[];
    suppliers: Contact[];
    duesSummary: DuesSummary | null;
    isLoading: boolean;

    // Actions
    setContacts: (contacts: Contact[]) => void;
    addContact: (contact: Contact) => Promise<void>;
    updateContact: (id: string, updates: Partial<Contact>) => void;
    deleteContact: (id: string) => void;
    getContactById: (id: string) => Contact | undefined;
    updateBalance: (id: string, amount: number) => void;
    setDuesSummary: (summary: DuesSummary) => void;
    setLoading: (loading: boolean) => void;
    getOrCreateContact: (name: string, type: 'customer' | 'supplier', phone?: string) => Contact;
}

export const useContactStore = create<ContactState>()(
    persist(
        (set, get) => ({
            contacts: [],
            customers: [],
            suppliers: [],
            duesSummary: null,
            isLoading: false,

            setContacts: (contacts) => set({
                contacts,
                customers: contacts.filter(c => c.type === 'customer'),
                suppliers: contacts.filter(c => c.type === 'supplier'),
            }),

            addContact: async (contact) => {
                set(
                    produce((state: ContactState) => {
                        state.contacts.push(contact);
                        if (contact.type === 'customer') {
                            state.customers.push(contact);
                        }
                        if (contact.type === 'supplier') {
                            state.suppliers.push(contact);
                        }
                    })
                );
            },

            updateContact: (id, updates) => set(
                produce((state: ContactState) => {
                    const updateInArray = (arr: Contact[]) => {
                        const idx = arr.findIndex(c => c.id === id || c.localId === id);
                        if (idx !== -1) {
                            arr[idx] = { ...arr[idx], ...updates };
                        }
                    };
                    updateInArray(state.contacts);
                    updateInArray(state.customers);
                    updateInArray(state.suppliers);
                })
            ),

            deleteContact: (id) => set(
                produce((state: ContactState) => {
                    const filter = (arr: Contact[]) => arr.filter(c => c.id !== id && c.localId !== id);
                    state.contacts = filter(state.contacts);
                    state.customers = filter(state.customers);
                    state.suppliers = filter(state.suppliers);
                })
            ),

            getContactById: (id) => {
                const state = get();
                return state.contacts.find(c => c.id === id || c.localId === id);
            },

            updateBalance: (id, amount) => set(
                produce((state: ContactState) => {
                    const updateInArray = (arr: Contact[]) => {
                        const idx = arr.findIndex(c => c.id === id || c.localId === id);
                        if (idx !== -1) {
                            arr[idx].balance += amount;
                        }
                    };
                    updateInArray(state.contacts);
                    updateInArray(state.customers);
                    updateInArray(state.suppliers);
                })
            ),

            setDuesSummary: (summary) => set({ duesSummary: summary }),

            setLoading: (loading) => set({ isLoading: loading }),

            getOrCreateContact: (name, type, phone) => {
                const state = get();
                // Find existing contact by name & type
                const existing = state.contacts.find(
                    c => c.name.toLowerCase() === name.toLowerCase() && c.type === type
                );
                if (existing) return existing;

                // Create new contact
                const localId = `contact_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                const newContact: Contact = {
                    id: localId,
                    localId,
                    name,
                    phone,
                    type,
                    isActive: true,
                    balance: 0,
                    creditLimit: 0,
                    isSynced: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                set(
                    produce((state: ContactState) => {
                        state.contacts.push(newContact);
                        if (type === 'customer') {
                            state.customers.push(newContact);
                        } else {
                            state.suppliers.push(newContact);
                        }
                    })
                );

                return newContact;
            },
        }),
        {
            name: 'contact-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                contacts: state.contacts,
                customers: state.customers,
                suppliers: state.suppliers,
            }),
        }
    )
);
