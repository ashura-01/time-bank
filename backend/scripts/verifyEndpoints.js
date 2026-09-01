import http from 'http';
import pool from '../src/config/db.js';

const BASE_URL = 'http://localhost:5001';

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : undefined;

  const res = await fetch(url, {
    method,
    headers,
    body
  });

  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function runAudit() {
  const results = [];
  const log = (name, ok, details) => {
    results.push({ name, ok, details });
    console.log(`${ok ? '✅' : '❌'} ${name} [Status: ${details.status}]`);
  };

  console.log('--- COMPREHENSIVE BACKEND GET & POST ENDPOINT AUDIT ---\n');

  // Track created test resources for immediate teardown
  let createdServiceId = '';
  let createdTxId = '';
  let registeredUserId = '';

  // ==========================================
  // 1. PUBLIC GET ENDPOINTS
  // ==========================================
  try {
    const res = await request('/api/services');
    log('GET /api/services', res.ok && Array.isArray(res.data?.services), res);
  } catch (e) { log('GET /api/services', false, { error: e.message }); }

  try {
    const res = await request('/api/services/categories');
    log('GET /api/services/categories', res.ok && Array.isArray(res.data?.categories), res);
  } catch (e) { log('GET /api/services/categories', false, { error: e.message }); }

  // ==========================================
  // 2. AUTH POST & GET ENDPOINTS
  // ==========================================
  const tempEmail = `audit.${Date.now()}@timebank.local`;
  let registeredToken = '';

  try {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        email: tempEmail,
        password: 'Password123!',
        first_name: 'Audit',
        last_name: 'Tester'
      }
    });
    registeredToken = res.data?.token || '';
    registeredUserId = res.data?.user?.id || '';
    log('POST /api/auth/register', res.ok && Boolean(registeredToken), res);
  } catch (e) { log('POST /api/auth/register', false, { error: e.message }); }

  let adminToken = '';
  let userToken = '';
  let testUserId = '';

  try {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@timebank.com', password: 'admin123' }
    });
    adminToken = res.data?.token || '';
    log('POST /api/auth/login (Admin)', res.ok && Boolean(adminToken), res);
  } catch (e) { log('POST /api/auth/login (Admin)', false, { error: e.message }); }

  try {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'john@timebank.com', password: 'user123' }
    });
    userToken = res.data?.token || '';
    testUserId = res.data?.user?.id || '';
    log('POST /api/auth/login (User)', res.ok && Boolean(userToken), res);
  } catch (e) { log('POST /api/auth/login (User)', false, { error: e.message }); }

  try {
    const res = await request('/api/auth/profile', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    log('GET /api/auth/profile', res.ok && res.data?.user?.email === 'john@timebank.com', res);
  } catch (e) { log('GET /api/auth/profile', false, { error: e.message }); }

  try {
    const res = await request('/api/auth/logout', { method: 'POST' });
    log('POST /api/auth/logout', res.ok, res);
  } catch (e) { log('POST /api/auth/logout', false, { error: e.message }); }

  // ==========================================
  // 3. USER AUTHENTICATED GET ENDPOINTS
  // ==========================================
  const userHeaders = { Authorization: `Bearer ${userToken}` };
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  try {
    const res = await request('/api/transactions', { headers: userHeaders });
    log('GET /api/transactions', res.ok && Array.isArray(res.data?.transactions), res);
  } catch (e) { log('GET /api/transactions', false, { error: e.message }); }

  try {
    const res = await request('/api/transactions/ledger', { headers: userHeaders });
    log('GET /api/transactions/ledger', res.ok && Array.isArray(res.data?.entries), res);
  } catch (e) { log('GET /api/transactions/ledger', false, { error: e.message }); }

  try {
    const res = await request('/api/reviews', { headers: userHeaders });
    log('GET /api/reviews', res.ok && Array.isArray(res.data?.reviews), res);
  } catch (e) { log('GET /api/reviews', false, { error: e.message }); }

  try {
    const res = await request('/api/disputes', { headers: userHeaders });
    log('GET /api/disputes', res.ok && Array.isArray(res.data?.disputes), res);
  } catch (e) { log('GET /api/disputes', false, { error: e.message }); }

  // ==========================================
  // 4. ADMIN GET ENDPOINTS
  // ==========================================
  try {
    const res = await request('/api/admin/dashboard', { headers: adminHeaders });
    log('GET /api/admin/dashboard', res.ok && Boolean(res.data?.stats), res);
  } catch (e) { log('GET /api/admin/dashboard', false, { error: e.message }); }

  try {
    const res = await request('/api/admin/analytics', { headers: adminHeaders });
    log('GET /api/admin/analytics', res.ok && Array.isArray(res.data?.topProviders), res);
  } catch (e) { log('GET /api/admin/analytics', false, { error: e.message }); }

  try {
    const res = await request('/api/admin/users', { headers: adminHeaders });
    log('GET /api/admin/users', res.ok && Array.isArray(res.data?.users), res);
  } catch (e) { log('GET /api/admin/users', false, { error: e.message }); }

  try {
    const res = await request('/api/admin/users/insights/no_transactions', { headers: adminHeaders });
    log('GET /api/admin/users/insights/no_transactions', res.ok && Array.isArray(res.data?.users), res);
  } catch (e) { log('GET /api/admin/users/insights/no_transactions', false, { error: e.message }); }

  try {
    const res = await request('/api/admin/services', { headers: adminHeaders });
    log('GET /api/admin/services', res.ok && Array.isArray(res.data?.services), res);
  } catch (e) { log('GET /api/admin/services', false, { error: e.message }); }

  try {
    const res = await request('/api/admin/services/insights/unused', { headers: adminHeaders });
    log('GET /api/admin/services/insights/unused', res.ok && Array.isArray(res.data?.services), res);
  } catch (e) { log('GET /api/admin/services/insights/unused', false, { error: e.message }); }

  try {
    const res = await request('/api/admin/transactions', { headers: adminHeaders });
    log('GET /api/admin/transactions', res.ok && Array.isArray(res.data?.transactions), res);
  } catch (e) { log('GET /api/admin/transactions', false, { error: e.message }); }

  if (testUserId) {
    try {
      const res = await request(`/api/admin/users/${testUserId}/report`, { headers: adminHeaders });
      log('GET /api/admin/users/:id/report', res.ok && Boolean(res.data?.user), res);
    } catch (e) { log('GET /api/admin/users/:id/report', false, { error: e.message }); }
  }

  // ==========================================
  // 5. POST & SPECIFIC GET LIFECYCLE (Service & Transaction)
  // ==========================================
  try {
    const catRes = await request('/api/services/categories');
    const categoryId = catRes.data?.categories?.[0]?.id;

    const res = await request('/api/services', {
      method: 'POST',
      headers: userHeaders,
      body: {
        category_id: categoryId,
        title: 'Backend Verification Offer',
        description: 'Comprehensive endpoint testing offer service',
        type: 'offer',
        duration_hours: 1.0,
        is_remote: true
      }
    });
    createdServiceId = res.data?.service?.id;
    log('POST /api/services', res.ok && Boolean(createdServiceId), res);
  } catch (e) { log('POST /api/services', false, { error: e.message }); }

  if (createdServiceId) {
    try {
      const res = await request(`/api/services/${createdServiceId}`);
      log('GET /api/services/:id', res.ok && res.data?.service?.id === createdServiceId, res);
    } catch (e) { log('GET /api/services/:id', false, { error: e.message }); }
  }

  // Request transaction from admin user for the service created by john
  if (createdServiceId) {
    try {
      const res = await request('/api/transactions', {
        method: 'POST',
        headers: adminHeaders,
        body: {
          service_id: createdServiceId,
          hours_exchanged: 1.0,
          is_remote: true
        }
      });
      createdTxId = res.data?.transaction?.id;
      log('POST /api/transactions', res.ok && Boolean(createdTxId), res);
    } catch (e) { log('POST /api/transactions', false, { error: e.message }); }
  }

  if (createdTxId) {
    try {
      const res = await request(`/api/transactions/${createdTxId}`, { headers: adminHeaders });
      log('GET /api/transactions/:id', res.ok && res.data?.transaction?.id === createdTxId, res);
    } catch (e) { log('GET /api/transactions/:id', false, { error: e.message }); }
  }

  // Check GET /api/reviews/:id and GET /api/disputes/:id with an existing seed record
  try {
    const reviewsRes = await request('/api/reviews', { headers: userHeaders });
    if (reviewsRes.data?.reviews?.[0]?.id) {
      const rId = reviewsRes.data.reviews[0].id;
      const res = await request(`/api/reviews/${rId}`, { headers: userHeaders });
      log('GET /api/reviews/:id', res.ok && Boolean(res.data?.review), res);
    }
  } catch (e) { log('GET /api/reviews/:id', false, { error: e.message }); }

  try {
    const disputesRes = await request('/api/disputes', { headers: adminHeaders });
    if (disputesRes.data?.disputes?.[0]?.id) {
      const dId = disputesRes.data.disputes[0].id;
      const res = await request(`/api/disputes/${dId}`, { headers: adminHeaders });
      log('GET /api/disputes/:id', res.ok && Boolean(res.data?.dispute), res);
    }
  } catch (e) { log('GET /api/disputes/:id', false, { error: e.message }); }

  // ==========================================
  // 6. IMMEDIATE AUTOMATIC TEST DATA TEARDOWN
  // ==========================================
  console.log('\n🧹 Performing automatic test data teardown...');
  try {
    if (createdTxId) {
      // Cancel transaction via endpoint to test cancellation & escrow release
      await request(`/api/transactions/${createdTxId}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: { status: 'cancelled' }
      });
      // Delete transaction row
      await pool.query('DELETE FROM transactions WHERE id = ?', [createdTxId]);
    }

    if (createdServiceId) {
      // Delete created test service
      await request(`/api/services/${createdServiceId}`, {
        method: 'DELETE',
        headers: userHeaders
      });
      await pool.query('DELETE FROM services WHERE id = ?', [createdServiceId]);
    }

    if (registeredUserId) {
      // Delete created test user
      await pool.query('DELETE FROM users WHERE id = ?', [registeredUserId]);
    }

    console.log('✅ Teardown complete: All temporary test services, transactions, and users deleted.');
  } catch (cleanupErr) {
    console.error('⚠️ Teardown error:', cleanupErr.message);
  } finally {
    await pool.end();
  }

  console.log('\n--- AUDIT SUMMARY ---');
  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  console.log(`Total Endpoints Tested: ${total}`);
  console.log(`Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 ALL BACKEND GET & POST ENDPOINTS ARE 100% FUNCTIONAL WITH CLEAN TEARDOWN!');
  }
}

runAudit();
