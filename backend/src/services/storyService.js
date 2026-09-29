/**
 * StoryService
 * Orchestration facade coordinating campaign start, narrative action processing,
 * combat turns, item usage, timeline rewinds, and story queries.
 */

const storyStartService = require('./story/storyStartService');
const storyActionService = require('./story/storyActionService');
const storyItemService = require('./story/storyItemService');
const rewindService = require('./story/rewindService');
const storyQueryService = require('./story/storyQueryService');
const combatService = require('./combat/combatService');

class StoryService {
  async getCampaigns() {
    return await storyStartService.getCampaigns();
  }

  async startCampaign(payload) {
    return await storyStartService.startCampaign(payload);
  }

  async submitAction(payload) {
    return await storyActionService.submitAction(payload);
  }

  async combatAction(payload) {
    return await combatService.combatAction(payload);
  }

  async useItem(payload) {
    return await storyItemService.useItem(payload);
  }

  async rewindToNode(payload) {
    return await rewindService.rewindToNode(payload);
  }

  async getStoryTree(sessionId) {
    return await storyQueryService.getStoryTree(sessionId);
  }

  async getBacklog(sessionId) {
    return await storyQueryService.getBacklog(sessionId);
  }

  async getSession(sessionId) {
    return await storyQueryService.getSession(sessionId);
  }

  async getSessionSummary(sessionId) {
    return await storyQueryService.getSessionSummary(sessionId);
  }
}

module.exports = new StoryService();
