const jwt = require("jsonwebtoken");

const generateToken = (payload) => {

    return jwt.sign(

        payload,

        process.env.JWT_SECRET,

        {
            expiresIn: "1d"
        }
    );
};


const verifyJWT = (token) => {

    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );
};

module.exports = {
    generateToken,
    verifyJWT
};