const mongoose = require('mongoose');
const validator = require('validator');
bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        validate(value) {
            if(!validator.isEmail(value))
                throw new Error('Invalid Email Address');
        }
    },
    password :{
        type:String,
        required:true,
        trim:true,
        minlength:7,
        validate(value){
            if(value.toLowerCase().includes('password'))
                throw new Error('password cannot contain "password"');
        }
    },
    age:{
        type:Number,
        default:0
    },
    avatar:{
        type:Buffer
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
},{
    timestamps:true
});

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
});

userSchema.methods.toJSON = function(){
    user = this;
    user = user.toObject();
    delete user.tokens;
    delete user.password;
    delete user.avatar;
    return user;
}

userSchema.methods.generateToken = async function(){
    const token = jwt.sign({id:this._id},process.env.JWT_SECRET,{expiresIn:'1 days'});
    this.tokens.push({token});
    await this.save();
    return token;
}

userSchema.statics.findUserWithCredentials = async (email,password) => {
    const user = await User.findOne({email});
    if(user)
    {
        if(await bcrypt.compare(password,user.password))
            return user;
        throw new Error('Wrong Password');
    }
    throw new Error('Email not registered');
}

userSchema.pre('save',async function(next){
    if(this.isModified('password'))
        this.password = await bcrypt.hash(this.password,8);
});

userSchema.pre('remove',async function(next){
    await Task.deleteMany({owner:this._id});
    next();
});

User = mongoose.model('User',userSchema);
module.exports = User;