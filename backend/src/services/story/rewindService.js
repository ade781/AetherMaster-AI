const {
  Character,
  GameSession,
  StoryNode,
  StoryChoice,
  StorySnapshot
} = require('../../models');
const { sequelize } = require('../../config/database');
const gameStateEngine = require('../../engine/gameStateEngine');
const logger = require('../../utils/logger');
const { ItemRepository } = require('../../repositories');

class RewindService {
  async rewindToNode({ sessionId, targetNodeId }) {
    if (!sessionId || !targetNodeId) {
      const err = new Error('sessionId dan targetNodeId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const transaction = await sequelize.transaction();
    try {
      const session = await GameSession.findByPk(sessionId, {
        include: [Character],
        transaction
      });
      if (!session) {
        await transaction.rollback();
        const err = new Error('Sesi tidak ditemukan.');
        err.statusCode = 404;
        throw err;
      }

      const targetNode = await StoryNode.findOne({
        where: { id: targetNodeId, sessionId },
        include: [
          { model: StoryChoice, as: 'choiceList' },
          { model: StorySnapshot, as: 'snapshot' }
        ],
        transaction
      });
      if (!targetNode) {
        await transaction.rollback();
        const err = new Error('Node target tidak valid untuk sesi ini.');
        err.statusCode = 404;
        throw err;
      }

      await gameStateEngine.restoreSnapshot(targetNode, session, session.Character, transaction);

      await session.Character.save({ transaction });
      await session.save({ transaction });
      await transaction.commit();

      const hydratedInv = await ItemRepository.hydrateInventory(session.Character.inventory);

      logger.info('Session rewound successfully', {
        sessionId,
        targetNodeId,
        turnCount: session.turnCount,
        restoredHp: session.Character?.hp,
        activeBranchId: session.activeBranchId
      });

      return {
        session,
        character: {
          ...session.Character.toJSON(),
          inventory: hydratedInv
        },
        currentNode: targetNode
      };
    } catch (err) {
      await transaction.rollback();
      logger.error('rewindToNode Error', err);
      throw err;
    }
  }
}

module.exports = new RewindService();
