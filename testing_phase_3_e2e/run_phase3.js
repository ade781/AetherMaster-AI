const http = require('http');

const API_BASE = 'http://127.0.0.1:5000/api/story';

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const { URL } = require('url');
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      timeout: 45000,
      agent: new http.Agent({ keepAlive: false }),
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch(e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runE2E() {
  console.log('============================================');
  console.log('   FASE 3: END-TO-END (E2E) SIMULATION      ');
  console.log('============================================');

  try {
    // 1. Get Campaigns
    console.log('[E2E 1] Fetching Campaigns...');
    const campRes = await makeRequest(`${API_BASE}/campaigns`);
    if (campRes.status !== 200 || !campRes.data.success) throw new Error('Failed to fetch campaigns');
    const campaignId = campRes.data.data[0].id;
    console.log(`✅ Campaigns fetched. Selected: ${campaignId}`);

    // 2. Start Game
    console.log('\n[E2E 2] Starting Game Session...');
    const startRes = await makeRequest(`${API_BASE}/start`, 'POST', {
      campaignId,
      characterData: {
        name: 'E2E Tester',
        characterClass: 'warrior'
      }
    });
    
    if (startRes.status !== 200 || !startRes.data.success) throw new Error('Failed to start game: ' + JSON.stringify(startRes.data));
    const session = startRes.data.data.session;
    const currentNode = startRes.data.data.currentNode;
    console.log(`✅ Game started! Session ID: ${session.id}`);
    console.log(`✅ Initial Scene: ${currentNode.chapterTitle}`);
    
    // 3. Make a choice
    console.log('\n[E2E 3] Submitting Player Action...');
    const choice = currentNode.choices[0]; // pick first choice
    const actionRes = await makeRequest(`${API_BASE}/action`, 'POST', {
      sessionId: session.id,
      choiceId: choice.id
    });
    
    if (actionRes.status !== 200 || !actionRes.data.success) throw new Error('Failed to submit action: ' + JSON.stringify(actionRes.data));
    const nextNode = actionRes.data.data.currentNode;
    console.log(`✅ Action submitted. Next Scene: ${nextNode.chapterTitle}`);

    // 4. Check Story Tree
    console.log('\n[E2E 4] Verifying Story Tree Persistence...');
    const treeRes = await makeRequest(`${API_BASE}/tree/${session.id}`);
    if (treeRes.status !== 200 || !treeRes.data.success) throw new Error('Failed to fetch tree');
    if (treeRes.data.data.length < 2) throw new Error('Story tree should have at least 2 nodes');
    console.log(`✅ Story tree verified. Found ${treeRes.data.data.length} nodes in DB.`);

    console.log('\n✅ FASE 3: E2E TESTING BERHASIL SEMPURNA!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ FASE 3 GAGAL:', err.message);
    process.exit(1);
  }
}

runE2E();
