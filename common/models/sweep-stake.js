var Twitter = require('twitter');
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

  retweet = (id_str) => {
    client.post('statuses/retweet/' + id_str, (error, tweet, response) => {
      if(!error) {
        console.log('We did a Tweet', tweet + '\n' + response);
      }
    });
  };

  stepTwo = () => {

  };

  Sweepstake.streamSweepStakes = function(cb) {
    var stream = client.stream('statuses/filter', {track: 'retweet to win'});
    stream.on('data', function(tweet) {
      if(tweet.hasOwnProperty('retweeted_status')) return 'Nope';
      console.log('\n\nNew Tweet From: ', tweet.user.screen_name + '\n' + tweet.text);
      console.log('\nDate', tweet.created_at);

      retweet(tweet.id_str);
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
