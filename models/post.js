let mongodb = require('./db')
let	momentTime = require('moment')
let markdown = require('markdown').markdown


function Post(name, head,  title, tags, post){

    this.name   = name
    this.title  = title
    this.post   = post
    this.tags   = tags
    this.head   = head
    
}




// 存储一篇文章及其相关信息
Post.prototype.save = function(callback){
    let moment = momentTime(new Date())
    // 存储各种时间格式，方便以后扩展
    let time = {
        date  : moment,
        year  : moment.year(),
        month : `${moment.year()}-${moment.month() + 1}`,
        day   : `${moment.year()}-${moment.month() + 1}-${moment.date()}`,
        minute: `${moment.year()}-${moment.month() + 1}-${moment.date()} ${moment.hour()}:${moment.minute()}`
    }
    //要存入数据库的文档
    let post = {
        name  :  this.name,
        time  :  time,
        head  :  this.head,
        title :  this.title,
        tags  :  this.tags,
        post  :  this.post,
        comments : [],
        pv    : 0
    }
    //打开数据库
    mongodb.open((err, db) => {
        if(err){
            return callback(err)
        }
        //读取posts集合

        db.collection('posts', (err, collection) => {
            if(err){
                mongodb.close()
                return callback(err)
            }

            //将文档插入posts集合
            collection.insert(post, {
                safe : true
            }, err => {
                mongodb.close()
                if(err){
                    return callback(err) //失败，返回err
                }

                callback(null)//返回err为null

            })
        })
    })
}


Post.getTen = function(name, page, callback){

    //打开数据库
    mongodb.open( (err, db) => {
        if(err){
            return callback(err)
        }

        //读取 posts 集合
        db.collection('posts', (err, collection) => {
            if(err){
                mongodb.close()
                return callback(err)
            }

            var query = {}
            if(name){
                query.name = name
            }
            //使用 count 返回特定查询的文档树 total
            collection.count(query, (err, total) =>{
                //根据 query 对象查询，并跳过前（page-1)*10个结果,返回之后的结果
                                //根据query对象查询文章
                collection.find(query,{
                    skip:(page-1) * 10,
                    limit:10
                }).sort({
                    time : -1
                }).toArray( (err, docs) => {
                    mongodb.close()
                    if(err){
                        return callback(err)
                    }

                    docs.forEach(doc => {
                        if(doc.post) doc.post = markdown.toHTML( doc.post )
                    });
                    callback(null, docs)
                })

            })

        })
    })
}



// 获取一篇文章
Post.getOne =  function(name, day, title, callback) {
    // 打开数据库
    mongodb.open( (err, db) => {
        if(err){
            return callback(err)
        }
        //读取 posts集合
        db.collection('posts',  (err, collection) => {
            if(err){
                mongodb.close()
                return callback(err)
            }
            //根据用户名，发表日期及文章名进行查询
            collection.findOne({
                "name" : name,
                "time.day" :  day,
                "title" : title
            }, (err, doc) => {
               
                if(err){
                     mongodb.close()
                    return callback(err)
                }
                //解析mardown 为 html
                if(doc){
                    //每访问一次，pv增加1
                    collection.update({
                        "name" : name,
                        "time.day" :  day,
                        "title" : title
                    },{
                        $inc : {'pv':1}
                    }, err => {
                        mongodb.close()
                        if(err){
                            return callback(err)
                        }
                    })
                    if(doc.post) doc.post = markdown.toHTML(doc.post)
                    doc.comments.forEach( comment => {
                        if(comment.content) comment.content = markdown.toHTML(comment.content)
                    })
                    callback(null, doc)//　返回一篇文章   
                }
                
            })
        })
        
    })
}



//返回原始发表的内容 (markdown格式)
Post.edit = function(name, day, title, callback) {
    //打开数据库
    mongodb.open( (err, db) => {
        if(err){
            return callback(err)
        }

        //读取posts集合
        
        db.collection('posts', (err, collection) => {
            if(err){
                mongodb.close()
                return callback(err)
            }

            //根据用户名,发表日期及文章名进行查询
            collection.findOne({
                "name" : name,
                "time.day" :  day,
                "title" : title
            },  (err, doc) => {
                mongodb.close()
                if(err){
                    return callback(err)
                }
                callback(null, doc)//返回查询的一篇文章(markdown格式)
            })
        })
    })
}

Post.update =  function ( name, day, title, post, callback) {
    //打开数据库
    mongodb.open((err, db) => {
        if(err){
            return callback(err)
        }
        //读取 posts 集合
        db.collection('posts', (err, collection) => {
            if(err){
                mongodb.close()
                return callback(err)
            }

            //更新文章内容
            //update更新参数（匹配值,变更）
            //匹配多条变更 db.collection.update(匹配值,变更值,{multi:true})
            collection.update({
                "name" : name,
                "time.day" :  day,
                "title" : title
            },{
                $set : {post : post}
            }, err => {
                mongodb.close()
                if(err){
                    return callback(err)
                }
                callback(null)
            })
        })
    })
}


//删除一篇文章

Post.remove = function (name, day, title, callback) {

    //打开数据库
    mongodb.open( (err,db) => {
        if(err){
            return callback(err)
        }

        //读取posts集合

        db.collection('posts', (err, collection) => {

            if(err){
                mongodb.close()
                return callback(err)
            }

            // 根据用户名， 日期和标题查找并删除一篇文章

            collection.remove({
                "name":name,
                "time.day" : day,
                "title": title
            }, {
                w : 1
            },err => {
                mongodb.close()
                if(err){
                    return callback(err)
                }
                callback(null)
            })
        })
    })
}




//返回所有文章存档信息
Post.getArchive = function(callback){
    //打开数据库
    mongodb.open( (err, db) => {
        if(err){
            return callback(err)
        }

        //读取posts集合
        db.collection('posts', (err, collection) => {
            if(err){
                mongodb.close()
                return callback(err)
            }

            //返回只包含 name, time, title 属性文档组成的存档数组
            collection.find({}, {
                'name':1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray((err, docs)=> {
                mongodb.close()
                if(err){
                    return callback(err)
                }
                callback(null, docs)
            })
        })
    })
}



Post.getTags = function(callback){
    mongodb.open( (err, db) =>{
        if(err){
            return callback(err)
        }
        db.collection('posts', (err, collection) =>{
            if(err){
                mongodb.close()
                return callback(err)
            }
            //distinct 用来找出给定键的所有不同值
            collection.distinct("tags", (err, docs) => {
                mongodb.close()
                if(err){
                    return callback(err)
                }
            })
        })
    })
}




//返回含有特定标签的文章
Post.getTag = function(tag, callback){
    mongodb.open( (err, db) =>{
        if(err){
            return callback(err)
        }

        db.collection('posts', (err, collection) => {
            if(err){
                mongodb.close()
                return callback(err)
            }
            //查询所有tags数组内包含tag的文档
            //并返回只含有name,time,title组成的数组
            collection.find({
                'tags':tag
            },{
                'name':1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray( (err, docs) => {
                mongodb.close()
                if(err){
                    return callback(err)
                }
                callback(null, docs)
            })
        })
    })
}

Post.search = function(keyword , callback){
    mongodb.open((err, db) =>{
        if(err){
            return callback(err)
        }

        db.collection('posts', (err, collection) =>{
            if(err){
                mongodb.close()
                return callback(err)
            }

            let pattern = keyword.replace(/\s/g,"")
            collection.find({
                "title": pattern
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray((err, docs) => {
                mongodb.close()
                if(err){
                    return callback(err)
                }

                callback(null, docs)
            })
        })
    })
}

module.exports = Post