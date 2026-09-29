const {
  Character,
  Campaign,
  GameSession,
  StoryNode,
  StoryChoice
} = require('../../models');
const {
  ItemRepository,
  StoryNodeRepository
} = require('../../repositories');
const { safeArray } = require('./storyCommon');

class StoryQueryService {
  async getStoryTree(sessionId) {
    return await StoryNodeRepository.findStoryTree(sessionId);
  }

  async getBacklog(sessionId) {
    const session = await GameSession.findByPk(sessionId);
    if (!session) {
      const err = new Error('Sesi tidak ditemukan.');
      err.statusCode = 404;
      throw err;
    }

    const nodes = await StoryNode.findAll({
      where: { sessionId },
      include: [{ model: StoryChoice, as: 'choiceList' }]
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const chain = [];
    let curr = nodeMap.get(session.currentSceneId);
    while (curr) {
      chain.unshift(curr);
      curr = curr.parentNodeId ? nodeMap.get(curr.parentNodeId) : null;
    }

    return chain;
  }

  async getSession(sessionId) {
    if (!sessionId) {
      const err = new Error('sessionId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) {
      const err = new Error('Sesi permainan tidak ditemukan.');
      err.statusCode = 404;
      throw err;
    }

    const character = session.Character;
    const currentNode = await StoryNode.findByPk(session.currentSceneId, {
      include: [{ model: StoryChoice, as: 'choiceList' }]
    });

    if (!currentNode) {
      const err = new Error('Node cerita aktif tidak ditemukan.');
      err.statusCode = 404;
      throw err;
    }

    const hydratedInv = character?.inventory
      ? await ItemRepository.hydrateInventory(character.inventory)
      : [];

    let choices = safeArray(currentNode.choices);
    if ((!choices || choices.length === 0) && currentNode.choiceList?.length > 0) {
      choices = currentNode.choiceList.map(c => ({
        id: c.choiceKey,
        choiceKey: c.choiceKey,
        text: c.text,
        actionType: c.actionType,
        tone: c.tone
      }));
    }

    return {
      session,
      character: {
        ...character.toJSON(),
        inventory: hydratedInv
      },
      currentNode: {
        ...currentNode.toJSON(),
        choices
      },
      campaign: session.Campaign,
      combatState: session.combatState || null
    };
  }

  async getSessionSummary(sessionId) {
    if (!sessionId) {
      const err = new Error('sessionId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const session = await GameSession.findByPk(sessionId, {
      include: [Character, Campaign]
    });
    if (!session) {
      const err = new Error('Sesi permainan tidak ditemukan.');
      err.statusCode = 404;
      throw err;
    }

    const nodes = await StoryNode.findAll({
      where: { sessionId, status: 'ACTIVE' },
      order: [['turnNumber', 'ASC']]
    });

    const timeline = nodes.map(n => ({
      stage: n.turnNumber,
      title: n.chapterTitle || `Babak ${n.turnNumber}`,
      location: n.location || 'Aetheria',
      consequence: n.consequenceNote || n.dialogueText?.slice(0, 100) || 'Perjalanan berlanjut.'
    }));

    return {
      totalStages: session.turnCount || nodes.length || 1,
      finalHp: session.Character?.hp ?? 0,
      maxHp: session.Character?.maxHp ?? 30,
      finalGold: session.Character?.gold ?? 0,
      timeline
    };
  }
}

module.exports = new StoryQueryService();
