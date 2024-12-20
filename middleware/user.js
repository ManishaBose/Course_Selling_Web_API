const jwt = require("jsonwebtoken")
const {jwt_secret} = require("../config")

function userMiddleware(req, res, next) {
    try{
        const token = req.headers.authorization;
        const tokenActual = token.split(" ")[1];
        const decoded = jwt.verify(tokenActual, jwt_secret)
        req.username = decoded.username;
        next(); 
    } catch(e){
        console.error(e);
        res.status(401).json({
            message: "Invalid username or password"
        })
    }
}

module.exports = userMiddleware;