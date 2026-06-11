/**
 * @file test-identity-api.js
 * @description E2E test script for Vercel Identity API
 * 
 * This script tests all API calls documented in users-identity-api-calls.md
 * using the Vercel Identity API directly.
 */

import https from 'https';

// Configuration
const BASE_URL = 'https://users-two-delta.vercel.app/api/identity';

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
// GET Tests
// ============================================================================

async function testListDocs() {
    try {
        const response = await makeRequest('GET', '/?collection=users&limit=10');
        if (response.status === 200) {
            return { success: true, details: { count: Array.isArray(response.data) ? response.data.length : 0 } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testGetDoc() {
    try {
        // First list to get a doc ID
        const listResponse = await makeRequest('GET', '/?collection=users&limit=1');
        if (listResponse.status !== 200 || !Array.isArray(listResponse.data) || listResponse.data.length === 0) {
            return { success: false, error: 'No docs found to test with', details: listResponse.data };
        }
        
        const docId = listResponse.data[0]._docId || listResponse.data[0].id;
        const response = await makeRequest('GET', `/users/${docId}`);
        
        if (response.status === 200) {
            return { success: true, details: { docId } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

// ============================================================================
// POST Tests
// ============================================================================

async function testCreateDoc() {
    try {
        const testDocId = `test_doc_${Date.now()}`;
        const body = {
            user_key: testDocId,
            username: 'Test User',
            phone: '+201000000000',
            created_at: new Date().toISOString()
        };
        
        const response = await makeRequest('POST', `/users/${testDocId}`, body, { 'X-API-Key': 'test-key' });
        
        // Clean up
        await makeRequest('DELETE', `/users/${testDocId}`, null, { 'X-API-Key': 'test-key' });
        
        if (response.status === 200 || response.status === 201) {
            return { success: true, details: { docId: testDocId } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testQuery() {
    try {
        const body = {
            action: 'query',
            collectionName: 'users',
            limit: 1
        };
        const response = await makeRequest('POST', '/', body, { 'X-API-Key': 'test-key' });
        if (response.status === 200) {
            return { success: true, details: { count: Array.isArray(response.data) ? response.data.length : 0 } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

// ============================================================================
// DELETE Tests
// ============================================================================

async function testDeleteDoc() {
    try {
        const testDocId = `test_delete_${Date.now()}`;
        
        // First create
        const createBody = {
            user_key: testDocId,
            username: 'Test User',
            created_at: new Date().toISOString()
        };
        const createResponse = await makeRequest('POST', `/users/${testDocId}`, createBody, { 'X-API-Key': 'test-key' });
        
        if (createResponse.status !== 200 && createResponse.status !== 201) {
            return { success: false, error: `Failed to create test doc: ${createResponse.status}`, details: createResponse.data };
        }
        
        // Then delete
        const deleteResponse = await makeRequest('DELETE', `/users/${testDocId}`, null, { 'X-API-Key': 'test-key' });
        
        if (deleteResponse.status === 200 || deleteResponse.status === 204) {
            return { success: true, details: { docId: testDocId } };
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
    console.log('Vercel Identity API E2E Test Suite');
    console.log('========================================');
    console.log(`BASE_URL: ${BASE_URL}`);
    
    // Check if server is reachable
    try {
        await makeRequest('GET', '/?collection=users&limit=1');
        console.log('[INFO] Server is reachable');
    } catch (error) {
        console.log('[ERROR] Server is not reachable:', error.message);
        return testResults;
    }
    
    // GET tests
    await runTest('GET / - List Documents', testListDocs);
    await runTest('GET /users/{id} - Get Document', testGetDoc);
    
    // POST tests
    await runTest('POST /users/{id} - Create Document', testCreateDoc);
    await runTest('POST / - Query Documents', testQuery);
    
    // DELETE tests
    await runTest('DELETE /users/{id} - Delete Document', testDeleteDoc);
    
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
