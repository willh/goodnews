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
    sources: 'bbc-news,google-news-uk,the-guardian-uk',
    language: 'en',
    pageSize: 50
  }).then(response => {
    newsHeadlines = getHeadlineDescriptions(response);
  });

  // remove any empty string headlines which will break downstream
  newsHeadlines = newsHeadlines.filter(headline => headline.length > 1);
  console.log(`Headlines: ${JSON.stringify(newsHeadlines)}`);

  // sentiment analysis only works in batches with 25 record max
  let headlineBatchOne = newsHeadlines.slice(0,25);
  let headlineBatchTwo = newsHeadlines.slice(25,50);

  let sentimentResults, speechText;
  
  try {
    let sentimentResultsOne = await getSentimentFromHeadlines(headlineBatchOne);
    let sentimentResultsTwo = await getSentimentFromHeadlines(headlineBatchTwo);

    let resultOne = sentimentResultsOne.ResultList;
    let resultTwo = mapSentimentResultIndicesBackToOriginalIndices(sentimentResultsTwo.ResultList);
    sentimentResults = resultOne.concat(resultTwo);

    // sort by descending positivity
    sentimentResults.sort((a,b) => b.SentimentScore.Positive - a.SentimentScore.Positive);

    // take the top two
    let topPositiveResults = sentimentResults.slice(0, 2);
    speechText = `The best news we could find was this: ${newsHeadlines[topPositiveResults[0].Index]}, and in other news, ${newsHeadlines[topPositiveResults[1].Index]}`;
  } catch (error) {
    console.log(error)
    speechText = "Sorry, there's no good news, as there was a problem getting good news results";
  }

  return handlerInput.responseBuilder
    .speak(speechText)
    .getResponse();
}

function mapSentimentResultIndicesBackToOriginalIndices(results) {
  // all the 'Index' entries in batch 2 start at 0 so to map them back to position in the
  // original headline list we need to take each of them and increment by 25
  return results.map(result => {
    result.Index += 25;
    return result;
  });
}

async function getSentimentFromHeadlines(newsHeadlines) {
  let params = {
    LanguageCode: "en",
    TextList: newsHeadlines
  };

  try {
    let sentimentResult = await comprehend.batchDetectSentiment(params).promise();
    console.log(JSON.stringify(sentimentResult));
    return sentimentResult;
  } catch (error) {
    console.log(`oh dear god no! ${error}`);
    throw error;
  }
}

function getHeadlineDescriptions(headlinesResponse) {
  return headlinesResponse.articles.map(article => article.description);
}

module.exports.canHandle = canHandle
module.exports.handle = handle
