const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async (req,res,next)=>{
    try{
        const token =  req.header('Authorization').replace('Bearer ','');
        const payload = jwt.verify(token,process.env.JWT_SECRET);
        const user = await User.findOne({_id:payload.id,'tokens.token':token});
        if(user)
        {
            req.user = user;
            req.token = token;
            next();
        } 
        else
            throw new Error();
    }catch(error){
        res.status(401).send({error:"unauthorized access"});
    }
   
}