// Vercel Serverless Function entrypoint with robust error capture
let app;
let initError = null;

try {
  const server = require('../backend/src/server');
  app = server.app;
} catch (err) {
  initError = {
    name: err.name,
    message: err.message,
    stack: err.stack
  };
  console.error('[Vercel Serverless Init Error]:', err);
}

module.exports = (req, res) => {
  if (initError) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      error: 'Backend Serverless Initialization Error',
      details: initError
    });
  }

  try {
    return app(req, res);
  } catch (err) {
    console.error('[Vercel Serverless Runtime Error]:', err);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      error: 'Backend Serverless Runtime Error',
      message: err.message,
      stack: err.stack
    });
  }
};
