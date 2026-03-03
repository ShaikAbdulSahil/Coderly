const http = require('http');
const API_BASE = 'http://localhost:3000/api';

async function request(path, method, body, token, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname, port: url.port, path: url.pathname, method,
            headers: { 'Content-Type': 'application/json', ...extraHeaders },
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers }); }
                catch (e) { resolve({ status: res.statusCode, data, headers: res.headers }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

const pass = (msg) => console.log('[PASS]', msg);
const fail = (msg) => console.log('[FAIL]', msg);
const info = (msg) => console.log('[INFO]', msg);

async function verify() {
    info('Logging in...');
    let loginRes = await request('/auth/login', 'POST', { email: 'gateway@coderly.dev', password: 'securepassword123' });
    if (loginRes.status === 401) {
        await request('/auth/register', 'POST', { username: 'gatewayuser', email: 'gateway@coderly.dev', password: 'securepassword123' });
        loginRes = await request('/auth/login', 'POST', { email: 'gateway@coderly.dev', password: 'securepassword123' });
    }
    const token = loginRes.data.accessToken;
    info('Logged in OK');

    // Test 1: Problem list Cache-Control
    console.log('\n--- Test 1: GET /problems Cache-Control ---');
    const listRes = await request('/problems', 'GET', null, token);
    const cc = listRes.headers['cache-control'];
    info(`Status=${listRes.status} Cache-Control=${cc}`);
    cc?.includes('max-age=90') ? pass('Cache-Control public, max-age=90') : fail('Missing/wrong Cache-Control header');

    let problems = listRes.data?.problems || [];
    if (problems.length === 0) {
        await request('/problems', 'POST', {
            title: 'ETag Test', slug: 'etag-test-' + Date.now(), description: 'test',
            difficulty: 'Easy', category: 'Algorithms', templates: [], test_cases: [], constraints: [],
        }, token);
        const list2 = await request('/problems', 'GET', null, token);
        problems = list2.data?.problems || [];
    }
    const { id: problemId, slug } = problems[0];
    info(`Using problem id=${problemId} slug=${slug}`);

    // Test 2: GET by ID - first request 200 + ETag
    console.log('\n--- Test 2: GET /problems/:id returns ETag ---');
    const r1 = await request(`/problems/${problemId}`, 'GET', null, token);
    const etag = r1.headers['etag'];
    const cacheCtl = r1.headers['cache-control'];
    info(`Status=${r1.status} ETag=${etag} Cache-Control=${cacheCtl}`);
    r1.status === 200 && etag ? pass('200 + ETag present') : fail('Expected 200 with ETag');

    // Test 3: GET by ID with If-None-Match - should 304
    console.log('\n--- Test 3: GET /problems/:id with If-None-Match returns 304 ---');
    const r2 = await request(`/problems/${problemId}`, 'GET', null, token, { 'If-None-Match': etag });
    info(`Status=${r2.status}`);
    r2.status === 304 ? pass('304 Not Modified') : fail(`Expected 304, got ${r2.status}`);

    // Test 4: GET by slug
    console.log('\n--- Test 4: GET /problems/by-slug/:slug ---');
    if (slug) {
        const slugRes = await request(`/problems/by-slug/${slug}`, 'GET', null, token);
        const slugEtag = slugRes.headers['etag'];
        info(`Status=${slugRes.status} ETag=${slugEtag} ID=${slugRes.data?.id}`);
        slugRes.status === 200 && slugEtag && slugRes.data?.id === problemId
            ? pass('Slug lookup 200 + ETag + correct ID')
            : fail('Slug lookup failed');

        // Test 5: 304 on slug
        console.log('\n--- Test 5: GET /problems/by-slug/:slug with If-None-Match returns 304 ---');
        const slugRes2 = await request(`/problems/by-slug/${slug}`, 'GET', null, token, { 'If-None-Match': slugEtag });
        info(`Status=${slugRes2.status}`);
        slugRes2.status === 304 ? pass('304 Not Modified for slug') : fail(`Expected 304, got ${slugRes2.status}`);
    } else {
        fail('No slug on problem, skipping slug tests');
    }

    // Test 6: Real submission -> Redis Pub/Sub published
    console.log('\n--- Test 6: Real submission -> Pub/Sub result published ---');
    const code = 'console.log(JSON.stringify([0,1]));';
    const subRes = await request('/submissions', 'POST', { problemId, language: 'javascript', codeBody: code }, token);
    const subId = subRes.data?.submission?.id;
    info(`Submission ID=${subId}`);
    let finalStatus = 'pending';
    for (let i = 1; i <= 10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const s = await request(`/submissions/${subId}`, 'GET', null, token);
        finalStatus = s.data?.status;
        info(`Attempt ${i}: ${finalStatus}`);
        if (finalStatus !== 'pending') break;
    }
    finalStatus === 'accepted' ? pass('Submission accepted') : fail(`Unexpected status: ${finalStatus}`);
    info('Check `docker logs coderly-submission --tail 10` for: Published result to coderly:result:...');

    console.log('\n=== All verification tests done ===');
}

verify().catch(console.error);
