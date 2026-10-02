/**
 * Game Engine Modules Entry Point
 * Exports GameStateEngine, CombatEngine, ItemMaster, QuestEngine, and WorldLedgerEngine.
 */

const gameStateEngine = require('./gameStateEngine');
const combatEngine = require('./combatEngine');
const itemMaster = require('./itemMaster');
const questEngine = require('./questEngine');
const worldLedgerService = require('./worldLedgerService');
const savingThrowEvaluator = require('./savingThrowEvaluator');
const aiDirectorEngine = require('./aiDirectorEngine');

module.exports = {
  gameStateEngine,
  combatEngine,
  itemMaster,
  questEngine,
  worldLedgerEngine: worldLedgerService,
  worldLedgerService,
  savingThrowEvaluator,
  aiDirectorEngine
};

