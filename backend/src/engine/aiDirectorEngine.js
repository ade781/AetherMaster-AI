/**
 * AI Director & Dynamic Pacing Engine
 * Monitors player health, pacing, and difficulty dynamically across turns.
 * Controls Dynamic Difficulty Adjustment (DDA) and injects tension metrics.
 */

class AIDirectorEngine {
  /**
   * Evaluates current player and session state to compute pacing and DDA metrics.
   *
   * @param {Object} params
   * @param {Object} params.character - Current player character
   * @param {Object} params.session - Active game session
   * @returns {Object} directorPacing metrics matching API Contract
   */
  evaluatePacing({ character, session }) {
    if (!character) {
      return {
        tensionLevel: 'moderate',
        dangerScore: 50,
        recommendedPacing: 'maintain_tempo',
        adaptiveModifiers: {
          enemyDamageModifier: 1.0
        }
      };
    }

    const currentHp = Number(character.hp ?? 30);
    const maxHp = Number(character.maxHp ?? 30);
    const hpRatio = maxHp > 0 ? (currentHp / maxHp) : 1;
    const turnCount = Number(session?.turnCount ?? 1);

    // Rule 1: Critical HP (< 25%) -> Lower combat threat, suggest rest/potion, soften damage
    if (hpRatio < 0.25) {
      return {
        tensionLevel: 'high',
        dangerScore: 75,
        recommendedPacing: 'offer_rest_or_safe_exploration',
        adaptiveModifiers: {
          enemyDamageModifier: 0.85,
          combatEncounterChance: 0.3,
          suggestRestChoice: true
        }
      };
    }

    // Rule 2: Low-to-Moderate HP (25% - 50%)
    if (hpRatio < 0.50) {
      return {
        tensionLevel: 'tense',
        dangerScore: 60,
        recommendedPacing: 'cautious_progression',
        adaptiveModifiers: {
          enemyDamageModifier: 0.95,
          combatEncounterChance: 0.5
        }
      };
    }

    // Rule 3: Player dominating (HP > 90% and sustained over turns) -> Escalate challenge
    if (hpRatio >= 0.90 && turnCount >= 4) {
      return {
        tensionLevel: 'escalating',
        dangerScore: 35,
        recommendedPacing: 'escalate_threat_or_ambush',
        adaptiveModifiers: {
          enemyDamageModifier: 1.15,
          combatEncounterChance: 0.8,
          triggerHazard: true
        }
      };
    }

    // Default Balanced Pacing
    return {
      tensionLevel: 'moderate',
      dangerScore: 45,
      recommendedPacing: 'maintain_tempo',
      adaptiveModifiers: {
        enemyDamageModifier: 1.0,
        combatEncounterChance: 0.5
      }
    };
  }
}

module.exports = new AIDirectorEngine();
