const {
  sceneSchema,
  choiceSchema,
  combatEncounterSchema,
  itemSchema,
  missionLogSchema,
  cleanText
} = require('./narrative/sceneSchema');
const { resolvePlayerIntent } = require('./narrative/intentResolver');
const {
  buildOpeningSystemPrompt,
  buildOpeningUserPrompt,
  buildNextSceneSystemPrompt,
  buildNextSceneUserPrompt
} = require('./narrative/promptBuilder');
const { GeminiClient, sanitizeLog } = require('./narrative/geminiClient');
const {
  generateFallbackOpening,
  generateFallbackNextScene
} = require('./narrative/fallbackGenerator');

class GeminiService {
  constructor() {
    this.geminiClient = new GeminiClient();
    this.sceneSchema = sceneSchema;
    this.choiceSchema = choiceSchema;
    this.combatEncounterSchema = combatEncounterSchema;
    this.itemSchema = itemSchema;
    this.missionLogSchema = missionLogSchema;
  }

  get isAvailable() {
    return this.geminiClient.isAvailable();
  }

  // Legacy compatibility: callWithFallback
  async callWithFallback(prompt, systemPrompt) {
    return this.geminiClient.callWithRetry(prompt, systemPrompt);
  }

  resolvePlayerIntent(actionText, context = {}) {
    return resolvePlayerIntent(actionText, context);
  }

  async generateOpeningScene(campaignOrOptions, characterOpt) {
    let campaign = campaignOrOptions;
    let character = characterOpt;

    // Handle object argument pattern: { campaign, character }
    if (campaignOrOptions && typeof campaignOrOptions === 'object' && campaignOrOptions.campaign) {
      campaign = campaignOrOptions.campaign;
      character = campaignOrOptions.character || characterOpt;
    }

    if (!this.geminiClient.isAvailable()) {
      return generateFallbackOpening(campaign, character);
    }

    const targetBgId = campaign?.defaultBackgroundId || 'bg_01_tavern';
    const targetNpcId = campaign?.defaultNpcId || 'char_npc_01_barkeep';

    try {
      const systemPrompt = buildOpeningSystemPrompt({ campaign, character });
      const userPrompt = buildOpeningUserPrompt({ campaign, character });

      const parsed = await this.geminiClient.generateStructuredScene(userPrompt, systemPrompt);

      if (!parsed.backgroundId || (parsed.backgroundId === 'bg_01_tavern' && targetBgId !== 'bg_01_tavern')) {
        parsed.backgroundId = targetBgId;
      }
      if (!parsed.characterId || (parsed.characterId === 'char_npc_01_barkeep' && targetNpcId !== 'char_npc_01_barkeep')) {
        parsed.characterId = targetNpcId;
      }

      return parsed;
    } catch (err) {
      console.warn(
        '[GeminiService] Error generating opening scene via Gemini, activating fallback:',
        sanitizeLog(err.message, this.geminiClient.apiKey)
      );
      return generateFallbackOpening(campaign, character);
    }
  }

  async generateNextScene(params = {}) {
    const {
      session,
      character,
      previousNode,
      actionTaken,
      recentHistory,
      worldLedger,
      questState
    } = params;

    const actionText = actionTaken?.text || actionTaken?.customText || 'Melangkah maju dengan waspada';
    const prevBgId = previousNode?.backgroundId || 'bg_01_tavern';
    const prevSpeaker = previousNode?.speaker || 'Narator';

    // 1. Resolve player intent and diegetic checking
    const resolvedIntent = resolvePlayerIntent(actionText, {
      character,
      previousNode,
      speaker: prevSpeaker
    });

    if (!this.geminiClient.isAvailable()) {
      return generateFallbackNextScene({
        previousNode,
        actionTaken,
        character,
        session,
        worldLedger,
        questState,
        resolvedIntent
      });
    }

    try {
      const systemPrompt = buildNextSceneSystemPrompt({
        session,
        character,
        previousNode,
        actionTaken,
        recentHistory,
        worldLedger: worldLedger || session?.worldLedger,
        questState,
        resolvedIntent
      });

      const userPrompt = buildNextSceneUserPrompt({
        character,
        actionTaken,
        resolvedIntent
      });

      const parsed = await this.geminiClient.generateStructuredScene(userPrompt, systemPrompt);

      // Spatial anchoring: preserve background unless intentional location change
      if (!parsed.backgroundId || (parsed.backgroundId === 'bg_01_tavern' && prevBgId !== 'bg_01_tavern')) {
        parsed.backgroundId = prevBgId;
      }

      return parsed;
    } catch (err) {
      console.warn(
        '[GeminiService] Error generating next scene via Gemini, activating contextual fallback:',
        sanitizeLog(err.message, this.geminiClient.apiKey)
      );
      return generateFallbackNextScene({
        previousNode,
        actionTaken,
        character,
        session,
        worldLedger,
        questState,
        resolvedIntent
      });
    }
  }
}

const geminiServiceInstance = new GeminiService();

module.exports = geminiServiceInstance;

// Expose exports for destructuring and contract conformance
module.exports.GeminiService = GeminiService;
module.exports.generateOpeningScene = geminiServiceInstance.generateOpeningScene.bind(geminiServiceInstance);
module.exports.generateNextScene = geminiServiceInstance.generateNextScene.bind(geminiServiceInstance);
module.exports.resolvePlayerIntent = resolvePlayerIntent;
module.exports.sceneSchema = sceneSchema;
module.exports.choiceSchema = choiceSchema;
module.exports.combatEncounterSchema = combatEncounterSchema;
module.exports.itemSchema = itemSchema;
module.exports.missionLogSchema = missionLogSchema;
module.exports.cleanText = cleanText;
