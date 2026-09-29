const {
  Character,
  Campaign,
  GameSession,
  StoryNode,
  StorySnapshot
} = require('../../models');
const { sequelize } = require('../../config/database');
const gameStateEngine = require('../../engine/gameStateEngine');
const logger = require('../../utils/logger');
const {
  ItemRepository,
  WorldFactRepository
} = require('../../repositories');

class StoryItemService {
  async useItem({ sessionId, itemId }) {
    if (!sessionId || !itemId) {
      const err = new Error('sessionId dan itemId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const transaction = await sequelize.transaction();
    try {
      const session = await GameSession.findByPk(sessionId, {
        include: [Character, Campaign],
        transaction
      });
      if (!session || !session.Character) {
        await transaction.rollback();
        const err = new Error('Sesi atau karakter tidak ditemukan.');
        err.statusCode = 404;
        throw err;
      }

      const currentNode = await StoryNode.findByPk(session.currentSceneId, { transaction });
      const character = session.Character;

      const actionResult = gameStateEngine.resolveAction(
        session,
        character,
        currentNode,
        { actionType: 'USE_ITEM', itemId }
      );

      if (!actionResult.validatedUpdates.removedItems || actionResult.validatedUpdates.removedItems.length === 0) {
        await transaction.rollback();
        const err = new Error(`Item "${itemId}" tidak dapat digunakan atau tidak ditemukan di inventaris.`);
        err.statusCode = 400;
        throw err;
      }

      await character.save({ transaction });
      await session.save({ transaction });

      const consumedItem = actionResult.validatedUpdates.removedItems[0];
      await WorldFactRepository.addFact({
        sessionId: session.id,
        campaignId: session.campaignId,
        subjectType: 'ITEM',
        subjectId: consumedItem.id,
        factType: 'USE_ITEM',
        fact: `Menggunakan ${consumedItem.name || itemId}.`,
        turn: session.turnCount,
        branchId: session.activeBranchId || 'main',
        sourceNodeId: currentNode?.id || null
      }, transaction);

      if (currentNode?.id) {
        const snapData = gameStateEngine.createSnapshot(character, session, currentNode);
        await StorySnapshot.upsert({
          storyNodeId: currentNode.id,
          characterState: snapData.characterState,
          inventoryState: snapData.inventoryState,
          questState: snapData.questState,
          worldState: snapData.worldState,
          ledgerState: snapData.ledgerState
        }, { transaction });
      }

      await transaction.commit();

      const hydratedInv = await ItemRepository.hydrateInventory(character.inventory);

      return {
        message: `Berhasil menggunakan ${consumedItem.name || 'item'}.`,
        data: {
          character: {
            ...character.toJSON(),
            inventory: hydratedInv
          },
          session
        }
      };
    } catch (err) {
      await transaction.rollback();
      logger.error('useItem Error', err);
      throw err;
    }
  }
}

module.exports = new StoryItemService();
