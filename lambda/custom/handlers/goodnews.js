// require news API
// require AWS SDK
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('833f7b79d8844671a19d8d194d046282');

function canHandle(handlerInput) {
  return handlerInput.requestEnvelope.request.type === 'IntentRequest'
    && handlerInput.requestEnvelope.request.intent.name === 'GoodNewsIntent'
}

async function handle(handlerInput) {

  // WIP
  // newsapi.v2.topHeadlines({
  //   sources: 'bbc-news,google-news-uk',
  //   language: 'en'
  // }).then(response => {
  //   console.log(response);
  //   newsHeadlines = response;
  // });

  const speechText = "You asked for some good news";
      return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse();
}

module.exports.canHandle = canHandle
module.exports.handle = handle



let newsHeadlines;


