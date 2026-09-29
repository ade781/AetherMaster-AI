const {
  Character,
  GameSession,
  StoryNode
} = require('../../models');
const { sequelize } = require('../../config/database');
const combatEngine = require('../../engine/combatEngine');
const logger = require('../../utils/logger');
const { ItemRepository } = require('../../repositories');

class CombatService {
  async combatAction({ sessionId, action, itemId }) {
    if (!sessionId) {
      const err = new Error('sessionId wajib disertakan.');
      err.statusCode = 400;
      throw err;
    }

    const transaction = await sequelize.transaction();
    try {
      const session = await GameSession.findByPk(sessionId, {
        include: [Character],
        transaction
      });
      if (!session || !session.Character) {
        await transaction.rollback();
        const err = new Error('Sesi atau karakter tidak ditemukan.');
        err.statusCode = 404;
        throw err;
      }

      const character = session.Character;
      const currentNode = await StoryNode.findByPk(session.currentSceneId, { transaction });

      const validation = combatEngine.validateCombatEncounter(session, currentNode);
      if (!validation.valid) {
        await transaction.rollback();
        const err = new Error(validation.error || 'Tidak ada encounter pertarungan aktif di adegan saat ini.');
        err.statusCode = 400;
        throw err;
      }

      const combatResult = combatEngine.executeCombatAction({
        session,
        character,
        currentNode,
        action: action || 'ATTACK',
        itemId
      });

      if (!combatResult.success) {
        await transaction.rollback();
        const err = new Error(combatResult.error);
        err.statusCode = combatResult.statusCode || 400;
        throw err;
      }

      session.combatState = combatResult.combatState;
      if (combatResult.isGameOver) {
        session.isGameOver = true;
      }

      if (combatResult.isVictory && currentNode) {
        currentNode.combatEncounter = null;
        await currentNode.save({ transaction });
      }

      await character.save({ transaction });
      await session.save({ transaction });
      await transaction.commit();

      logger.logCombatAction({
        sessionId: session.id,
        round: combatResult.combatState?.round || 1,
        action: action || 'ATTACK',
        enemyName: combatResult.combatState?.enemy?.name,
        damageDealt: combatResult.playerDamageDealt || 0,
        damageReceived: combatResult.enemyDamageDealt || 0,
        playerHp: character.hp,
        enemyHp: combatResult.combatState?.enemy?.hp,
        status: combatResult.isVictory ? 'VICTORY' : (combatResult.isGameOver ? 'DEFEAT' : 'ACTIVE')
      });

      const hydratedInv = await ItemRepository.hydrateInventory(character.inventory);

      return {
        message: combatResult.actionLog,
        data: {
          session,
          character: {
            ...character.toJSON(),
            inventory: hydratedInv
          },
          combatState: combatResult.combatState,
          isGameOver: Boolean(session.isGameOver),
          isVictory: Boolean(combatResult.isVictory),
          isFled: Boolean(combatResult.isFled),
          actionLog: combatResult.actionLog
        }
      };
    } catch (err) {
      await transaction.rollback();
      logger.error('combatAction Error', err);
      throw err;
    }
  }
}

module.exports = new CombatService();
