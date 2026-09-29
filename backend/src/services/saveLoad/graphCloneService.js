const {
  StoryNode,
  StoryChoice,
  StorySnapshot,
  WorldFact
} = require('../../models');

class GraphCloneService {
  /**
   * Clones story nodes, choices, snapshots, and world facts from source session to target session.
   * Atomically remaps parent-child node relationships and updates targetSession.currentSceneId.
   */
  async cloneStoryGraph({ sourceSessionId, targetSession, sourceCurrentSceneId, transaction }) {
    // 1. Fetch all original nodes with choices and snapshots
    const originalNodes = await StoryNode.findAll({
      where: { sessionId: sourceSessionId },
      order: [['createdAt', 'ASC']],
      include: [
        { model: StoryChoice, as: 'choiceList' },
        { model: StorySnapshot, as: 'snapshot' }
      ],
      transaction
    });

    const idMap = {};
    const nodePairs = [];

    // 2. Clone each node
    for (const node of originalNodes) {
      const clonedNode = await StoryNode.create({
        sessionId: targetSession.id,
        parentNodeId: null,
        branchId: node.branchId || 'main',
        status: node.status || 'ACTIVE',
        chapterTitle: node.chapterTitle,
        location: node.location,
        locationId: node.locationId,
        backgroundId: node.backgroundId,
        speaker: node.speaker,
        speakerId: node.speakerId,
        characterId: node.characterId,
        turnNumber: node.turnNumber,
        mood: node.mood,
        dialogueText: node.dialogueText,
        consequenceNote: node.consequenceNote,
        choices: node.choices,
        combatEncounter: node.combatEncounter,
        characterSnapshot: node.characterSnapshot,
        gameStateSnapshot: node.gameStateSnapshot || node.characterSnapshot
      }, { transaction });

      idMap[node.id] = clonedNode.id;
      nodePairs.push({ clonedNode, originalParentId: node.parentNodeId });

      // Clone choices
      const choices = node.choiceList || node.choices || [];
      if (Array.isArray(choices) && choices.length > 0) {
        const choiceRecords = choices.map((c, idx) => ({
          storyNodeId: clonedNode.id,
          choiceKey: c.choiceKey || c.id || `c_${idx + 1}`,
          text: c.text,
          actionType: c.actionType || 'INVESTIGATE',
          tone: c.tone || 'cautious',
          requiredItemId: c.requiredItemId || null,
          sequence: c.sequence || idx + 1
        }));
        await StoryChoice.bulkCreate(choiceRecords, { transaction });
      }

      // Clone snapshot
      const snap = node.snapshot || node.gameStateSnapshot || node.characterSnapshot;
      if (snap) {
        await StorySnapshot.create({
          storyNodeId: clonedNode.id,
          characterState: snap.characterState || snap,
          inventoryState: snap.inventoryState || snap.inventory || [],
          questState: snap.questState || snap.missionLog || {},
          worldState: snap.worldState || snap.worldLedger || {},
          ledgerState: snap.ledgerState || snap.worldLedger || {}
        }, { transaction });
      }
    }

    // 3. Remap parentNodeIds
    for (const { clonedNode, originalParentId } of nodePairs) {
      if (originalParentId && idMap[originalParentId]) {
        clonedNode.parentNodeId = idMap[originalParentId];
        await clonedNode.save({ transaction });
      }
    }

    // 4. Clone WorldFacts
    const originalFacts = await WorldFact.findAll({
      where: { sessionId: sourceSessionId },
      transaction
    });

    if (originalFacts.length > 0) {
      const factRecords = originalFacts.map(f => ({
        sessionId: targetSession.id,
        campaignId: f.campaignId,
        subjectType: f.subjectType,
        subjectId: f.subjectId,
        factType: f.factType,
        fact: f.fact,
        importance: f.importance,
        turn: f.turn,
        branchId: f.branchId || 'main',
        sourceNodeId: f.sourceNodeId ? (idMap[f.sourceNodeId] || null) : null,
        metadata: f.metadata || {}
      }));
      await WorldFact.bulkCreate(factRecords, { transaction });
    }

    // 5. Update currentSceneId in targetSession
    const targetSceneId = sourceCurrentSceneId || targetSession.currentSceneId;
    if (targetSceneId && idMap[targetSceneId]) {
      targetSession.currentSceneId = idMap[targetSceneId];
      await targetSession.save({ transaction });
    }

    return { idMap, originalNodes };
  }
}

module.exports = new GraphCloneService();
