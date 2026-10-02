const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const campaignBuilderController = require('../src/controllers/campaignBuilderController');
const { sequelize, CustomCampaign } = require('../src/models');

describe('Campaign Builder Controller & Endpoints (Phase 5)', () => {
  before(async () => {
    await sequelize.authenticate();
    await CustomCampaign.sync();
    await CustomCampaign.destroy({ where: { id: 'camp_custom_test_99a' } }).catch(() => {});
  });

  // Mock response helper
  function createMockRes() {
    return {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
  }

  it('POST /api/campaigns/generate returns 200 and structured generatedCampaign', async () => {
    const req = {
      body: {
        theme: 'Gothic Dungeon',
        difficulty: 'normal',
        premise: 'Eksplorasi kastil terbengkalai penuh teka-teki kuno.',
        lengthTier: 'medium'
      }
    };
    const res = createMockRes();

    await campaignBuilderController.generateCampaign(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.generatedCampaign);
    const camp = res.body.data.generatedCampaign;
    assert.strictEqual(camp.theme, 'Gothic Dungeon');
    assert.strictEqual(camp.difficulty, 'normal');
    assert.strictEqual(camp.nodesCount, 7);
    assert.ok(camp.nodes.length === 7);
    assert.ok(camp.nodes[0].choices.length >= 2);
  });

  it('POST /api/campaigns/custom/save returns 201 and persists custom campaign', async () => {
    const req = {
      body: {
        campaignData: {
          id: 'camp_custom_test_99a',
          title: 'Kastil Uji Coba Kuno',
          premise: 'Eksplorasi kastil terbengkalai penuh teka-teki kuno.',
          theme: 'Gothic Dungeon',
          difficulty: 'normal',
          nodes: [
            {
              nodeId: 'node_start',
              title: 'Gerbang Utama',
              narrative: 'Pintu kayu lapuk berdiri di hadapan Anda...',
              choices: [{ id: 'c1', label: 'Buka pintu', actionType: 'explore' }]
            }
          ],
          presetEnemies: [
            { name: 'Penjaga Bayangan', hp: 20, ac: 12, attackBonus: 3, damage: '1d6+1' }
          ]
        }
      }
    };
    const res = createMockRes();

    await campaignBuilderController.saveCustomCampaign(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.campaignId, 'camp_custom_test_99a');
    assert.ok(res.body.data.savedAt);

    // Verify persistence in SQLite
    const savedInDb = await CustomCampaign.findByPk('camp_custom_test_99a');
    assert.ok(savedInDb);
    assert.strictEqual(savedInDb.title, 'Kastil Uji Coba Kuno');
  });

  it('GET /api/campaigns/custom returns list of saved custom campaigns', async () => {
    const req = {};
    const res = createMockRes();

    await campaignBuilderController.getCustomCampaigns(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.campaigns));
    assert.ok(res.body.data.campaigns.length >= 1);
    const found = res.body.data.campaigns.find(c => c.id === 'camp_custom_test_99a');
    assert.ok(found);
    assert.strictEqual(found.title, 'Kastil Uji Coba Kuno');
  });

  it('POST /api/campaigns/npcs/generate returns 200 and dynamic NPC matching contract', async () => {
    const req = {
      body: {
        role: 'merchant',
        alignment: 'neutral',
        context: 'Di ruang bawah tanah tersembunyi'
      }
    };
    const res = createMockRes();

    await campaignBuilderController.generateNPC(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.npc);
    assert.strictEqual(res.body.data.npc.role, 'merchant');
    assert.ok(res.body.data.npc.greeting.length > 0);
    assert.ok(Array.isArray(res.body.data.npc.inventory));
  });
});
