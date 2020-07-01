const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const router = new express.Router();

router.post('/tasks',auth, async (req,res)=>{
    try{
        const task = new Task({...req.body,owner:req.user._id});
        await task.save();
        res.status(201).send(task);
    }catch(error){
        res.status(400).send(error)
    }
});

router.get('/tasks',auth, async (req,res)=>{
    const match = {};
    if( req.query.completed)
    {
        if( req.query.completed==='true')
            match.completed=true;
        else
            match.completed=false;
    }
    const sort = {};
    if(req.query.sortBy)
    {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'asc' ? 1:-1;
    }
    try{
        await req.user.populate({
            path:'tasks',
            match,
            options:{
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate(); 
        res.send(req.user.tasks);
    }catch(error){
        res.status(500).send();
    }
});

router.get('/tasks/:id',auth, async (req,res)=>{
    try{
        const _id = req.params.id;
        const task = await Task.findOne({_id,owner:req.user._id});
        if(task)
            res.send(task);
        else
            res.status(404).send();
    }catch(error){
        res.status(500).send()
    }
});

router.patch('/tasks/:id',auth, async (req,res)=>{
    const allowedUpdates = ['completed','description'];
    const updates = Object.keys(req.body);
    const isAllowed = updates.every(update => allowedUpdates.includes(update));

    if(!isAllowed)
        res.status(400).send({error:'invalid updates'});
    else{
        try{
            const task = await Task.findOne({_id:req.params.id,owner:req.user._id});
            if(task)
            {
                updates.forEach(update => task[update] = req.body[update]);
                task.save();
                res.send(task);
            } 
            else
                res.status(404).send();
        }catch(error){
            res.status(400).send(error);
        }   
    }
});

router.delete('/tasks/:id',auth,async (req,res) => {
    try{
        const task = await Task.findOne({_id:req.params.id,owner:req.user._id});
        if(task)
        {
            await task.remove();
            res.send(task);
        }  
        else
            res.status(404).send();
    }catch(error){
        res.status(500).send(error);
    }
})

const upload = multer({
    limits:{
        fileSize:1000000
    },
    fileFilter(req,file,cb){
        if(file.originalname.match(/\.(jpg|jpeg|png)$/))
            cb(undefined,true);
        else
            cb(new Error('upload an image'));
    }
});

router.post('/users/me/avatar',auth,upload.single('avatar'), async (req,res)=>{
    req.user.avatar = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer() ;
    await req.user.save();
    res.send();
},(error,req,res,next)=>{
    res.status(400).send({error:error.message})
});

router.delete('/users/me/avatar',auth,async (req,res)=>{
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

router.get('/users/:id/avatar', async (req,res)=>{
    try{
        const id = req.params.id;
        const user = await User.findById(id);
        if(user && user.avatar)
        {
            res.set('Content-Type','image/png');
            res.send(user.avatar);
        }
        else
            res.status(404).send();
    }catch(error){
        res.status(500).send();
    }
    
});

module.exports = router;