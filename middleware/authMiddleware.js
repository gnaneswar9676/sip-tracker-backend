const { verifyJWT } = require("../utility/authManager");

const {
    errorResponse
} = require("../utility/responseHandler");

const authenticateUser = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return errorResponse(res, 401, "Token missing");
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return errorResponse(res, 401, "Invalid token format");
        }

        const decoded = verifyJWT(token);

        req.user = decoded;

        next();
    } catch (error) {
        return errorResponse(
            res,
            401,
            "Invalid or expired token"
        );
    }
};

const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return errorResponse(
                res,
                403,
                "Access denied"
            );
        }

        next();
    };
};

module.exports = {
    authenticateUser,
    authorizeRole
};