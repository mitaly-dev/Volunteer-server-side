var jwt = require('jsonwebtoken');

module.exports = function(req,res,next){
    const authHead = req.headers.authorization
    if(!authHead){
      return  res.status(401).send("unAuthorized user")
    }
    const token = authHead.split(' ')[1]
    jwt.verify(token,process.env.TOKEN,function(err,decoded){
        if(err){
            return res.status(403).send("Forbidden user")
        }
        req.decoded = decoded
        next()
    })
}