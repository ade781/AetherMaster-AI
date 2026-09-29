const { StoryNode } = require('../../models');
const logger = require('../../utils/logger');

function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return Object.values(parsed);
    } catch (e) {}
  }
  if (val && typeof val === 'object') return Object.values(val);
  return [];
}

function resolveChoice(currentNode, choiceId, customText, tone) {
  const choiceList = safeArray(currentNode?.choices);
  const matched = choiceList.find(c => c && (c.id === choiceId || c.choiceKey === choiceId || c.text === choiceId));
  if (matched) return matched;

  const text = customText || (typeof choiceId === 'string' && choiceId !== 'custom' ? choiceId : 'Melangkah maju dengan waspada');

  return {
    id: choiceId || 'custom',
    choiceKey: choiceId || 'custom',
    text,
    tone: tone || 'kreatif'
  };
}

async function getRecentStoryHistory(sessionId, currentSceneId, limit = 4) {
  try {
    const nodes = await StoryNode.findAll({
      where: { sessionId, status: 'ACTIVE' },
      attributes: ['id', 'parentNodeId', 'chapterTitle', 'location', 'speaker', 'characterId', 'mood', 'dialogueText', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const chain = [];
    let curr = nodeMap.get(currentSceneId);
    while (curr && chain.length < limit) {
      chain.unshift(curr);
      curr = curr.parentNodeId ? nodeMap.get(curr.parentNodeId) : null;
    }
    return chain;
  } catch (err) {
    logger.warn('Error building story history chain', { error: err.message });
    return [];
  }
}

/**
 * Single-pass deterministic background resolution.
 * Campaign -> Location -> StoryNode -> Scene
 */
function resolveBackground(candidateBg, currentBg, campaignBg) {
  if (candidateBg && candidateBg !== 'bg_01_tavern') {
    return candidateBg;
  }
  return currentBg || campaignBg || 'bg_01_tavern';
}

module.exports = {
  safeArray,
  resolveChoice,
  getRecentStoryHistory,
  resolveBackground
};
