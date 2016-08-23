var Twitter = require('twitter');
var badwordList = require('badwords-list');
var _ = require('lodash');

let client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

module.exports = function(Sweepstake) {
  Sweepstake.findSweepStakes = function(cb) {
    client.get('search/tweets', { q: 'retweet to enter', lang: 'en', result_type: 'recent' }, function(error, tweets, response) {
      if(error) cb(null, error);
      console.log('Tweets', tweets);  // Tweet body.
      console.log('\n\n\nResponse Object', response);  // Raw response object.
      let status = '200';
      cb(null, status);
    });
  };

  retweet = (id_str, lastRetweetTimestamp) => {
    if(Date.now() - lastRetweetTimestamp < 10000) {
      console.log('Taking a timeout', Date.now() - lastRetweetTimestamp);
      return lastRetweetTimestamp;
    }
    client.post('statuses/retweet/' + id_str, (error, tweet, response) => {
      if(!error) {
        console.log('We did a Tweet: ', JSON.stringify(tweet) + '\n' + response);
      }
    });

    return Date.now();
  };

  stepTwo = () => {

  };

  Sweepstake.streamSweepStakes = function(cb) {
    var stream = client.stream('statuses/filter', {track: 'retweet to win'});
    var lastRetweetTimestamp = Date.now();

    stream.on('data', (tweet) => {
      if(tweet.hasOwnProperty('retweeted_status') || tweet.hasOwnProperty('quoted_status') || (tweet.hasOwnProperty('possibly_sensitive') && tweet.possibly_sensitive === true)) {
        console.log('Nope');
        return 'Nope';
      }
      // console.log('\n\nNew Tweet From: ', tweet.user.screen_name + '\n' + tweet.text);
      // console.log('\nDate', tweet.created_at);

      if(tweet.text.toLowerCase().search(badwordList.regex) !== -1) {
        console.log('Fugetaboutit', tweet.text);
        return 'Badword Alert!';
      }

      lastRetweetTimestamp = retweet(tweet.id_str, lastRetweetTimestamp);
      stepTwo();
    });

    stream.on('error', function(error) {
      throw error;
    });
  }

  Sweepstake.remoteMethod(
    'findSweepStakes',
    {
      http: {path: '/findSweepStakes', verb: 'get'},
      returns: {arg: 'status', type: 'string'}
    }
  )
  Sweepstake.remoteMethod(
    'streamSweepStakes',
    {
      http: {path: '/streamSweepStakes', verb: 'get'},
      returns: {arg: 'status', type: 'string'}
    }
  )
};
