const path = require('path')
const express = require('express')
const Handlebars = require('handlebars')
const bodyParser = require('body-parser')
const session = require("express-session")
const cookieParser = require('cookie-parser')
const i18n = require("i18n");
const handlebars = require('express-handlebars')
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')

const configViewEngine = (app) => {
  // set view engine
  app.engine('hbs', handlebars.engine({
    defaultLayout: 'main',
    extname: '.hbs',
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
      ifeq: function (a, b, options) {
        if (a == b) {
          return options.fn(this)
        }
        return options.inverse(this)
      },
      incrementedIndex: function(index) {
        return index + 1;
      },
      i18n: function(){
        return i18n.__.apply(this,arguments);
       },
       __n: function(){
        return i18n.__n.apply(this, arguments);
      },
      ifRoleIsAdmin: function (role, options) {
        if (role === 'admin') {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      }
    }
  }));
  app.set('view engine', 'hbs')
  app.set('views', path.join('./src', 'resources/views'))
  i18n.configure({
    locales:['en', 'vi'],
    directory: 'src/locales',
    defaultLocale: 'vi',
    objectNotation: true,  
    cookie: 'lang',
   });
  // config static file
  app.use(express.static(path.join('./src', 'public')))
  app.use(bodyParser.urlencoded({ extended: true }));//body parser
  app.use(bodyParser.json()); //bodyparser json
  app.use(cookieParser())
  app.use(express.urlencoded());
  app.use(express.json())
  // app.use(express.static('/src/public/uploads'))
  app.use(session({
    secret: 'my-secret-key',
    resave: false, 
    saveUninitialized: false, 
  }));

  app.use((req, res, next) => {
    res.header('Cache-Control', 'no-store'); 
    next();
  });

  app.use((req, res, next) => {
    res.locals.message = req.session.message
    res.locals.orderMessage = req.session.orderMessage;
    res.locals.Posmessage = req.session.Posmessage;
    res.locals.SignUpMessage = req.session.SignUpMessage;

    delete req.session.message
    delete req.session.orderMessage;
    delete req.session.Posmessage;
    delete req.session.SignUpMessage
    next()
  })
  app.use(i18n.init);
}

module.exports = configViewEngine