const express = require("express");

const router = express.Router();

const {
    createSIP,
    getSIP,
    processSIP,
    getTransactions
} = require("../controllers/sipController");

const {
    authenticateUser,
    authorizeRole
} = require("../middleware/authMiddleware");


// CREATE SIP
router.post(
    "/",

    authenticateUser,

    authorizeRole("INVESTOR"),

    createSIP
);


// GET SIP
router.get(
    "/:sipId",

    authenticateUser,

    authorizeRole("INVESTOR"),

    getSIP
);


// PROCESS SIP
router.post(
    "/:sipId/process",

    authenticateUser,

    authorizeRole("INVESTOR"),

    processSIP
);


// SIP TRANSACTIONS
router.get(
    "/:sipId/transactions",

    authenticateUser,

    authorizeRole("INVESTOR"),

    getTransactions
);

module.exports = router;