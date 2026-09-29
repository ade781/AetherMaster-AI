/**
 * AetherMaster API Service
 * Centralized API client for all backend endpoints.
 */

export const API_BASE = import.meta.env.VITE_API_BASE || '/api/story';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  return data;
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

export default storyApi;
