const sceneSchema = require('./sceneSchema');
const intentResolver = require('./intentResolver');
const promptBuilder = require('./promptBuilder');
const geminiClient = require('./geminiClient');
const fallbackGenerator = require('./fallbackGenerator');

module.exports = {
  ...sceneSchema,
  ...intentResolver,
  ...promptBuilder,
  ...geminiClient,
  ...fallbackGenerator
};
