
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , movie = require('./routes/movie')
  , http = require('http')
  , path = require('path')
  , ejs = require('ejs')
  , session=require('express-session')
  , favicon = require('serve-favicon')
  , morgan = require('morgan')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , cookieSession = require('cookie-session')
  , errorhandler = require('errorhandler')
  // , SessionStore = require("session-mongoose")(express);
  ,MongoStore=require('connect-mongo')(session);

var store = new MongoStore({
    url: "mongodb://localhost/session",
    interval: 120000 // expiration check worker run interval in millisec (default: 60000)
});

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.engine('.html', ejs.__express);
app.set('view engine', 'html');// app.set('view engine', 'ejs');
app.set('trust proxy',1);
app.use(favicon(__dirname + '/public/favicon.ico'));
// app.use(express.logger('dev'));
app.use(morgan('combined'));
// app.use(express.bodyParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(express.methodOverride());
app.use(cookieParser()); 
app.use(cookieSession({secret : 'blog.fens.me'}));
app.use(session({
  	secret : 'blog.fens.me',
    store: store,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true,maxAge: 900000 } // expire session in 15 min or 900 seconds
}));
app.use(function(req, res, next){
  res.locals.user = req.session.user;
  var err = req.session.error;
  delete req.session.error;
  res.locals.message = '';
  if (err) res.locals.message = '<div class="alert alert-error">' + err + '</div>';
  next();
});
// app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler());
}

//basic
app.get('/', routes.index);

app.all('/login', notAuthentication);
app.get('/login', routes.login);
app.post('/login', routes.doLogin);

app.get('/logout', authentication);
app.get('/logout', routes.logout);

app.get('/home', authentication);
app.get('/home', routes.home);


//mongo
app.get('/movie/add',movie.movieAdd);
app.post('/movie/add',movie.doMovieAdd);
app.get('/movie/:name',movie.movieAdd);
app.get('/movie/json/:name',movie.movieJSON);



app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


function authentication(req, res, next) {
  if (!req.session.user) {
    req.session.error='请先登陆';
    return res.redirect('/login');
  }
  next();
}

function notAuthentication(req, res, next) {
	if (req.session.user) {
    	req.session.error='已登陆';
    	return res.redirect('/');
  	}
  next();
}