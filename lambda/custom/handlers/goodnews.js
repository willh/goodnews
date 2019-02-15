const AWS = require('aws-sdk');
const NewsAPI = require('newsapi');
const newsApiKey = process.env.newsApiKey;
const newsapi = new NewsAPI(newsApiKey);
const comprehend = new AWS.Comprehend({apiVersion: '2017-11-27'});

function canHandle(handlerInput) {
  return handlerInput.requestEnvelope.request.type === 'IntentRequest'
    && handlerInput.requestEnvelope.request.intent.name === 'GoodNewsIntent'
}

async function handle(handlerInput) {

  // WIP news API
  let newsHeadlines;
  await newsapi.v2.topHeadlines({
    sources: 'bbc-news,google-news-uk',
    language: 'en',
    pageSize: 25
  }).then(response => {
    newsHeadlines = getHeadlineDescriptions(response);
  });
  console.log(newsHeadlines);

  // call sentiment analysis here, ditch the bad ones
  let params = {
    LanguageCode: "en",
    TextList: newsHeadlines
  };

  let sentimentResult;
  try {
    sentimentResult = await comprehend.batchDetectSentiment(params).promise();
    console.log(JSON.stringify(sentimentResult));
  } catch (error) {
    console.log(`oh dear god no! ${error}`);
    return handlerInput.responseBuilder
        .speak("Sorry, something went horribly wrong")
        .getResponse();
  }

  let positiveResults = sentimentResult.resultList.filter(result => result.Sentiment == 'POSITIVE');

  let topTwoPositiveResults = positiveResults.slice(0, 2);

  let speechText = topTwoPositiveResults.join(", and in other news, ");

  if (topTwoPositiveResults.length == 0) {
    speechText = "Sorry, not a lot of good news today";
  }
  
  return handlerInput.responseBuilder
    .speak(speechText)
    .getResponse();
}

function getHeadlineDescriptions(headlinesResponse) {
  return headlinesResponse.articles.map(article => article.description);
}

module.exports.canHandle = canHandle
module.exports.handle = handle

