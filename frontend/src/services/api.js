/**
 * AetherMaster API Service
 * Centralized API client for all backend endpoints.
 */

import * as campaignMockApi from './campaignMockApi.js';

export const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) || '/api/story';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Koneksi ke backend gagal.'
      }
    };
  }
}

export const storyApi = {
  // Campaign & Session
  async getCampaigns() {
    return request('/campaigns');
  },

  async getSession(sessionId) {
    return request(`/session/${sessionId}`);
  },

  async startAdventure(campaignId, characterData) {
    return request('/start', {
      method: 'POST',
      body: JSON.stringify({ campaignId, characterData })
    });
  },

  // Narrative
  async chooseAction(sessionId, { choiceId, customText, tone }) {
    return request('/action', {
      method: 'POST',
      body: JSON.stringify({ sessionId, choiceId, customText, tone })
    });
  },

  async rewindStory(sessionId, targetNodeId) {
    return request('/rewind', {
      method: 'POST',
      body: JSON.stringify({ sessionId, targetNodeId })
    });
  },

  async getStoryTree(sessionId) {
    return request(`/tree/${sessionId}`);
  },

  // Combat
  async combatAction(sessionId, action, itemId = null) {
    return request('/combat/action', {
      method: 'POST',
      body: JSON.stringify({ sessionId, action, itemId })
    });
  },

  // Inventory
  async useItem(sessionId, itemId) {
    return request('/use-item', {
      method: 'POST',
      body: JSON.stringify({ sessionId, itemId })
    });
  },

  // Save / Load
  async getSaveSlots() {
    return request('/saves');
  },

  async saveToSlot(sessionId, slotNumber) {
    return request('/saves/save', {
      method: 'POST',
      body: JSON.stringify({ sessionId, slotNumber })
    });
  },

  async autoSave(sessionId) {
    return request('/saves/autosave', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
  },

  async loadFromSlot(slotNumber) {
    return request(`/saves/load/${slotNumber}`);
  },

  async importSession(sessionData) {
    return request('/saves/import', {
      method: 'POST',
      body: JSON.stringify({ sessionData })
    });
  },

  // Summary
  async getSessionSummary(sessionId) {
    return request(`/summary/${sessionId}`);
  }
};

export const campaignApi = {
  generateCampaign: async (payload) => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      // Fallback ke mock payload lokal jika backend belum online
      return campaignMockApi.mockGenerateCampaign(payload);
    }
  },

  saveCustomCampaign: async (campaignData) => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      return campaignMockApi.mockSaveCustomCampaign(campaignData);
    }
  },

  getCustomCampaigns: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/custom`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      return campaignMockApi.mockGetCustomCampaigns();
    }
  },

  generateDynamicNpc: async (criteria) => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/npc/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      return campaignMockApi.mockGenerateDynamicNpc(criteria);
    }
  }
};

export default storyApi;


