const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const mail = require('../emails/account');
const router = new express.Router();

router.post('/users', async (req,res)=>{
   
    try{
        const user = new User(req.body);
        mail.sendWelcomemail(user.email,user.name);
        const token = await user.generateToken();
        await user.save();
        res.status(201).send({user,token});
    }catch(error){
        res.status(400).send({error:error.message});
    }
});

router.get('/users/me',auth,(req,res)=>{
    res.send(req.user);
});

router.post('/users/logout',auth, async (req,res)=>{
    try{
        const user = req.user;
        user.tokens =  user.tokens.filter(token => token.token!=req.token);
        await user.save();
        res.send();
    }catch(error){
        res.status(500).send();
    }  
});

router.post('/users/logoutAll',auth, async (req,res)=>{
    try{
        const user = req.user;
        user.tokens = [];
        await user.save();
        res.send();
    }catch(error){
        res.status(500).send();
    }  
});

router.patch('/users/me',auth, async (req,res)=>{
    const allowedUpdates = ['name','age','password','email'];
    const updates = Object.keys(req.body);
    const isAllowed = updates.every(update => allowedUpdates.includes(update));

    if(!isAllowed)
        res.status(400).send({error:'invalid updates'});
    else{
        try{
            const user = req.user;
            updates.forEach(update => user[update] = req.body[update]);
            await user.save();
            res.send(user);
        }catch(error){
            res.status(400).send(error);
        }   
    }
});

router.delete('/users/me',auth,async (req,res) => {
    try{
        mail.sendLastmail(req.user.email,req.user.name);
        await req.user.remove();
        res.send(req.user);
    }catch(error){
        res.status(500).send(error);
    }
});

router.post('/users/login', async (req,res)=>{
    try{
        const user = await User.findUserWithCredentials(req.body.email,req.body.password);
        const token = await user.generateToken();
        if(user)
            res.send({user,token});
        else
            res.status(400).send();
    }catch(error){
        res.status(400).send({error:error.message});
    }
    
});

module.exports = router;