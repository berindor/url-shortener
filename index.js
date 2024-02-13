require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser');
const dns = require('dns');
let mongoose = require('mongoose');

// Basic Configuration
const port = process.env.PORT || 3300;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

//here starts the url shortener part
mongoose.connect(process.env.MONGO_URI);

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  redirectUrl: String,
  shortUrl: Number
});

let UrlModel = mongoose.model('urlModel', urlSchema);

const addUrlToDb = (originalUrl, redirectUrl, shortUrl) => {
  let url = new UrlModel({ originalUrl, redirectUrl, shortUrl });
  url.save();
};

//array to store the urls for the first version of app
let urlArr = [];
//todo: create db

const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(urlencodedParser);

app.route('/api/shorturl').post(urlencodedParser, async (req, res) => {
  try {
    const url = new URL(req.body.url);
    dns.lookup(url.hostname, async err => {
      if (err) {
        res.json({ error: 'invalid url' });
      } else {
        urlArr.push(url.href);
        const shortUrl = urlArr.length - 1;
        console.log(urlArr);
        //        addUrlToDb(req.body.url, url.href, shortUrl);
        res.json({ original_url: req.body.url, short_url: shortUrl });
      }
    });
  } catch (err) {
    res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:shorturl', async function (req, res) {
  const url = await UrlModel.findOne({ shortUrl: req.params.shorturl });
  console.log('redirect to ', url.redirectUrl);
  res.redirect(url.redirectUrl);
});
