const http = require('http');

const API_BASE = 'http://localhost:3000/api';

async function request(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, data }); }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function poll(submissionId, token, label = '') {
    for (let i = 1; i <= 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const res = await request(`/submissions/${submissionId}`, 'GET', null, token);
        const status = res.data?.status || 'unknown';
        console.log(`   Attempt ${i}: Status = ${status}`);
        if (status !== 'pending') {
            console.log(`\n   ✅ ${label} Final status: ${status}`);
            return status;
        }
    }
    return 'timeout';
}

async function runE2ETest() {
    // ───────────────────────────────────────────
    // 1. Login
    // ───────────────────────────────────────────
    console.log('1. Logging in...');
    let loginRes = await request('/auth/login', 'POST', {
        email: 'gateway@coderly.dev', password: 'securepassword123'
    });

    if (loginRes.status === 401) {
        console.log('   User not found, registering...');
        await request('/auth/register', 'POST', {
            username: 'gatewayuser', email: 'gateway@coderly.dev', password: 'securepassword123'
        });
        loginRes = await request('/auth/login', 'POST', {
            email: 'gateway@coderly.dev', password: 'securepassword123'
        });
    }

    if (![200, 201].includes(loginRes.status) || !loginRes.data.accessToken) {
        console.error('Login failed:', loginRes.data); return;
    }

    const token = loginRes.data.accessToken;
    console.log('✅ Logged in successfully');

    // ───────────────────────────────────────────
    // 2. Create a problem
    // ───────────────────────────────────────────
    console.log('\n2. Creating a test problem...');
    const problemRes = await request('/problems', 'POST', {
        title: 'Two Sum E2E Test',
        slug: 'two-sum-e2e-' + Date.now(),
        description: 'A test problem',
        difficulty: 'Easy',
        category: 'Algorithms',
        templates: [{ language: 'javascript', code: 'function twoSum(nums, target) {\n\n}' }],
        test_cases: [
            { input: '[2,7,11,15]\n9', expected: '[0,1]' },
            { input: '[3,2,4]\n6', expected: '[1,2]' }
        ],
        constraints: ['2 <= nums.length <= 10^4']
    }, token);

    if (![200, 201].includes(problemRes.status)) {
        console.error('Failed to create problem:', problemRes.data); return;
    }

    const problemId = problemRes.data.id;
    console.log(`✅ Problem created: ${problemId}`);

    // The JS code we'll use for both tests
    const code = `
function calculateTwoSum() {
    const nums = [2, 7, 11, 15]; const target = 9;
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) { console.log(JSON.stringify([map.get(diff), i])); return; }
        map.set(nums[i], i);
    }
}
calculateTwoSum();
`;

    // ───────────────────────────────────────────
    // 3. Test Run (no DB record)
    // ───────────────────────────────────────────
    console.log('\n3. Submitting a TEST RUN (no DB record)...');
    const runRes = await request('/submissions/run', 'POST', {
        problemId, language: 'javascript', codeBody: code
    }, token);

    if (![200, 201].includes(runRes.status)) {
        console.error('Test run failed:', runRes.data); return;
    }

    const testRunId = runRes.data.submission.id;
    console.log(`✅ Test run queued: ${testRunId} (starts with "test-": ${testRunId.startsWith('test-')})`);

    console.log('\n4. Polling test run execution (via Store, not DB)...');
    await poll(testRunId, token, 'Test Run');

    // ───────────────────────────────────────────
    // 5. Real Submission (saved to DB)
    // ───────────────────────────────────────────
    console.log('\n5. Submitting a REAL SUBMISSION (DB record)...');
    const submitRes = await request('/submissions', 'POST', {
        problemId, language: 'javascript', codeBody: code
    }, token);

    if (![200, 201].includes(submitRes.status)) {
        console.error('Submission failed:', submitRes.data); return;
    }

    const submissionId = submitRes.data.submission.id;
    console.log(`✅ Submission created and queued: ${submissionId}`);

    console.log('\n6. Polling real submission result...');
    await poll(submissionId, token, 'Real Submission');

    // ───────────────────────────────────────────
    // 7. Verify rate limiting (10/day)
    // ───────────────────────────────────────────
    console.log('\n7. Verifying rate limiting on /run (should block after 10 requests)...');
    let throttled = false;
    for (let i = 1; i <= 12; i++) {
        const res = await request('/submissions/run', 'POST', {
            problemId, language: 'javascript', codeBody: code
        }, token);
        if (res.status === 429) {
            console.log(`   ✅ Throttled at request #${i} with 429 Too Many Requests`);
            throttled = true;
            break;
        }
        console.log(`   Request #${i}: ${res.status}`);
    }
    if (!throttled) console.log('   ❌ Rate limiter did not kick in within 12 requests!');

    console.log('\n🎉 All E2E tests complete!');
}

runE2ETest().catch(console.error);
