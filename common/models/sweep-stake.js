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

  throttle = (lastRetweetTimestamp) => {
    if(Date.now() - lastRetweetTimestamp < 10000) {
      console.log('Taking a timeout', Date.now() - lastRetweetTimestamp);
      return lastRetweetTimestamp;
    }
  }

  retweet = (id_str) => {
    client.post('statuses/retweet/' + id_str, (error, tweet, response) => {
      if(error) {
        console.log('We did a retweet error: ', error);
      }
      console.log('We did a Tweet: ', JSON.stringify(tweet) + '\n' + response);
    });

    return Date.now();
  };

  follow = (screen_name) => {
    client.post('friendships/create.json?screen_name=' + screen_name + '&follow=true', (error, tweet, response) => {
      if(error) {
        console.log('We did a follow error: ', error);
      }
      console.log('We did a follow too!');
    });
  }

  saveTweet = (tweet) => {
    const sweepstakeData = {
      twitterAccount: tweet.user.screen_name,
      tweet: tweet
    };
    Sweepstake.create(sweepstakeData);
  };

  Sweepstake.streamSweepStakes = function(cb) {
    // const queryStrings = [
    //   'retweet to win',
    //   'follow to win',
    //   'retweet to enter',
    //   'follow to enter',
    //   'RT to enter',
    //   'RT to win'
    // ]
    const queryStrings = [
      'cheetos',
      'chester the cheetah',
      'cheetos!',
      'Cheetos',
      'CHEETOS!',
      '#cheetos',
      'cheetos.',
      '#cheetos.',
      'cheetahs',
      '#cheetahs'
    ]

    var stream = client.stream('statuses/filter', {track: queryStrings.join(',')});
    var lastRetweetTimestamp = Date.now();

    stream.on('data', (tweet) => {
      if(tweet.text === undefined) {
        console.log('tweet.text undefined');
        return 'UNDEFINED';
      }

      if(tweet.hasOwnProperty('retweeted_status') || tweet.hasOwnProperty('quoted_status') || (tweet.hasOwnProperty('possibly_sensitive') && tweet.possibly_sensitive === true)) {
        console.log('Nope');
        return 'Nope';
      }

      for (var i = 0; i < queryStrings.length; i++) {
        if(tweet.text.includes(queryStrings[i])) {
          break;
        }
        if(i === queryStrings.length - 1) {
          console.log('This tweet aint good enough: ', tweet.text);
          return 'This tweet aint good enough';
        }
      }

      if(tweet.text.toLowerCase().search(badwordList.regex) !== -1) {
        console.log('Fugetaboutit', tweet.text);
        return 'Badword Alert!';
      }

      if(throttle(lastRetweetTimestamp)) return 'Throttled!';

      //lastRetweetTimestamp = retweet(tweet.id_str);
      //follow(tweet.user.screen_name);
      saveTweet(tweet);
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
