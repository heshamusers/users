/**
 * @file test-firestore-rest-api.js
 * @description E2E test script for Firestore REST API
 * 
 * This script tests all API calls documented in users-identity-api-calls.md
 * using the Firestore REST API directly with API_KEY.
 */

import https from 'https';

// Configuration
const BASE_URL = 'https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents';
const API_KEY = 'AIzaSyBkZ7r6T9Q0W1E2R3T4Y5U6I7O8P9A0S1D2'; // Default placeholder - will need actual key

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

async function testGetDoc() {
    try {
        const response = await makeRequest('GET', `/users?pageSize=1&key=${API_KEY}`);
        if (response.status === 200) {
            return { success: true, details: { count: response.data.documents?.length || 0 } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

async function testQuery() {
    try {
        const body = {
            structuredQuery: {
                from: [{ collectionId: 'users' }],
                limit: { value: 1 }
            }
        };
        const response = await makeRequest('POST', `:runQuery?key=${API_KEY}`, body);
        if (response.status === 200) {
            return { success: true, details: { count: response.data.length || 0 } };
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
            fields: {
                user_key: { stringValue: testDocId },
                username: { stringValue: 'Test User' },
                phone: { stringValue: '+201000000000' },
                created_at: { stringValue: new Date().toISOString() }
            }
        };
        
        const response = await makeRequest('POST', `/users?documentId=${testDocId}&key=${API_KEY}`, body);
        
        // Clean up
        await makeRequest('DELETE', `/users/${testDocId}?key=${API_KEY}`);
        
        if (response.status === 200 || response.status === 201) {
            return { success: true, details: { docId: testDocId } };
        }
        return { success: false, error: `Status ${response.status}`, details: response.data };
    } catch (error) {
        return { success: false, error: error.message, details: null };
    }
}

// ============================================================================
// PATCH Tests
// ============================================================================

async function testPatchDoc() {
    try {
        const testDocId = `test_patch_${Date.now()}`;
        
        // First create
        const createBody = {
            fields: {
                user_key: { stringValue: testDocId },
                username: { stringValue: 'Test User' },
                created_at: { stringValue: new Date().toISOString() }
            }
        };
        const createResponse = await makeRequest('POST', `/users?documentId=${testDocId}&key=${API_KEY}`, createBody);
        
        if (createResponse.status !== 200 && createResponse.status !== 201) {
            return { success: false, error: `Failed to create test doc: ${createResponse.status}`, details: createResponse.data };
        }
        
        // Then patch
        const patchBody = {
            fields: {
                username: { stringValue: 'Updated User' }
            }
        };
        const patchResponse = await makeRequest('PATCH', `/users/${testDocId}?key=${API_KEY}`, patchBody);
        
        // Clean up
        await makeRequest('DELETE', `/users/${testDocId}?key=${API_KEY}`);
        
        if (patchResponse.status === 200) {
            return { success: true, details: { docId: testDocId } };
        }
        return { success: false, error: `Status ${patchResponse.status}`, details: patchResponse.data };
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
            fields: {
                user_key: { stringValue: testDocId },
                username: { stringValue: 'Test User' },
                created_at: { stringValue: new Date().toISOString() }
            }
        };
        const createResponse = await makeRequest('POST', `/users?documentId=${testDocId}&key=${API_KEY}`, createBody);
        
        if (createResponse.status !== 200 && createResponse.status !== 201) {
            return { success: false, error: `Failed to create test doc: ${createResponse.status}`, details: createResponse.data };
        }
        
        // Then delete
        const deleteResponse = await makeRequest('DELETE', `/users/${testDocId}?key=${API_KEY}`);
        
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
    console.log('Firestore REST API E2E Test Suite');
    console.log('========================================');
    console.log(`BASE_URL: ${BASE_URL}`);
    console.log(`API_KEY: ${API_KEY.substring(0, 10)}...`);
    
    // Check if API_KEY is valid
    if (API_KEY === 'AIzaSyBkZ7r6T9Q0W1E2R3T4Y5U6I7O8P9A0S1D2') {
        console.log('[ERROR] API_KEY is a placeholder. Please provide the actual API_KEY.');
        console.log('[INFO] API_KEY should be set in runtime config or environment variable.');
        console.log('[INFO] Skipping all tests...');
        return testResults;
    }
    
    // GET tests
    await runTest('GET /users - List Documents', testGetDoc);
    await runTest('POST :runQuery - Query Documents', testQuery);
    
    // POST tests
    await runTest('POST /users - Create Document', testCreateDoc);
    
    // PATCH tests
    await runTest('PATCH /users/{id} - Update Document', testPatchDoc);
    
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
