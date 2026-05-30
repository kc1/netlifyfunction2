const path = require('path');
const mod = require('./netlify/functions/openRouterPrompt.js');

const event = {
  body: JSON.stringify({
    ScreenshotURL: 'example.com/test-image.png',
    PROMPT: 'Describe the road in this image briefly',
    model: 'test-model',
  }),
};

(async () => {
  try {
    const res = await mod.handler(event, {});
    console.log('HANDLER RESULT:');
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Handler threw:', e);
  }
})();
