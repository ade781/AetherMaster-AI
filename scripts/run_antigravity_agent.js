const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const LOGS_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOGS_DIR, 'antigravity_agent.log');
const REPORT_MD = path.join(LOGS_DIR, 'latest_agent_report.md');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function writeLog(message) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${message}\n`;
  process.stdout.write(formatted);
  try {
    fs.appendFileSync(LOG_FILE, formatted, 'utf8');
  } catch (err) {
    console.error('Gagal menulis log agen:', err.message);
  }
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
  writeLog('❌ Error: GEMINI_API_KEY belum disetel di backend/.env');
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey });

// Variasi prompt arsitek dunia agar setiap siklus 30 menit menghasilkan konten baru
const PROMPT_CATALOG = [
  'Kamu adalah World Architect RPG AetherMaster AI. Rancang 1 peristiwa krisis faksi di benua Aether yang memicu quest baru di Kedai Whispering Tavern. Berikan deskripsi atmosferik dan 3 opsi tindakan awal pemain.',
  'Kamu adalah Narrative Designer AetherMaster AI. Ciptakan 1 mini-boss tersembunyi di Reruntuhan Crypt of Crimson dengan 3 fase perilaku tempur unik dan 2 pilihan dialog negosiasi rahasia.',
  'Kamu adalah System Balancer AetherMaster AI. Evaluasi 3 artefak legendaris baru (Pedang Cahaya Aether, Cincin Bayang Sunyi, Tongkat Kosmik) agar seimbang bagi kelas Warrior, Rogue, dan Mage di babak 8-12.',
  'Kamu adalah Lorekeeper AetherMaster AI. Tuliskan catatan sejarah kuno tentang Perang Gerbang Dimensi yang dapat ditemukan pemain sebagai item buku di Perpustakaan Celestial Sanctum.'
];

let cycleCount = 0;

async function runAntigravityTask() {
  cycleCount++;
  const runTimestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const prompt = PROMPT_CATALOG[(cycleCount - 1) % PROMPT_CATALOG.length];

  writeLog('===============================================================');
  writeLog(`     GOOGLE ANTIGRAVITY AGENT CLOUD RUNNER (Siklus #${cycleCount})     `);
  writeLog(`             WAKTU EKSEKUSI: ${runTimestamp}                 `);
  writeLog('===============================================================');
  writeLog('• Model Agent : antigravity-preview-09-2026');
  writeLog('• Environment : remote (Secure Google Linux Sandbox)');
  writeLog(`• Tugas       : "${prompt.slice(0, 70)}..."`);
  writeLog('• Status      : Mengirim permintaan ke Interactions API...\n');

  try {
    const startTime = Date.now();

    // Memanggil Antigravity Agent sesuai dokumentasi resmi
    const interaction = await client.interactions.create({
      agent: 'antigravity-preview-09-2026',
      input: prompt,
      environment: 'remote'
    }, { timeout: 300000 });

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const outputContent = interaction.outputText || interaction.output_text || JSON.stringify(interaction, null, 2);
    const tokensUsed = interaction.usage?.totalTokens || interaction.usage?.total_tokens || '-';

    writeLog('===============================================================');
    writeLog('                  HASIL DARI ANTIGRAVITY AGENT                  ');
    writeLog('===============================================================');
    writeLog(`• Interaction ID : ${interaction.id || interaction.name || 'OK'}`);
    writeLog(`• Environment ID : ${interaction.environmentId || interaction.environment_id || 'remote-sandbox'}`);
    writeLog(`• Status Selesai : ${interaction.status || 'completed'} (${elapsedSec}s)`);
    writeLog(`• Total Tokens   : ${tokensUsed}\n`);

    writeLog('--- OUTPUT TEKS DARI SANDBOX ---');
    writeLog(outputContent);
    writeLog('\n✅ SUKSES: Agent Cloud Google berhasil menyelesaikan tugas!');
    writeLog('===============================================================\n');

    // Tulis laporan ringkasan terakhir ke Markdown
    try {
      const mdContent = `# 🚀 Google Antigravity Agent - Laporan Siklus #${cycleCount}
**Waktu Eksekusi**: ${runTimestamp}  
**Model Agent**: \`antigravity-preview-09-2026\` (Remote Sandbox)  
**Durasi**: ${elapsedSec} detik | **Token**: ${tokensUsed}  

### 🎯 Tugas:
> ${prompt}

### 📜 Hasil Agen:
\`\`\`text
${outputContent}
\`\`\`

---
*Log lengkap riwayat sesi cloud agen tersimpan di: \`logs/antigravity_agent.log\`*
`;
      fs.writeFileSync(REPORT_MD, mdContent, 'utf8');
    } catch (err) {
      console.error('Gagal menulis latest_agent_report.md:', err.message);
    }

  } catch (error) {
    writeLog(`\n❌ Terjadi kesalahan saat memanggil Antigravity Agent: ${error.message}`);
    if (error.status) writeLog(`HTTP Status: ${error.status}`);
    if (error.errorDetails) writeLog(`Details: ${JSON.stringify(error.errorDetails)}`);
  }
}

// Handler scheduler berkala
async function start() {
  const args = process.argv.slice(2);
  let intervalMinutes = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--interval=')) {
      intervalMinutes = parseFloat(args[i].split('=')[1]);
    } else if (args[i] === '-i' || args[i] === '--interval') {
      intervalMinutes = parseFloat(args[i + 1]);
    } else if (args[i] === '--watch' || args[i] === '--loop') {
      intervalMinutes = 30; // default 30 menit
    }
  }

  // Jalankan siklus pertama seketika
  await runAntigravityTask();

  if (intervalMinutes && !isNaN(intervalMinutes) && intervalMinutes > 0) {
    const intervalMs = intervalMinutes * 60 * 1000;
    writeLog(`⏳ MODE BERKALA AKTIF: Antigravity Agent akan dipanggil otomatis setiap ${intervalMinutes} menit.`);
    writeLog(`👉 Pantau log langsung dengan: npm run agent:log`);
    writeLog(`👉 Tekan Ctrl + C di terminal untuk menghentikan scheduler.\n`);

    setInterval(async () => {
      writeLog(`⏰ Memulai siklus berkala Antigravity Agent (Interval ${intervalMinutes} menit)...`);
      await runAntigravityTask();
    }, intervalMs);
  }
}

start();

