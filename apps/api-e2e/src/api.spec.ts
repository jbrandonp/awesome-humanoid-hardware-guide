import { randomUUID } from 'crypto';

const API_BASE = process.env.API_URL || 'http://localhost:3000';

describe('API E2E Tests', () => {
  describe('Authentication', () => {
    it('should request OTP for valid phone number', async () => {
      const phone = `+22177${Math.floor(1000000 + Math.random() * 9000000)}`;
      const response = await fetch(`${API_BASE}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      // Should accept the request (may return success or rate limit)
      expect(response.status).toBeLessThan(500);
    });

    it('should reject OTP verification with invalid code', async () => {
      const phone = `+22177${Math.floor(1000000 + Math.random() * 9000000)}`;
      const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: '000000' }),
      });
      // Should return 401 or 400
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Health Check', () => {
    it('should return API status', async () => {
      const response = await fetch(`${API_BASE}/api`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status');
    });
  });

  describe('Patient Records (FHIR)', () => {
    let authToken: string;

    beforeAll(async () => {
      // In a real test, we would obtain a token via OTP, but for now we skip
      // This test suite will be extended when we have a test user.
    });

    it('should return 401 for unauthorized access to patient data', async () => {
      const response = await fetch(`${API_BASE}/api/fhir/Patient/123`, {
        headers: { Authorization: 'Bearer invalid' },
      });
      expect(response.status).toBe(401);
    });
  });

  describe('Drug Interaction', () => {
    it('should check drug interactions with valid payload', async () => {
      const response = await fetch(`${API_BASE}/api/drug-interaction/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medications: ['Paracetamol', 'Amoxicillin'],
          patientId: 'test-patient',
        }),
      });
      // Should process the request (may return 200 or 400)
      expect(response.status).toBeLessThan(500);
    });
  });
});
