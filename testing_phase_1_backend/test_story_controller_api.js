const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Invalid JSON response from ${path}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 5000,
      path
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Invalid JSON response from ${path}: ${body}`));
        }
      });
    }).on('error', reject);
  });
}

async function runStoryApiTests() {
  console.log('=== [PHASE 1.3] Testing Story Controller REST API Endpoints ===');

  // Test 1: GET /api/story/campaigns
  const campRes = await getJson('/api/story/campaigns');
  if (!campRes.success || !Array.isArray(campRes.data) || campRes.data.length === 0) {
    throw new Error('GET /api/story/campaigns failed');
  }
  console.log(`✓ GET /api/story/campaigns: Retreived ${campRes.data.length} active campaigns (OK)`);
  const campaign = campRes.data[0];

  // Test 2: POST /api/story/start
  const startRes = await postJson('/api/story/start', {
    campaignId: campaign.id,
    characterData: {
      name: 'Tester Hero',
      race: 'human',
      characterClass: 'warrior'
    }
  });
  if (!startRes.success || !startRes.data.session || !startRes.data.currentNode) {
    throw new Error('POST /api/story/start failed: ' + JSON.stringify(startRes));
  }
  const session = startRes.data.session;
  const rootNode = startRes.data.currentNode;
  console.log(`✓ POST /api/story/start: Started session ${session.id} at node "${rootNode.chapterTitle}" (OK)`);

  // Test 3: POST /api/story/action
  const actionRes = await postJson('/api/story/action', {
    sessionId: session.id,
    choiceId: rootNode.choices?.[0]?.id || 'c1',
    statType: 'STR',
    dc: 10
  });
  if (!actionRes.success || !actionRes.data.currentNode || !actionRes.data.checkResult) {
    throw new Error('POST /api/story/action failed: ' + JSON.stringify(actionRes));
  }
  const nextNode = actionRes.data.currentNode;
  const checkResult = actionRes.data.checkResult;
  console.log(`✓ POST /api/story/action: Performed D20 roll (${checkResult.roll} + ${checkResult.modifier} = ${checkResult.total}) -> Next Node "${nextNode.chapterTitle}" (OK)`);

  // Test 4: GET /api/story/tree/:sessionId
  const treeRes = await getJson(`/api/story/tree/${session.id}`);
  if (!treeRes.success || !Array.isArray(treeRes.data) || treeRes.data.length < 2) {
    throw new Error('GET /api/story/tree failed');
  }
  console.log(`✓ GET /api/story/tree/:sessionId: Branching tree has ${treeRes.data.length} nodes (OK)`);

  // Test 5: GET /api/story/backlog/:sessionId
  const backlogRes = await getJson(`/api/story/backlog/${session.id}`);
  if (!backlogRes.success || !Array.isArray(backlogRes.data) || backlogRes.data.length < 2) {
    throw new Error('GET /api/story/backlog failed');
  }
  console.log(`✓ GET /api/story/backlog/:sessionId: Backlog transcript returned ${backlogRes.data.length} entries (OK)`);

  // Test 6: POST /api/story/rewind
  const rewindRes = await postJson('/api/story/rewind', {
    sessionId: session.id,
    targetNodeId: rootNode.id
  });
  if (!rewindRes.success || rewindRes.data.session.currentSceneId !== rootNode.id) {
    throw new Error('POST /api/story/rewind failed: ' + JSON.stringify(rewindRes));
  }
  console.log(`✓ POST /api/story/rewind: Rewound session currentSceneId back to root node ${rootNode.id} (OK)`);

  console.log('✓ [PHASE 1.3 PASSED] All Story Controller REST API tests succeeded!\n');
}

module.exports = { runStoryApiTests, getJson, postJson };
