let crypto = require('crypto')
let	User = require('../models/user.js')
let	Post = require('../models/post.js')
let Comment = require('../models/comment.js')
let momentTime = require('moment')
//app从 ../app.js的app接入
module.exports = function(app){
	//首页
	app.get('/', (req, res) => {
		//判断是否是第一页，并把请求的页数转成number类型
		var page = req.query.p ? +(req.query.p) : 1
		Post.getTen(null,page, (err, posts, total) => {
			if(err){
				posts = []
			}
			res.render('index', {
				title 		: '主页',
				posts 		: posts,
				page  		: page,
				isFirstpage : (page-1) == 0,
				isLastpage  : ((page-1) * 10 + posts.length) == total,
				user  		: req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			})
		})

		//返回到页面的参数一定在render返回在获取的到
		
	});




	//注册提交

	app.get('/reg', checkNotLogin) 

	app.get('/reg', (req, res) => {
  		res.render('reg', {
  			title : '注册',
  			user : req.session.user,
  			success : req.flash('success').toString(),
  			error : req.flash('error').toString()
  		})
	});
	
	app.post('/reg', checkNotLogin)

	app.post('/reg', (req, res) => {
		/*
			* 注册页步骤：
				1 获取页面信息
				2 检查2次密码是否一样
				3 针对密码加密
				4 保存用户信息到数据库
				5 查询数据库账户的唯一性
		*/
		let name = req.body.name,
			password = req.body.password ,
			password_re = req.body['password-repeat'];
			
		if(password_re != password){
			req.flash('error', '两次密码输入不一致')
			return res.redirect('/reg') //返回注册页
		}

		//生成密码的 MD5值
		let md5 = crypto.createHash('md5')
			password = md5.update(req.body.password).digest('hex'),
			newUser = new User({
				name : req.body.name,
				password : password,
				email : req.body.email
			});
			console.log(newUser)

		//检查用户是否已经存在
		User.get(newUser.name, (err, user) => {
			if(err){
				//返回错误跳到首页
				req.flash('error', err)
				return res.redirect('/')
			}
			//检查用户是否存在
			if(user){
				req.flash('error', '用户名已存在!')
				return res.redirect('/reg')//返回注册页
			}
			//newUser 为 User的实例方法
			//不存在者新增用户
			newUser.save((err, user) => {

				if(err){
					req.flash('error', err);
					return res.redirect('/reg');
				}

				//把用户信息存储到session里,就可以通过req.session.user读取
				req.session.user = user;
				req.flash('success', '注册成功')
				res.redirect('/')

			})
		})

	});




	//登录页
	app.get('/login', checkNotLogin)

	app.get('/login', (req, res, next) => {

		res.render('login', {
			title : "登录",
			user  : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		})

	});

	app.post('/login', checkNotLogin)

	app.post('/login', (req, res) => {
  		let md5 = crypto.createHash('md5'),
  			password = md5.update(req.body.password).digest('hex');

  		User.get(req.body.name, (err, user) => {
  			if(!user){

  				req.flash('error', '用户不存在！')
  				return res.redirect('/login') //用户不存在则跳转到登陆页
  			
  			}

  			//检查密码是否一致
  			if(user.password != password){

  				req.flash('error', '密码错误！')
  				return res.redirect('/login') //用户不存在则跳转到登录页

  			}
			
			
  			//用户名密码都匹配后，将用户信息存入session
  			req.session.user = user
  			req.flash('success', '登陆成功！')
  			res.redirect('/') //登陆成功后跳转到主页
  		})
	});

	

	//发表文章
	app.get('/post', checkLogin)

	app.get('/post', (req, res) => {
  		res.render('post', { 
			  title		: "发表",
			  user 		: req.session.user,
			  success 	: req.flash('success').toString(),
			  error		: req.flash('error').toString()
			}
		);
	});

	app.post('/post', checkLogin)

	app.post('/post', (req, res)=> {
		let currentUser = req.session.user
		let tags 		= [req.body.tag1, req.body.tag2, req.body.tag3]
		console.log(currentUser)
		
		let	post 		= new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post)
		post.save( err => {
			if(err){
				req.flash('error', err)
				return res.redirect('/')
			}
			req.flash('success','发布成功！')
			res.redirect('/') //发表成功跳转到首页
		})

	});


	//登出
	app.get('/logout, checkLogin')

	app.get('/logout', (req, res) => {
		req.session.user = null
		req.flash('success', '登出成功')
		res.redirect('/')
	});

	app.get('/upload',  checkLogin)

	app.get('/upload', (req, res) =>{
		res.render('upload',{
			title:'文件上传',
			user : req.session.user,
			success : req.flash('success').toString(),
			error  : req.flash('error').toString()
		})
	})


	app.post('/upload', checkLogin)

	app.post('/upload', (req, res) => {
		req.flash('success', '文件上传成功！')
		res.redirect('/upload')
	})

	//存档
	app.get('/archive', (req, res) =>{
		Post.getArchive( (err, posts) => {
			if(err){
				req.flash('error', err)
				return res.redirect('/')
			}

			res.render('archive',{
				title 	: "存档",
				posts 	: posts,
				user  	: req.session.user,
				success : req.flash('success').toString(),
				error 	: req.flash('error').toString()
			})
		})
	})

	//标签
	app.get('/tags', (req, res) =>{
		Post.getTags( (err, posts) =>{
			if(err){
				req.flash('error', err)
				return res.redirect('/')
			}

			res.render('tags',{
				title	: '标签',
				posts	: posts,
				user	: req.session.user,
				success	: req.flash('success').toString(),
				error  	: req.flash('error').toString()
			})
		})
	})

	//单个表现详细页
	app.get('/tags/:tag', (req, res) =>{
		Post.getTag(req.params.tag, (err, posts) =>{
			if(err){
				req.flash('error', err)
				return res.redirect('/')
			}

			res.render('tag',{
				title	: 'Tag' + req.params.tag,
				posts 	: posts,
				user 	: req.session.user,
				success : req.flash('success').toString(),
				error 	: req.flash('error').toString()
			})
		})
	})

	app.get('/u/:name', (req,res) => {
		let page = req.params.p ? parseInt(req.query.p) : 1
		
		//检查用户名是否存在
		User.get(req.params.name, (err, user) => {
			if(!user){
				req.flash('err','用户名不存在！')
				return res.redirect('/')//用户不存在跳转到首页
			}
			//查询并返回该用户第page 页的10篇文章
			Post.getTen(user.name, page, (err, posts, total) => {
				if(err){
					req.flash('error', err)
					return res.redirect('/')
				}

				res.render('user',{
					title		: user.name,
					posts 		: posts,
					page  		: page,
					isFirstpage : ( page - 1 ) == 0,
					isLastpage 	: (( page - 1 ) * 10 + posts.length) == total,
					user 		: req.session.user,
					success 	: req.flash('success').toString(),
					error 		: req.flash('error').toString()
				})
			})
		})
		
	})

	//友情链接
	app.get('/links', (req, res)=> {
		res.render('links', {
			title:'友情链接',
			user : req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	})

	//检索
	app.get('/search', (req, res) =>{
		
		Post.search(req.query.keyword, (err, posts) => {
			if(err){
				req.flash('error', err)
				return res.redirect('/')
			}
			res.render('search',{
				title:"Search:" + req.query.keyword,
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error : req.flash('error').toString()
			})
		})
	})


	app.get('/u/:name/:day/:title', (req, res) => {
		Post.getOne(req.params.name, req.params.day, req.params.title, (err, post) => {
			if(err){
				req.flash('error', err)
				return res.redirect('/')
			}
			
			res.render('article',{
				title : req.params.title,
				post : post,
				user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			})
		})
	})


	//留言
	app.post('/u/:name/:day/:title', (req, res) => {
		let moment = momentTime(new Date())
		let	time = `${moment.year()}-${moment.month() + 1}-${moment.date()} ${moment.hour()}:${moment.minute()}`
		
		let md5 		= crypto.createHash('md5')
		let email_MD5 	= md5.update(this.email.toLowercase()).digest('hex')
		let head 		= "http://www.gravatar.com/avatar/"+email_MD5+"?s=48"

		let comment = {
			name 	: req.body.name,
			head    : head,
			email 	: req.body.email,
			website : req.body.website,
			time 	: time,
			content : req.body.content
		}
		
		let newComment = new Comment(req.params.name, req.params.day, req.params.title, comment)

		newComment.save(err =>{
			if(err){
				req.flash('error', err)
				return res.redirect('back')
			}

			req.flash('success', '留言成功！')
			res.redirect('back')
		})
	})


	app.get('/edit/:name/:day/:title', checkLogin)

	app.get('/edit/:name/:day/:title', (req, res) => {
		let currentUser = req.session.user
		Post.edit(currentUser.name, req.params.day, req.params.title, (err, post) => {
			if(err){
				req.flash('error', err)
				return res.redirect('back')
			}

			res.render('edit',{
				title : '编辑',
				post  : post,
				user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()　
			})
		})
	})


	app.post('/edit/:name/:day/:title', checkLogin)

	app.post('/edit/:name/:day/:title',  (req, res) => {
		let currentUser = req.session.user;
		Post.update(currentUser.name, req.params.day, req.params.title, req.body.post , err => {
			let url = encodeURI('/u/'+ req.params.name + '/' + req.params.day + '/' + req.params.title)
			if(err){
				req.flash('error', err)
				return res.redirect(url)//出错返回文章页
			}
			req.flash('success', '修改成功!')
			res.redirect(url) //成功返回文章页
		})
	})

	app.get('/remove/:name/:day/:title', checkLogin);

	app.get('/remove/:name/:day/:title', (req, res) => {
		let currentUser = req.session.user
		Post.remove(currentUser.name, req.params.day, req.params.title, err => {
			if(err){
				req.flash('error', err)
				return res.redirect('back')
			}
			req.flash('success', '删除成功')
			res.redirect('/')
		})
	})

	app.use((req,res) => {
		res.render('404')
	})

	function checkLogin(req, res, next){
		if(!req.session.user){
			req.flash('error', '未登陆!')
			res.redirect('/login')
		}
		next()
	}

	function checkNotLogin(req, res, next){
		if(req.session.user){
			req.flash('error', '已登陆！')
			res.redirect('back')//返回之前的页面
		}

		next()
	}
}