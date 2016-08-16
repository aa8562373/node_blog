let mongodb = require('./db')

function Comment(name, day, title, comment){
    this.name    = name
    this.day     = day
    this.title   = title
    this.comment = comment
}

//存储一条留言信息

Comment.prototype.save = function(callback) {
    let name    = this.name
        day     = this.day
        title   = this.title
        comment = this.comment
    
    console.log(this.comment)
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

            //通过用户名，时间及标题查找文档，并把一条留言对象添加到该文档的comments数据里
            collection.update({
                "name"     : name,
                "time.day": day,
                "title"    : title
            },{
                $push:{"comments" : comment}
            }, err =>{
                mongodb.close()
                if(err){
                    return callback(err)
                }
                callback(null)
            })
        })


    })


}





module.exports = Comment