/**
 * API Client Integration Tests
 */
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { authService } from '../../services/api/auth';
import { transactionService } from '../../services/api/transactions';
import { API_CONFIG } from '../../constants/config';

// Mock axios
const mock = new MockAdapter(axios);

describe('Auth API Service', () => {
    afterEach(() => {
        mock.reset();
    });

    describe('requestOTP', () => {
        it('should successfully request OTP', async () => {
            const phone = '+8801712345678';
            const mockResponse = {
                success: true,
                message: 'OTP sent successfully',
                message_bn: 'OTP পাঠানো হয়েছে',
            };

            mock.onPost(`${API_CONFIG.BASE_URL}/auth/request-otp/`).reply(200, mockResponse);

            const result = await authService.requestOTP(phone);

            expect(result.success).toBe(true);
            expect(result.message_bn).toBe('OTP পাঠানো হয়েছে');
        });

        it('should handle invalid phone number', async () => {
            const phone = '12345';

            mock.onPost(`${API_CONFIG.BASE_URL}/auth/request-otp/`).reply(400, {
                error: 'Invalid phone number',
            });

            await expect(authService.requestOTP(phone)).rejects.toThrow();
        });
    });

    describe('verifyOTP', () => {
        it('should successfully verify OTP and return tokens', async () => {
            const phone = '+8801712345678';
            const otp = '123456';
            const mockResponse = {
                success: true,
                user: {
                    id: '1',
                    phone: phone,
                    name: 'Test User',
                },
                access: 'access-token-123',
                refresh: 'refresh-token-456',
            };

            mock.onPost(`${API_CONFIG.BASE_URL}/auth/verify-otp/`).reply(200, mockResponse);

            const result = await authService.verifyOTP(phone, otp);

            expect(result.success).toBe(true);
            expect(result.access).toBe('access-token-123');
            expect(result.user.id).toBe('1');
        });

        it('should handle wrong OTP', async () => {
            mock.onPost(`${API_CONFIG.BASE_URL}/auth/verify-otp/`).reply(401, {
                error: 'Invalid OTP',
            });

            await expect(authService.verifyOTP('+8801712345678', '000000')).rejects.toThrow();
        });
    });
});

describe('Transaction API Service', () => {
    afterEach(() => {
        mock.reset();
    });

    describe('getTransactions', () => {
        it('should fetch transactions list', async () => {
            const mockTransactions = [
                { id: '1', transaction_type: 'sale', total_amount: 1000 },
                { id: '2', transaction_type: 'purchase', total_amount: 500 },
            ];

            mock.onGet(`${API_CONFIG.BASE_URL}/transactions/`).reply(200, {
                results: mockTransactions,
                count: 2,
            });

            const result = await transactionService.getTransactions();

            expect(result.results).toHaveLength(2);
            expect(result.results[0].transaction_type).toBe('sale');
        });

        it('should filter transactions by type', async () => {
            const mockTransactions = [
                { id: '1', transaction_type: 'sale', total_amount: 1000 },
            ];

            mock.onGet(`${API_CONFIG.BASE_URL}/transactions/`, { params: { type: 'sale' } }).reply(200, {
                results: mockTransactions,
                count: 1,
            });

            const result = await transactionService.getTransactions({ type: 'sale' });

            expect(result.results).toHaveLength(1);
        });
    });

    describe('createTransaction', () => {
        it('should create a new transaction', async () => {
            const newTransaction = {
                transaction_type: 'sale',
                total_amount: 1500,
                paid_amount: 1000,
                contact_id: 'contact-1',
            };

            const mockResponse = {
                id: 'new-1',
                ...newTransaction,
                due_amount: 500,
                reference_number: 'TXN-001',
            };

            mock.onPost(`${API_CONFIG.BASE_URL}/transactions/`).reply(201, mockResponse);

            const result = await transactionService.createTransaction(newTransaction);

            expect(result.id).toBe('new-1');
            expect(result.due_amount).toBe(500);
        });
    });

    describe('getDashboardSummary', () => {
        it('should fetch dashboard summary', async () => {
            const mockSummary = {
                today_sales: 15000,
                today_purchases: 8000,
                today_expenses: 1500,
                total_receivable: 25000,
                total_payable: 10000,
            };

            mock.onGet(`${API_CONFIG.BASE_URL}/transactions/dashboard/`).reply(200, mockSummary);

            const result = await transactionService.getDashboardSummary();

            expect(result.today_sales).toBe(15000);
            expect(result.total_receivable).toBe(25000);
        });
    });
});
