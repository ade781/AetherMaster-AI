const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const DEFAULT_VOICE = 'id-ID-ArdiNeural';
const DEFAULT_PITCH = '-25Hz';
const DEFAULT_RATE = '-10%';

/**
 * Controller for Neural AI Text-to-Speech (Edge TTS)
 * Generates natural deep voice for Dark Fantasy Elder Narrator.
 */
exports.synthesizeSpeech = async (req, res) => {
  try {
    const text = req.body?.text || req.query?.text;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Text is required for TTS' });
    }

    // Clean text from Markdown artifacts (asterisks, hashtags, backticks, emojis)
    const cleanText = text
      .replace(/[*_~`#>]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ success: false, error: 'Text cannot be empty' });
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(DEFAULT_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanText, { pitch: DEFAULT_PITCH, rate: DEFAULT_RATE });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    audioStream.pipe(res);

    audioStream.on('error', (err) => {
      console.error('[TTS Stream Error]:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Gagal melakukan sintesis suara narasi.' });
      }
    });
  } catch (err) {
    console.error('[TTS Controller Error]:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message || 'Gagal memproses TTS' });
    }
  }
};
