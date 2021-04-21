const jwt = require('jsonwebtoken');

module.exports = function(req, res, next){
    const token = req.cookies['authorised'];
    

    if(!token) return res.status(401).send('Access Denied! Please Log in or Create account');

    try{

        const varified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = varified;
        next();

    }catch (err){

        res.send('Invalid Token');
        
    }
}