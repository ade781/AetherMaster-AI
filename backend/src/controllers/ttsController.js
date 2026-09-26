const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

/**
 * Controller for Neural AI Text-to-Speech (Edge TTS)
 * Generates natural deep voice for Dark Fantasy Elder Narrator
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

    // Default configuration: Indonesian Male, Deep Pitch (-25Hz), Calm Elder Pace (-10%)
    const voice = req.body?.voice || req.query?.voice || 'id-ID-ArdiNeural';
    const pitch = req.body?.pitch || req.query?.pitch || '-25Hz';
    const rate = req.body?.rate || req.query?.rate || '-10%';

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanText, { pitch, rate });

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
