let express       = require('express')
let path          = require('path')
let favicon       = require('serve-favicon')
let logger        = require('morgan')
let cookieParser  = require('cookie-parser')
let bodyParser    = require('body-parser')
let flash         = require('connect-flash')
let routes        = require('./routes/index')
let settings      = require('./settings')
// let users = require('./routes/users')
let multer        = require('multer')
let crypto        = require('crypto')
let User          =  require('./models/user.js')
let session       = require('express-session')
let MongoStore    = require('connect-mongo')(session)
let fs            = require('fs')
let accessLog     = fs.createWriteStream('access.log', { flags : 'a' })
let errorLog      = fs.createWriteStream('error.log',  { flags : 'a' })
let app           = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev')) //日志中间件
app.use(bodyParser.json()) //加载解析json的中间件
app.use(bodyParser.urlencoded({ extended: false }))//加载解析urlencoded请求体的中间件
app.use(cookieParser()) //加载解析cookie中间件
app.use(express.static(path.join(__dirname, 'public')))

app.set('port', process.env.PORT || 4000)


app.listen(app.get('port'), function(){
    console.log('Express server listening on port' + app.get('port'))
})


app.use(logger('dev'))
app.use(logger({ stream: accessLog }))
app.use(express.static(path.join(__dirname, 'public')))

app.use( (err, req, res, next) =>{
  let meta = "[" + new Date() + "]" + req.url + "\n"
  errorLog.write(meta + err.stack + '\n')
  next()
})
app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({
    // db: settings.db,
    // host: settings.host,
    // port: settings.port
    url: 'mongodb://localhost/blog'
  })
}));


// app.use(multer({
//   dest:'./public/images',
//   rename:function(fieldname, filename){ //name名， 文件名
//     return filename
//   }
// }))

//app.use(flash()) 一定要放在app.use(session())后面
app.use(flash());

routes(app);
module.exports = app;
