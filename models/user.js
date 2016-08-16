let mongodb = require('./db')
let crypto  = require('crypto')


function User(user){
	this.name 		= user.name
	this.password 	= user.password
	this.email 		= user.email
}

module.exports = User

//存储用户信息
User.prototype.save = function(callback){
	let md5 		= crypto.createHash('md5')
	let email_MD5 	= md5.update(this.email.toLowerCase()).digest('hex')
	let head 		= "http://www.feizl.com/upload2007/2011_05/110505164429412.jpg"

	//要存入数据库的用户文档
	var user = {
		name 	 : this.name,
		password : this.password,
		email 	 : this.email,
		head 	 : head
	}

	//打开数据库
	mongodb.open( (err, db) => {
		if(err){
			return callback(err)
		}

		//读取数据库 users 聚合
		db.collection('users',  (err, collection) => {
			if(err){
				//关闭数据库
				mongodb.close() 
				return callback(err)
			}
			//将用户数据插入 users聚合
			collection.insert(user, {
				safe:true
			}, (err, user) => {
				mongodb.close()
				if(err){
					return callback(err) //错误， 返回err信息
				}
				callback(null, user[0]); //成功！ err为null 并返回存储后的用户文档
			})
		})
	})
}



//读取用户信息

User.get = function(name, callback){
	//打开数据库
	mongodb.open( (err, db) => {
		//一开始错误判断
		if(err){
			return callback(err) //返回错误新
		}

		//读取 users 集合
		db.collection('users',  (err, collection) => {
			if(err){
				mongodb.close()
				return callback(err) //返回错误信息
			}

			//查找用户名(name键) 值为 name 的一个文档
			collection.findOne({
				name : name 
			},function(err, user){
				mongodb.close()
				if(err){
					return callback(err)
				}
				
				callback(null, user) //返回用户信息
			})
		}) 
	})
}