/**
 * Script Pemanggil Resmi Antigravity Agent (Gemini Interactions API)
 * Menjalankan agen otonom di remote sandbox Linux milik Google.
 *
 * Cara Menjalankan:
 *   node scripts/run_antigravity_agent.js
 */

const { GoogleGenAI } = require('@google/genai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
  console.error('❌ Error: GEMINI_API_KEY belum disetel di backend/.env');
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey });

async function runAntigravityTask() {
  console.log('===============================================================');
  console.log('         MEMANGGIL GOOGLE ANTIGRAVITY AGENT CLOUD              ');
  console.log('===============================================================');
  console.log('• Model Agent : antigravity-preview-09-2026');
  console.log('• Environment : remote (Secure Google Linux Sandbox)');
  console.log('• Status      : Mengirim permintaan ke Interactions API...\n');

  try {
    const startTime = Date.now();

    // Memanggil Antigravity Agent sesuai dokumentasi resmi
    const interaction = await client.interactions.create({
      agent: 'antigravity-preview-09-2026',
      input: 'Kamu adalah World Architect untuk game RPG fantasi AetherMaster AI. Rancang 1 peristiwa krisis faksi di benua Aether yang memicu quest baru di Kedai Whispering Tavern. Berikan deskripsi atmosferik dan 3 opsi tindakan awal pemain.',
      environment: 'remote'
    }, { timeout: 300000 });

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('===============================================================');
    console.log('                  HASIL DARI ANTIGRAVITY AGENT                  ');
    console.log('===============================================================');
    console.log(`• Interaction ID : ${interaction.id || interaction.name || 'OK'}`);
    console.log(`• Environment ID : ${interaction.environmentId || interaction.environment_id || 'remote-sandbox'}`);
    console.log(`• Status Selesai : ${interaction.status || 'completed'} (${elapsedSec}s)\n`);

    console.log('--- OUTPUT TEKS DARI SANDBOX ---');
    console.log(interaction.outputText || interaction.output_text || JSON.stringify(interaction, null, 2));

    if (interaction.usage) {
      console.log('\n--- TOKEN USAGE ---');
      console.log(`Total Tokens : ${interaction.usage.totalTokens || interaction.usage.total_tokens || '-'}`);
    }

    console.log('\n===============================================================');
    console.log('✅ SUKSES: Agent telah bekerja di cloud Google!');
    console.log('Cek dashboard Google AI Studio: Kuota Antigravity Agents Anda kini sudah bertambah!');
    console.log('===============================================================\n');

  } catch (error) {
    console.error('\n❌ Terjadi kesalahan saat memanggil Antigravity Agent:');
    console.error(error.message);
    if (error.status) console.error('HTTP Status:', error.status);
    if (error.errorDetails) console.error('Details:', error.errorDetails);
  }
}

runAntigravityTask();
