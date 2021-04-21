const { Router } = require('express');
const User = require('../models/User.js');
const Tweet = require('../models/Tweet.js');
const router = Router();
const {registerValidation, loginValidation, tweetValidation} = require('./validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { restore } = require('../models/User.js');
const verify = require('./verifyToken');
const cookieParser = require('cookie-parser');


dotenv.config();
// router.get('/', function(req, res) {
//     res.render('pages/index.ejs')
// })

router.get('/createUser', function(req, res) {
    res.render('pages/createUser.ejs')
})
router.get('/login', function(req, res) {
    res.render('pages/login.ejs')
})
router.get('/logout', function(req, res) {

    res.cookie('authorised', '',
     {expires: new Date(Date.now() - 900000),
        httpOnly: true});

        res.render('pages/index.ejs')
})

router.get('/error', function(req, res) {
    res.render('pages/error.ejs')
})

router.get('/', async function(req, res) {
    res.render('pages/index.ejs')
})
router.get('/users', verify,  async function(req, res) {

    if(verify){
    let tweets = await Tweet.findAll({});
    let user = req.user.username;
    let data = {tweets, user};
   
    res.render('pages/users.ejs', data)
    }else{
    res.render('login');
    }

})


router.post('/createUser', async function(req, res) {
    const {error} = registerValidation(req.body);

    if(error) return res.status(400).send(error.details[0].message);

    //check if user already exist
    const usernameExist = await User.findOne({where: {username: req.body.username}});
    if(usernameExist) return res.status(400).send('username already exist. Choose Another');

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
    //create User
    let { username } = req.body;
    let user =    await User.create({
        username,
        password : hashedPassword,
        role: 'user'
    });
    
    // console.log( user.toJSON() )

    res.redirect('/login')
})
router.post('/login', async function(req, res) {
    const {error} = loginValidation(req.body);

    if(error) return res.status(400).send(error.details[0].message);

    //check if user already exist
    const user = await User.findOne({where: {username: req.body.username}});
    if(!user) return res.status(400).send('wrong username and password');

    //Password Correct
    const validPass= await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send('wrong username and password');

    //create and assign token
    let data = {
        username: user.username,
        role: user.role
    };
    const token = jwt.sign(data, process.env.TOKEN_SECRET);
    // res.header('authorised', token);
    // const date =  {expires: new Date(Date.now() + 900000), httpOnly: true};
     res.cookie('authorised', token, {expires: new Date(Date.now() + 900000), httpOnly: true});

    res.redirect('/users');
})


router.post('/createTweet', async function(req, res) {

    let token = req.cookies['authorised'];
    let { error } = req.body;
    if (error) return res.redirect('Please write something to tweet!');
    if (token && req.body.content) {
        
        let payload = await jwt.verify(token, process.env.TOKEN_SECRET);
        let user = await User.findOne({
            where: {username: payload.username}
        });
        let tweet = await Tweet.create({
                    content: req.body.content,
                    timeCreated: new Date(),
                    UserId: user.id,
                    username: user.username
                
                });
               

        res.redirect('/users');

    } else {
        res.send('Please Write something to tweet!');
    }
})



module.exports = router