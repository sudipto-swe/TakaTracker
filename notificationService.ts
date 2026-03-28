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
