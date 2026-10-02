import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { storyApi, campaignApi, API_BASE } from '../src/services/api.js';

describe('Frontend API Contract & Endpoint Signatures', () => {
  it('should define all active storyApi methods', () => {
    const requiredMethods = [
      'getCampaigns',
      'getSession',
      'startAdventure',
      'chooseAction',
      'rewindStory',
      'getStoryTree',
      'combatAction',
      'useItem',
      'getSaveSlots',
      'saveToSlot',
      'autoSave',
      'loadFromSlot',
      'importSession',
      'getSessionSummary'
    ];

    for (const method of requiredMethods) {
      assert.equal(typeof storyApi[method], 'function', `Method ${method} harus terdefinisi pada storyApi`);
    }
  });

  it('should define all active campaignApi methods', () => {
    const requiredCampaignMethods = [
      'generateCampaign',
      'saveCustomCampaign',
      'getCustomCampaigns',
      'generateDynamicNpc'
    ];

    for (const method of requiredCampaignMethods) {
      assert.equal(typeof campaignApi[method], 'function', `Method ${method} harus terdefinisi pada campaignApi`);
    }
  });

  it('should have correct default API_BASE', () => {
    assert.equal(typeof API_BASE, 'string');
    assert.equal(API_BASE.includes('/api/story'), true);
  });
});

