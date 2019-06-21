const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));



app.get('/', 
(req, res) => {
  res.render('index');
});

app.get('/create', 
(req, res) => {
  res.render('index');
});

app.get('/links', 
(req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});


app.post('/links', 
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }
  return models.Links.get({ url }) // getting a url from database
    .then(link => {  // url-> link
      if (link) {  // if link already exists in database
        throw link; // render to page (client)
      }
      return models.Links.getUrlTitle(url); // grab url title of said url
    })
    .then(title => { 
      return models.Links.create({ // create a link object of models
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => { // takes link object of models as results
      return models.Links.get({ id: results.insertId }); // then WHERE condition for query
    })          // but i think this is new info to be rendered to client
    .then(link => {
      throw link; // rerender to client side
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/login',
(req, res) => {

});

app.post('/signup', 
(req, res) => {
  var params = [req.body.username, req.body.password];
  console.log('PARAMS:', params);
  console.log('PARAMS->USERNAME:', params[0]);
  // check if username is already existent in db
  models.Users.get({ username: params[0]})
    .then(username => {
      console.log('Inside promise chain')
      if (username) { // if username exists
        console.log('Inside US', username)
        throw username; // throw to catchblock and end response
      }
      console.log('after if')
      return models.Users.create({
        username: params[0],
        password: params[1]
    })

  })
    .then(username => {
      console.log('here')
      throw username;
    })
    .catch(username => {
      res.status(200).send(`${username} already exists, yo.`);
    })
  });
                  // .then(username => {
                  //   // need to compare to confirm it is in the db
                  // })
  // if it does, throw error
  // else create username using create fct using Model.user.create
  // then send back data success
  // catch send back data failure


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
