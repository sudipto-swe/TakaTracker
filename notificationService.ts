/**
 * Notification service — Scans transactions for overdue customers
 * and generates in-app notifications for the shop owner.
 */
import { useTransactionStore, Transaction } from '../store/transactionStore';
import { useContactStore, Contact } from '../store/contactStore';
import { useNotificationStore, DueNotification, ReminderFrequency } from '../store/notificationStore';
import { formatCurrency, formatDate } from '../i18n';

/** Contact with their unpaid transaction details */
export interface OverdueContact {
    contact: Contact;
    totalDue: number;
    unpaidTransactions: Transaction[];
    daysSinceOldestDue: number;
    oldestDueDate: Date;
}
/**
 * Scan all sale transactions and find contacts with dueAmount > 0.
 */
export function getOverdueContacts(minDueAmount: number = 100): OverdueContact[] {
    const transactions = useTransactionStore.getState().transactions;
    const contacts = useContactStore.getState().contacts;

    const dueMap = new Map<string, Transaction[]>();

    for (const tx of transactions) {
        if (tx.type !== 'sale' || tx.dueAmount <= 0 || !tx.contactId) continue;
        const existing = dueMap.get(tx.contactId) || [];
        existing.push(tx);
        dueMap.set(tx.contactId, existing);
    }

    const overdueContacts: OverdueContact[] = [];

    for (const [contactId, unpaidTxs] of dueMap.entries()) {
        const contact = contacts.find(c => c.id === contactId || c.localId === contactId);
        if (!contact) continue;

        const totalDue = unpaidTxs.reduce((sum, tx) => sum + tx.dueAmount, 0);
        if (totalDue < minDueAmount) continue;

        const oldestTimestamp = unpaidTxs.reduce((oldest, tx) => {
            const txTime = new Date(tx.date).getTime();
            return txTime < oldest ? txTime : oldest;
        }, Date.now());

        const daysSinceOldestDue = Math.floor((Date.now() - oldestTimestamp) / (1000 * 60 * 60 * 24));

        overdueContacts.push({
            contact,
            totalDue,
            unpaidTransactions: unpaidTxs.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
            daysSinceOldestDue,
            oldestDueDate: new Date(oldestTimestamp),
        });
    }

    return overdueContacts.sort((a, b) => b.totalDue - a.totalDue);
}

/**
 * Filter overdue contacts by frequency:
 * daily = all, weekly = 7+ days old, monthly = 30+ days old
 */
export function filterByFrequency(contacts: OverdueContact[], frequency: ReminderFrequency): OverdueContact[] {
    switch (frequency) {
        case 'daily': return contacts;
        case 'weekly': return contacts.filter(c => c.daysSinceOldestDue >= 7);
        case 'monthly': return contacts.filter(c => c.daysSinceOldestDue >= 30);
    }
}
