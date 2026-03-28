/**
 * ID generation utilities.
 */

/**
 * Generate a unique local ID.
 */
export const generateLocalId = (): string => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `local_${timestamp}_${randomPart}`;
};

/**
 * Generate a transaction reference number.
 */
export const generateReferenceNumber = (type: string): string => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

    const typePrefix: Record<string, string> = {
        sale: 'SL',
        purchase: 'PU',
        expense: 'EX',
        payment_in: 'PI',
        payment_out: 'PO',
        return_in: 'RI',
        return_out: 'RO',
    };

    const prefix = typePrefix[type] || 'TX';
    return `${prefix}${dateStr}${randomPart}`;
};

/**
 * Generate a unique device ID.
 */
export const generateDeviceId = (): string => {
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substring(2, 8);
    const random2 = Math.random().toString(36).substring(2, 8);
    return `device_${timestamp}_${random1}_${random2}`;
};

/**
 * Check if ID is a local (unsynced) ID.
 */
export const isLocalId = (id: string): boolean => {
    return id.startsWith('local_');
};
