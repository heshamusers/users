/**
 * @file test-users-identity-api.js
 * @description E2E test script for all Users Identity API calls
 * 
 * This script tests all API calls documented in users-identity-api-calls.md
 * to ensure they work correctly end-to-end.
 */

const https = require('https');

// Configuration
const BASE_URL = 'https://users-two-delta.vercel.app/api/identity';
const API_KEY = process.env.USERS_IDENTITY_API_KEY || 'AIzaSyBkZ7r6T9Q0W1E2R3T4Y5U6I7O8P9A0S1D2';

// Test results tracking
const testResults = {
    passed: [],
    failed: [],
    skipped: []
};

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body && method !== 'GET') {
            const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
            options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (body && method !== 'GET') {
            const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
            req.write(bodyStr);
        }

        req.end();
    });
}

// Test helper
async function runTest(name, testFn) {
    console.log(`\n[TEST] ${name}`);
    try {
        const result = await testFn();
        if (result.success) {
            console.log(`[PASS] ${name}`);
            testResults.passed.push({ name, details: result.details });
        } else {
            console.log(`[FAIL] ${name}: ${result.error}`);
            testResults.failed.push({ name, error: result.error, details: result.details });
        }
    } catch (error) {
        console.log(`[ERROR] ${name}: ${error.message}`);
        testResults.failed.push({ name, error: error.message });
    }
}

// ============================================================================
// GET /api/users Tests
// ============================================================================

async function testGetMaxId() {
    const response = await makeRequest('GET', `${BASE_URL}?collection=users&limit=1&key=${API_KEY}`);
    if (response.status === 200) {
        return { success: true, details: response.data };
    }
    return { success: false, error: `Status ${response.status}`, details: response.data };
}

async function testGetUserByKey() {
    // First get a user key from the database
    const listResponse = await makeRequest('GET', `${BASE_URL}?collection=users&limit=1&key=${API_KEY}`);
    if (listResponse.status !== 200 || !listResponse.data.docs || listResponse.data.docs.length === 0) {
        return { success: false, error: 'No users found to test with', details: listResponse.data };
    }
    
    const userKey = listResponse.data.docs[0].fields.user_key.stringValue;
    const response = await makeRequest('GET', `${BASE_URL}/users/${userKey}?key=${API_KEY}`);
    
    if (response.status === 200) {
        return { success: true, details: response.data };
    }
    return { success: false, error: `Status ${response.status}`, details: response.data };
}

async function testGetUserByPhone() {
    // First get a user phone from the database
    const listResponse = await makeRequest('GET', `${BASE_URL}?collection=users&limit=1&key=${API_KEY}`);
    if (listResponse.status !== 200 || !listResponse.data.docs || listResponse.data.docs.length === 0) {
        return { success: false, error: 'No users found to test with', details: listResponse.data };
    }
    
    const phone = listResponse.data.docs[0].fields.phone.stringValue;
    const response = await makeRequest('POST', `${BASE_URL}`, {
        action: 'query',
        collectionName: 'users',
        where: {
            fieldFilter: {
                field: { fieldPath: 'phone' },
                op: 'EQUAL',
                value: { stringValue: phone }
            }
        },
        limit: 1
    }, { 'X-API-Key': API_KEY });
    
    if (response.status === 200) {
        return { success: true, details: response.data };
    }
    return { success: false, error: `Status ${response.status}`, details: response.data };
}

async function testListUsers() {
    const response = await makeRequest('GET', `${BASE_URL}?collection=users&limit=10&key=${API_KEY}`);
    if (response.status === 200) {
        return { success: true, details: response.data };
    }
    return { success: false, error: `Status ${response.status}`, details: response.data };
}

// ============================================================================
// POST /api/users Tests
// ============================================================================

async function testVerifyUser() {
    // First get a user to verify
    const listResponse = await makeRequest('GET', `${BASE_URL}?collection=users&limit=1&key=${API_KEY}`);
    if (listResponse.status !== 200 || !listResponse.data.docs || listResponse.data.docs.length === 0) {
        return { success: false, error: 'No users found to test with', details: listResponse.data };
    }
    
    const user = listResponse.data.docs[0].fields;
    const phone = user.phone.stringValue;
    const userKey = user.user_key.stringValue;
    
    // This test requires the actual API endpoint, not the Firestore REST API
    // For now, we'll skip this as it requires the /api/users endpoint
    return { success: false, error: 'Skipped: Requires /api/users endpoint (not Firestore REST API)', details: null };
}

async function testTouchLogin() {
    // This test requires the actual API endpoint
    return { success: false, error: 'Skipped: Requires /api/users endpoint (not Firestore REST API)', details: null };
}

async function testCreateUser() {
    // Generate a unique test user
    const testUserKey = `test_user_${Date.now()}`;
    const testPhone = `+201${Date.now().toString().slice(-9)}`;
    
    const response = await makeRequest('POST', `${BASE_URL}/users/${testUserKey}`, {
        fields: {
            user_key: { stringValue: testUserKey },
            username: { stringValue: 'Test User' },
            phone: { stringValue: testPhone },
            account_type: { integerValue: '33' },
            password: { stringValue: '1234' },
            created_at: { stringValue: new Date().toISOString() },
            updated_at: { stringValue: new Date().toISOString() }
        }
    }, { 'X-API-Key': API_KEY });
    
    if (response.status === 200 || response.status === 201) {
        // Clean up: delete the test user
        await makeRequest('DELETE', `${BASE_URL}/users/${testUserKey}?key=${API_KEY}`);
        return { success: true, details: response.data };
    }
    return { success: false, error: `Status ${response.status}`, details: response.data };
}

// ============================================================================
// PUT /api/users Tests
// ============================================================================

async function testUpdateUser() {
    // First create a test user
    const testUserKey = `test_update_${Date.now()}`;
    const testPhone = `+201${Date.now().toString().slice(-9)}`;
    
    const createResponse = await makeRequest('POST', `${BASE_URL}/users/${testUserKey}`, {
        fields: {
            user_key: { stringValue: testUserKey },
            username: { stringValue: 'Test Update User' },
            phone: { stringValue: testPhone },
            account_type: { integerValue: '33' },
            created_at: { stringValue: new Date().toISOString() },
            updated_at: { stringValue: new Date().toISOString() }
        }
    }, { 'X-API-Key': API_KEY });
    
    if (createResponse.status !== 200 && createResponse.status !== 201) {
        return { success: false, error: `Failed to create test user: ${createResponse.status}`, details: createResponse.data };
    }
    
    // Update the user
    const updateResponse = await makeRequest('PATCH', `${BASE_URL}/users/${testUserKey}?key=${API_KEY}`, {
        fields: {
            username: { stringValue: 'Updated Test User' },
            updated_at: { stringValue: new Date().toISOString() }
        }
    });
    
    // Clean up
    await makeRequest('DELETE', `${BASE_URL}/users/${testUserKey}?key=${API_KEY}`);
    
    if (updateResponse.status === 200) {
        return { success: true, details: updateResponse.data };
    }
    return { success: false, error: `Status ${updateResponse.status}`, details: updateResponse.data };
}

// ============================================================================
// DELETE /api/users Tests
// ============================================================================

async function testDeleteUser() {
    // First create a test user
    const testUserKey = `test_delete_${Date.now()}`;
    const testPhone = `+201${Date.now().toString().slice(-9)}`;
    
    const createResponse = await makeRequest('POST', `${BASE_URL}/users/${testUserKey}`, {
        fields: {
            user_key: { stringValue: testUserKey },
            username: { stringValue: 'Test Delete User' },
            phone: { stringValue: testPhone },
            account_type: { integerValue: '33' },
            created_at: { stringValue: new Date().toISOString() },
            updated_at: { stringValue: new Date().toISOString() }
        }
    }, { 'X-API-Key': API_KEY });
    
    if (createResponse.status !== 200 && createResponse.status !== 201) {
        return { success: false, error: `Failed to create test user: ${createResponse.status}`, details: createResponse.data };
    }
    
    // Delete the user
    const deleteResponse = await makeRequest('DELETE', `${BASE_URL}/users/${testUserKey}?key=${API_KEY}`);
    
    if (deleteResponse.status === 200 || deleteResponse.status === 204) {
        return { success: true, details: deleteResponse.data };
    }
    return { success: false, error: `Status ${deleteResponse.status}`, details: deleteResponse.data };
}

// ============================================================================
// GET /api/tokens Tests
// ============================================================================

async function testGetTokens() {
    const response = await makeRequest('GET', `${BASE_URL}?collection=user_tokens&limit=10&key=${API_KEY}`);
    if (response.status === 200) {
        return { success: true, details: response.data };
    }
    return { success: false, error: `Status ${response.status}`, details: response.data };
}

async function testGetTokensByUserKey() {
    // First get a user key
    const listResponse = await makeRequest('GET', `${BASE_URL}?collection=users&limit=1&key=${API_KEY}`);
    if (listResponse.status !== 200 || !listResponse.data.docs || listResponse.data.docs.length === 0) {
        return { success: false, error: 'No users found to test with', details: listResponse.data };
    }
    
    const userKey = listResponse.data.docs[0].fields.user_key.stringValue;
    const response = await makeRequest('POST', `${BASE_URL}`, {
        action: 'query',
        collectionName: 'user_tokens',
        where: {
            fieldFilter: {
                field: { fieldPath: 'user_key' },
                op: 'EQUAL',
                value: { stringValue: userKey }
            }
        },
        limit: 10
    }, { 'X-API-Key': API_KEY });
    
    if (response.status === 200) {
        return { success: true, details: response.data };
    }
    return { success: false, error: `Status ${response.status}`, details: response.data };
}

// ============================================================================
// POST /api/tokens Tests
// ============================================================================

async function testCreateToken() {
    const testTokenId = `test_token_${Date.now()}`;
    const userKey = `test_user_${Date.now()}`;
    
    const response = await makeRequest('POST', `${BASE_URL}/user_tokens/${testTokenId}`, {
        fields: {
            id: { stringValue: testTokenId },
            user_key: { stringValue: userKey },
            fcm_token: { stringValue: 'test_fcm_token_string' },
            platform: { stringValue: 'web' },
            created_at: { stringValue: new Date().toISOString() },
            updated_at: { stringValue: new Date().toISOString() }
        }
    }, { 'X-API-Key': API_KEY });
    
    // Clean up
    await makeRequest('DELETE', `${BASE_URL}/user_tokens/${testTokenId}?key=${API_KEY}`);
    
    if (response.status === 200 || response.status === 201) {
        return { success: true, details: response.data };
    }
    return { success: false, error: `Status ${response.status}`, details: response.data };
}

// ============================================================================
// DELETE /api/tokens Tests
// ============================================================================

async function testDeleteToken() {
    // First create a test token
    const testTokenId = `test_delete_token_${Date.now()}`;
    const userKey = `test_user_${Date.now()}`;
    
    const createResponse = await makeRequest('POST', `${BASE_URL}/user_tokens/${testTokenId}`, {
        fields: {
            id: { stringValue: testTokenId },
            user_key: { stringValue: userKey },
            fcm_token: { stringValue: 'test_fcm_token_string' },
            platform: { stringValue: 'web' },
            created_at: { stringValue: new Date().toISOString() },
            updated_at: { stringValue: new Date().toISOString() }
        }
    }, { 'X-API-Key': API_KEY });
    
    if (createResponse.status !== 200 && createResponse.status !== 201) {
        return { success: false, error: `Failed to create test token: ${createResponse.status}`, details: createResponse.data };
    }
    
    // Delete the token
    const deleteResponse = await makeRequest('DELETE', `${BASE_URL}/user_tokens/${testTokenId}?key=${API_KEY}`);
    
    if (deleteResponse.status === 200 || deleteResponse.status === 204) {
        return { success: true, details: deleteResponse.data };
    }
    return { success: false, error: `Status ${deleteResponse.status}`, details: deleteResponse.data };
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
    console.log('========================================');
    console.log('Users Identity API E2E Test Suite');
    console.log('========================================');
    console.log(`BASE_URL: ${BASE_URL}`);
    console.log(`API_KEY: ${API_KEY.substring(0, 10)}...`);
    
    // GET /api/users tests
    await runTest('GET /api/users - Get Max ID', testGetMaxId);
    await runTest('GET /api/users - Get User by Key', testGetUserByKey);
    await runTest('GET /api/users - Get User by Phone', testGetUserByPhone);
    await runTest('GET /api/users - List Users', testListUsers);
    
    // POST /api/users tests
    await runTest('POST /api/users - Verify User', testVerifyUser);
    await runTest('POST /api/users - Touch Login', testTouchLogin);
    await runTest('POST /api/users - Create User', testCreateUser);
    
    // PUT /api/users tests
    await runTest('PUT /api/users - Update User', testUpdateUser);
    
    // DELETE /api/users tests
    await runTest('DELETE /api/users - Delete User', testDeleteUser);
    
    // GET /api/tokens tests
    await runTest('GET /api/tokens - Get All Tokens', testGetTokens);
    await runTest('GET /api/tokens - Get Tokens by User Key', testGetTokensByUserKey);
    
    // POST /api/tokens tests
    await runTest('POST /api/tokens - Create Token', testCreateToken);
    
    // DELETE /api/tokens tests
    await runTest('DELETE /api/tokens - Delete Token', testDeleteToken);
    
    // Print summary
    console.log('\n========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Passed: ${testResults.passed.length}`);
    console.log(`Failed: ${testResults.failed.length}`);
    console.log(`Skipped: ${testResults.skipped.length}`);
    
    if (testResults.failed.length > 0) {
        console.log('\nFailed Tests:');
        testResults.failed.forEach(f => {
            console.log(`  - ${f.name}: ${f.error}`);
        });
    }
    
    return testResults;
}

// Run tests if executed directly
if (require.main === module) {
    runAllTests()
        .then(results => {
            process.exit(results.failed.length > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Test suite error:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests, testResults };
