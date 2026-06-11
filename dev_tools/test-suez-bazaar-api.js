/**
 * @file test-suez-bazaar-api.js
 * @description E2E test script for suez-bazaar-devolver local server API endpoints
 * 
 * This script tests all API calls documented in users-identity-api-calls.md
 * using the suez-bazaar-devolver project's local development server.
 */

import http from 'http';

// Configuration
const LOCAL_API_URL = 'http://127.0.0.1:5500';

// Test results tracking
const testResults = {
    passed: [],
    failed: [],
    skipped: []
};

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, LOCAL_API_URL);
        const options = {
            hostname: url.hostname,
            port: url.port || 5500,
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

        const req = http.request(options, (res) => {
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

async function testListUsers() {
    try {
        const response = await makeRequest('GET', '/api/users?limit=10');
        if (response.status === 200) {
            return { success: true, details: { count: Array.isArray(response.data) ? response.data.length : 0 } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testGetUserByKey() {
    try {
        // First get a user to test with
        const listResponse = await makeRequest('GET', '/api/users?limit=1');
        if (listResponse.status !== 200 || !Array.isArray(listResponse.data) || listResponse.data.length === 0) {
            return { success: false, error: 'No users found to test with', details: listResponse.data };
        }
        
        const userKey = listResponse.data[0].user_key;
        const response = await makeRequest('GET', `/api/users?user_key=${encodeURIComponent(userKey)}`);
        
        if (response.status === 200) {
            return { success: true, details: { userKey, found: Array.isArray(response.data) && response.data.length > 0 } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testGetUserByPhone() {
    try {
        // First get a user to test with
        const listResponse = await makeRequest('GET', '/api/users?limit=1');
        if (listResponse.status !== 200 || !Array.isArray(listResponse.data) || listResponse.data.length === 0) {
            return { success: false, error: 'No users found to test with', details: listResponse.data };
        }
        
        const phone = listResponse.data[0].phone;
        const response = await makeRequest('GET', `/api/users?phone=${encodeURIComponent(phone)}`);
        
        if (response.status === 200) {
            return { success: true, details: { phone, found: Array.isArray(response.data) && response.data.length > 0 } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testGetMultipleUsersByKeys() {
    try {
        // First get users to test with
        const listResponse = await makeRequest('GET', '/api/users?limit=3');
        if (listResponse.status !== 200 || !Array.isArray(listResponse.data) || listResponse.data.length < 2) {
            return { success: false, error: 'Need at least 2 users to test', details: listResponse.data };
        }
        
        const userKeys = listResponse.data.slice(0, 2).map(u => u.user_key).join(',');
        const response = await makeRequest('GET', `/api/users?user_keys=${encodeURIComponent(userKeys)}`);
        
        if (response.status === 200) {
            return { success: true, details: { keys: userKeys, count: Array.isArray(response.data) ? response.data.length : 0 } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testCategorySearch() {
    try {
        const response = await makeRequest('GET', '/api/users?mode=category_search&main_id=1&limit=10');
        if (response.status === 200) {
            return { success: true, details: { count: Array.isArray(response.data) ? response.data.length : 0 } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testGetMaxId() {
    try {
        const response = await makeRequest('GET', '/api/users?mode=max_id');
        if (response.status === 200) {
            return { success: true, details: response.data };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testCheckPhoneAvailability() {
    try {
        // Test with a non-existent phone
        const response = await makeRequest('GET', '/api/users?phone=+201000000000&exists=1');
        if (response.status === 200) {
            return { success: true, details: response.data };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

// ============================================================================
// POST /api/users Tests
// ============================================================================

async function testVerifyUser() {
    try {
        // First get a user to verify
        const listResponse = await makeRequest('GET', '/api/users?limit=1');
        if (listResponse.status !== 200 || !Array.isArray(listResponse.data) || listResponse.data.length === 0) {
            return { success: false, error: 'No users found to test with', details: listResponse.data };
        }
        
        const user = listResponse.data[0];
        const response = await makeRequest('POST', '/api/users', {
            action: 'verify',
            phone: user.phone,
            password: user.password || '1234'
        });
        
        if (response.status === 200) {
            return { success: true, details: { verified: !!response.data.user_key } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testCreateUser() {
    try {
        const testUserKey = `test_user_${Date.now()}`;
        const testPhone = `+201${Date.now().toString().slice(-9)}`;
        
        const response = await makeRequest('POST', '/api/users', {
            user_key: testUserKey,
            username: 'Test User',
            phone: testPhone,
            account_type: 33,
            password: '1234'
        });
        
        // Clean up: delete the test user
        await makeRequest('DELETE', `/api/users?user_key=${encodeURIComponent(testUserKey)}`);
        
        if (response.status === 200 || response.status === 201) {
            return { success: true, details: { userKey: testUserKey } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testTouchLogin() {
    try {
        // First get a user
        const listResponse = await makeRequest('GET', '/api/users?limit=1');
        if (listResponse.status !== 200 || !Array.isArray(listResponse.data) || listResponse.data.length === 0) {
            return { success: false, error: 'No users found to test with', details: listResponse.data };
        }
        
        const userKey = listResponse.data[0].user_key;
        const response = await makeRequest('POST', '/api/users', {
            action: 'touch_login',
            user_key: userKey
        });
        
        if (response.status === 200) {
            return { success: true, details: { userKey } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

// ============================================================================
// PUT /api/users Tests
// ============================================================================

async function testUpdateUser() {
    try {
        // First create a test user
        const testUserKey = `test_update_${Date.now()}`;
        const testPhone = `+201${Date.now().toString().slice(-9)}`;
        
        const createResponse = await makeRequest('POST', '/api/users', {
            user_key: testUserKey,
            username: 'Test Update User',
            phone: testPhone,
            account_type: 33,
            password: '1234'
        });
        
        if (createResponse.status !== 200 && createResponse.status !== 201) {
            return { success: false, error: `Failed to create test user: ${createResponse.status}`, details: createResponse.data };
        }
        
        // Update the user
        const updateResponse = await makeRequest('PUT', '/api/users', {
            user_key: testUserKey,
            username: 'Updated Test User'
        });
        
        // Clean up
        await makeRequest('DELETE', `/api/users?user_key=${encodeURIComponent(testUserKey)}`);
        
        if (updateResponse.status === 200) {
            return { success: true, details: { userKey: testUserKey } };
        }
        return { success: false, error: `Status ${updateResponse.status}`, details: updateResponse.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testUpdateMultipleUsers() {
    try {
        // First create test users
        const testUserKey1 = `test_update_multi1_${Date.now()}`;
        const testUserKey2 = `test_update_multi2_${Date.now()}`;
        
        const createResponse1 = await makeRequest('POST', '/api/users', {
            user_key: testUserKey1,
            username: 'Test Update Multi User 1',
            phone: `+201${Date.now().toString().slice(-9)}1`,
            account_type: 33,
            password: '1234'
        });
        
        const createResponse2 = await makeRequest('POST', '/api/users', {
            user_key: testUserKey2,
            username: 'Test Update Multi User 2',
            phone: `+201${Date.now().toString().slice(-9)}2`,
            account_type: 33,
            password: '1234'
        });
        
        if (createResponse1.status !== 200 && createResponse1.status !== 201) {
            return { success: false, error: `Failed to create test user 1: ${createResponse1.status}`, details: createResponse1.data };
        }
        
        if (createResponse2.status !== 200 && createResponse2.status !== 201) {
            return { success: false, error: `Failed to create test user 2: ${createResponse2.status}`, details: createResponse2.data };
        }
        
        // Update multiple users
        const updateResponse = await makeRequest('PUT', '/api/users', [
            { user_key: testUserKey1, username: 'Updated Multi User 1' },
            { user_key: testUserKey2, username: 'Updated Multi User 2' }
        ]);
        
        // Clean up
        await makeRequest('DELETE', `/api/users?user_key=${encodeURIComponent(testUserKey1)}`);
        await makeRequest('DELETE', `/api/users?user_key=${encodeURIComponent(testUserKey2)}`);
        
        if (updateResponse.status === 200) {
            return { success: true, details: { userKeys: [testUserKey1, testUserKey2] } };
        }
        return { success: false, error: `Status ${updateResponse.status}`, details: updateResponse.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testUpdateUserField() {
    try {
        // First create a test user
        const testUserKey = `test_update_field_${Date.now()}`;
        const testPhone = `+201${Date.now().toString().slice(-9)}`;
        
        const createResponse = await makeRequest('POST', '/api/users', {
            user_key: testUserKey,
            username: 'Test Update Field User',
            phone: testPhone,
            account_type: 33,
            password: '1234'
        });
        
        if (createResponse.status !== 200 && createResponse.status !== 201) {
            return { success: false, error: `Failed to create test user: ${createResponse.status}`, details: createResponse.data };
        }
        
        // Update specific field
        const updateResponse = await makeRequest('PUT', '/api/users', {
            user_key: testUserKey,
            field: 'username',
            value: 'Field Updated User'
        });
        
        // Clean up
        await makeRequest('DELETE', `/api/users?user_key=${encodeURIComponent(testUserKey)}`);
        
        if (updateResponse.status === 200) {
            return { success: true, details: { userKey: testUserKey } };
        }
        return { success: false, error: `Status ${updateResponse.status}`, details: updateResponse.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

// ============================================================================
// DELETE /api/users Tests
// ============================================================================

async function testDeleteUser() {
    try {
        // First create a test user
        const testUserKey = `test_delete_${Date.now()}`;
        const testPhone = `+201${Date.now().toString().slice(-9)}`;
        
        const createResponse = await makeRequest('POST', '/api/users', {
            user_key: testUserKey,
            username: 'Test Delete User',
            phone: testPhone,
            account_type: 33,
            password: '1234'
        });
        
        if (createResponse.status !== 200 && createResponse.status !== 201) {
            return { success: false, error: `Failed to create test user: ${createResponse.status}`, details: createResponse.data };
        }
        
        // Delete the user
        const deleteResponse = await makeRequest('DELETE', `/api/users?user_key=${encodeURIComponent(testUserKey)}`);
        
        if (deleteResponse.status === 200) {
            return { success: true, details: { userKey: testUserKey } };
        }
        return { success: false, error: `Status ${deleteResponse.status}`, details: deleteResponse.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

// ============================================================================
// GET /api/tokens Tests
// ============================================================================

async function testGetTokens() {
    try {
        const response = await makeRequest('GET', '/api/tokens?limit=10');
        if (response.status === 200) {
            return { success: true, details: { count: Array.isArray(response.data) ? response.data.length : 0 } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testGetTokensByUserKey() {
    try {
        // First get a user
        const listResponse = await makeRequest('GET', '/api/users?limit=1');
        if (listResponse.status !== 200 || !Array.isArray(listResponse.data) || listResponse.data.length === 0) {
            return { success: false, error: 'No users found to test with', details: listResponse.data };
        }
        
        const userKey = listResponse.data[0].user_key;
        const response = await makeRequest('GET', `/api/tokens?userKeys=${encodeURIComponent(userKey)}`);
        
        if (response.status === 200) {
            return { success: true, details: { userKey, count: Array.isArray(response.data) ? response.data.length : 0 } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

// ============================================================================
// POST /api/tokens Tests
// ============================================================================

async function testCreateToken() {
    try {
        const testUserKey = `test_token_user_${Date.now()}`;
        const testToken = `test_fcm_token_${Date.now()}`;
        
        const response = await makeRequest('POST', '/api/tokens', {
            user_key: testUserKey,
            fcm_token: testToken,
            platform: 'web'
        });
        
        // Clean up
        await makeRequest('DELETE', `/api/tokens?token=${encodeURIComponent(testToken)}`);
        
        if (response.status === 200 || response.status === 201) {
            return { success: true, details: { userKey: testUserKey } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

// ============================================================================
// DELETE /api/tokens Tests
// ============================================================================

async function testDeleteToken() {
    try {
        // First create a test token
        const testUserKey = `test_delete_token_user_${Date.now()}`;
        const testToken = `test_delete_fcm_token_${Date.now()}`;
        
        const createResponse = await makeRequest('POST', '/api/tokens', {
            user_key: testUserKey,
            fcm_token: testToken,
            platform: 'web'
        });
        
        if (createResponse.status !== 200 && createResponse.status !== 201) {
            return { success: false, error: `Failed to create test token: ${createResponse.status}`, details: createResponse.data };
        }
        
        // Delete the token
        const deleteResponse = await makeRequest('DELETE', `/api/tokens?token=${encodeURIComponent(testToken)}`);
        
        if (deleteResponse.status === 200) {
            return { success: true, details: { token: testToken } };
        }
        return { success: false, error: `Status ${deleteResponse.status}`, details: deleteResponse.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testDeleteTokensByUserKey() {
    try {
        // First create a test token
        const testUserKey = `test_delete_tokens_user_${Date.now()}`;
        const testToken = `test_delete_tokens_fcm_${Date.now()}`;
        
        const createResponse = await makeRequest('POST', '/api/tokens', {
            user_key: testUserKey,
            fcm_token: testToken,
            platform: 'web'
        });
        
        if (createResponse.status !== 200 && createResponse.status !== 201) {
            return { success: false, error: `Failed to create test token: ${createResponse.status}`, details: createResponse.data };
        }
        
        // Delete tokens by user key
        const deleteResponse = await makeRequest('DELETE', `/api/tokens?user_key=${encodeURIComponent(testUserKey)}`);
        
        if (deleteResponse.status === 200) {
            return { success: true, details: { userKey: testUserKey } };
        }
        return { success: false, error: `Status ${deleteResponse.status}`, details: deleteResponse.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
    console.log('========================================');
    console.log('Suez-Bazaar-Devolver API E2E Test Suite');
    console.log('========================================');
    console.log(`API_URL: ${LOCAL_API_URL}`);
    
    // Check if server is running
    try {
        await makeRequest('GET', '/api/users?limit=1');
        console.log('[INFO] Server is reachable');
    } catch (error) {
        console.log('[ERROR] Server is not running. Please start the suez-bazaar-devolver server first.');
        console.log('[INFO] Open suez-bazaar-devolver project in VS Code and use Live Server extension');
        return testResults;
    }
    
    // GET /api/users tests
    await runTest('GET /api/users - List Users', testListUsers);
    await runTest('GET /api/users - Get User by Key', testGetUserByKey);
    await runTest('GET /api/users - Get User by Phone', testGetUserByPhone);
    await runTest('GET /api/users - Get Multiple Users by Keys', testGetMultipleUsersByKeys);
    await runTest('GET /api/users - Category Search', testCategorySearch);
    await runTest('GET /api/users - Get Max ID', testGetMaxId);
    await runTest('GET /api/users - Check Phone Availability', testCheckPhoneAvailability);
    
    // POST /api/users tests
    await runTest('POST /api/users - Verify User', testVerifyUser);
    await runTest('POST /api/users - Create User', testCreateUser);
    await runTest('POST /api/users - Touch Login', testTouchLogin);
    
    // PUT /api/users tests
    await runTest('PUT /api/users - Update User', testUpdateUser);
    await runTest('PUT /api/users - Update Multiple Users', testUpdateMultipleUsers);
    await runTest('PUT /api/users - Update User Field', testUpdateUserField);
    
    // DELETE /api/users tests
    await runTest('DELETE /api/users - Delete User', testDeleteUser);
    
    // GET /api/tokens tests
    await runTest('GET /api/tokens - Get All Tokens', testGetTokens);
    await runTest('GET /api/tokens - Get Tokens by User Key', testGetTokensByUserKey);
    
    // POST /api/tokens tests
    await runTest('POST /api/tokens - Create Token', testCreateToken);
    
    // DELETE /api/tokens tests
    await runTest('DELETE /api/tokens - Delete Token', testDeleteToken);
    await runTest('DELETE /api/tokens - Delete Tokens by User Key', testDeleteTokensByUserKey);
    
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
console.log('Starting test suite...');
runAllTests()
    .then(results => {
        console.log('Test suite completed');
        process.exit(results.failed.length > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('Test suite error:', error);
        process.exit(1);
    });

export { runAllTests, testResults };
