/**
 * SaveLoadService
 * Facade coordinating slot persistence, graph cloning, and save file management.
 */

const slotService = require('./saveLoad/slotService');
const saveFileService = require('./saveLoad/saveFileService');

class SaveLoadService {
  /**
   * Retrieves canonical representations of save slots 0-3.
   */
  async getSaveSlots() {
    return await slotService.getSaveSlots();
  }

  /**
   * Saves current game session into a specific slot.
   */
  async saveToSlot(payload) {
    return await slotService.saveToSlot(payload);
  }

  /**
   * Automatically saves current game session into Slot 0.
   */
  async autoSave(sessionId) {
    return await slotService.autoSave(sessionId);
  }

  /**
   * Loads state from save slot into an active game session.
   */
  async loadFromSlot(slotNumber) {
    return await slotService.loadFromSlot(slotNumber);
  }

  /**
   * Exports full session state and history tree as JSON.
   */
  async exportSessionJson(sessionId) {
    return await saveFileService.exportSessionJson(sessionId);
  }

  /**
   * Imports session state and history tree from JSON.
   */
  async importSessionJson(sessionData) {
    return await saveFileService.importSessionJson(sessionData);
  }
}

module.exports = new SaveLoadService();
