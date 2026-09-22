const { runModelTests } = require('./test_models_and_db');
const { runDiceEngineTests } = require('./test_dice_engine');
const { runStoryApiTests } = require('./test_story_controller_api');
const { runSaveLoadTests } = require('./test_save_load_multi_slot');
const { runGeminiAndFallbackTests } = require('./test_gemini_and_fallback');

async function main() {
  console.log('================================================================');
  console.log('       AETHERMASTER AI - FASE 1: BACKEND CORE & PERSISTENCE     ');
  console.log('================================================================\n');

  try {
    await runModelTests();
    runDiceEngineTests();
    await runGeminiAndFallbackTests();
    await runStoryApiTests();
    await runSaveLoadTests();

    console.log('================================================================');
    console.log('       >>> FASE 1 TESTING BACKEND LENGKAP: 100% SUKSES! <<<     ');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [FASE 1 TESTING FAILED]:', err);
    process.exit(1);
  }
}

main();
