const jwt = require("jsonwebtoken")
const {jwt_secret} = require("../config")

function adminMiddleware(req, res, next) {
    try{
        const token = req.headers.authorization;
        const tokenActual = token.split(" ")[1];
        jwt.verify(tokenActual, jwt_secret)
        next(); 
    } catch(e){
        console.error(e);
        res.status(401).json({
            message: "Invalid username or password"
        })
    }
}

module.exports = adminMiddleware;