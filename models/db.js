var settings = require('../settings'),
	Db 		 = require('mongodb').Db,
	Connection = require('mongodb').Connection,
	Server	 = require('mongodb').Server;
module.exports = new Db(settings.db, new Server(settings.host, settings.port), {safe : true})
//						 数据库名             数据库地址  和   端口          
