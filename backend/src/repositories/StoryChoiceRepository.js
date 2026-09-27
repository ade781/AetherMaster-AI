const { StoryChoice } = require('../models');

class StoryChoiceRepository {
  /**
   * Bulk creates choices associated with a specific StoryNode.
   *
   * @param {string} storyNodeId
   * @param {Array<object>} choices
   * @param {object} transaction
   * @returns {Promise<Array<object>>}
   */
  static async createChoices(storyNodeId, choices = [], transaction = null) {
    if (!storyNodeId || !Array.isArray(choices) || choices.length === 0) return [];
    const opts = transaction ? { transaction } : {};

    const records = choices.map((c, idx) => ({
      storyNodeId,
      choiceKey: c.id || c.choiceKey || `choice_${idx + 1}`,
      text: c.text || '',
      actionType: c.actionType || c.type || 'INVESTIGATE',
      tone: c.tone || 'cautious',
      requiredItemId: c.requiredItemId || null,
      sequence: c.sequence || idx + 1
    }));

    const created = await StoryChoice.bulkCreate(records, opts);
    return created.map(c => c.toJSON());
  }

  /**
   * Finds all choices for a given StoryNode ordered by sequence.
   *
   * @param {string} storyNodeId
   * @returns {Promise<Array<object>>}
   */
  static async findByNodeId(storyNodeId) {
    if (!storyNodeId) return [];
    try {
      const choices = await StoryChoice.findAll({
        where: { storyNodeId },
        order: [['sequence', 'ASC']]
      });
      return choices.map(c => ({
        id: c.choiceKey,
        choiceKey: c.choiceKey,
        text: c.text,
        actionType: c.actionType,
        tone: c.tone,
        requiredItemId: c.requiredItemId,
        sequence: c.sequence
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Deletes all choices for a given StoryNode.
   *
   * @param {string} storyNodeId
   * @param {object} transaction
   * @returns {Promise<number>}
   */
  static async deleteByNodeId(storyNodeId, transaction = null) {
    if (!storyNodeId) return 0;
    const opts = transaction ? { transaction } : {};
    return await StoryChoice.destroy({
      where: { storyNodeId },
      ...opts
    });
  }
}

module.exports = StoryChoiceRepository;
