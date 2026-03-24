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

/**
 * Build a detailed Bangla notification message for a single overdue contact.
 */
export function buildNotificationDetail(overdue: OverdueContact): string {
    const { contact, totalDue, unpaidTransactions } = overdue;

    const lines: string[] = [
        `${contact.name}${contact.phone ? ` (${contact.phone})` : ''}`,
        `মোট বাকি: ${formatCurrency(totalDue)}`,
        ``,
        `বিস্তারিত হিসাব:`,
    ];

    unpaidTransactions.forEach((tx, idx) => {
        const dateStr = formatDate(tx.date);
        const product = tx.productName || 'পণ্য';
        const qty = tx.quantity ? ` — ${tx.quantity} ${tx.unit || 'পিস'}` : '';

        lines.push(`${idx + 1}. ${dateStr} — ${product}${qty}`);
        lines.push(`   মোট: ${formatCurrency(tx.amount)} | পরিশোধ: ${formatCurrency(tx.paidAmount)} | বাকি: ${formatCurrency(tx.dueAmount)}`);
    });

    lines.push(``);
    lines.push(`সর্বমোট বাকি: ${formatCurrency(totalDue)}`);

    return lines.join('\n');
}

/**
 * Generate fresh notifications from current transaction data.
 * Call this on app open, after adding a transaction, or on pull-to-refresh.
 */
export function refreshNotifications(): void {
    const store = useNotificationStore.getState();
    if (!store.isEnabled) return;

    const overdueContacts = getOverdueContacts(store.minDueAmount);
    const filtered = filterByFrequency(overdueContacts, store.frequency);

    // Preserve read status from existing notifications
    const existingMap = new Map(store.notifications.map(n => [n.contactId, n]));

    const notifications: DueNotification[] = filtered.map(overdue => {
        const existing = existingMap.get(overdue.contact.id);
        return {
            id: `notif_${overdue.contact.id}`,
            contactId: overdue.contact.id,
            contactName: overdue.contact.name,
            contactPhone: overdue.contact.phone,
            totalDue: overdue.totalDue,
            transactionCount: overdue.unpaidTransactions.length,
            oldestDueDate: overdue.oldestDueDate.toISOString(),
            daysSinceOldest: overdue.daysSinceOldestDue,
            isRead: existing ? existing.isRead && existing.totalDue === overdue.totalDue : false,
            createdAt: existing?.createdAt || new Date().toISOString(),
        };
    });

    store.setNotifications(notifications);
    store.setLastChecked(new Date().toISOString());
}

/**
 * Get the unread notification count (for badge).
 */
export function getUnreadCount(): number {
    return useNotificationStore.getState().unreadCount;
}
