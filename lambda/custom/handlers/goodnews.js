// require news API
// require AWS SDK
const NewsAPI = require('newsapi');
const newsApiKey = process.env.newsApiKey;
const newsapi = new NewsAPI(newsApiKey);

function canHandle(handlerInput) {
  return handlerInput.requestEnvelope.request.type === 'IntentRequest'
    && handlerInput.requestEnvelope.request.intent.name === 'GoodNewsIntent'
}

async function handle(handlerInput) {

  // WIP news API
  let newsHeadlines;
  await newsapi.v2.topHeadlines({
    sources: 'bbc-news,google-news-uk',
    language: 'en'
  }).then(response => {
    newsHeadlines = getHeadlineDescriptions(response);
  });
  console.log(newsHeadlines);

  // call sentiment analysis here, ditch the bad ones

  // ditch the negative results... which might be a lot

  // take the first 1-2 positive ones and add into the response

  const speechText = "You asked for some good news";
      return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse();
}

function getHeadlineDescriptions(headlinesResponse) {
  return headlinesResponse.articles.map(article => article.description);
}

module.exports.canHandle = canHandle
module.exports.handle = handle

