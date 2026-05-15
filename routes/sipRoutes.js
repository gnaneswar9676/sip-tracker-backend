const express = require("express");

const router = express.Router();

const {

  createSIP,
//   getSIP,

  processSIP,

  getTransactions,

  getAllSIPs,

  getAllTransactions,

  pauseSIP,
  resumeSIP,
  cancelSIP,

} = require("../controllers/sipController");

const {

  authenticateUser,
  authorizeRole,

} = require("../middleware/authMiddleware");


// =========================
// CREATE SIP
// =========================

router.post(

  "/",

  authenticateUser,

  authorizeRole("INVESTOR"),

  createSIP
);


// =========================
// GET ALL SIPS
// =========================

router.get(

  "/",

  authenticateUser,

  authorizeRole("INVESTOR"),

  getAllSIPs
);


// =========================
// GET ALL TRANSACTIONS
// =========================

router.get(

  "/transactions/all",

  authenticateUser,

  authorizeRole("INVESTOR"),

  getAllTransactions
);


// =========================
// GET SIP BY ID
// =========================

// router.get(
//   "/:sipId",

//   authenticateUser,

//   authorizeRole("INVESTOR"),

//   getSIP
// );


// =========================
// PROCESS SIP
// =========================

router.post(

  "/:sipId/process",

  authenticateUser,

  authorizeRole("INVESTOR"),

  processSIP
);


// =========================
// SIP TRANSACTIONS
// =========================

router.get(

  "/:sipId/transactions",

  authenticateUser,

  authorizeRole("INVESTOR"),

  getTransactions
);


// =========================
// PAUSE SIP
// =========================

router.patch(

  "/:sipId/pause",

  authenticateUser,

  authorizeRole("INVESTOR"),

  pauseSIP
);


// =========================
// RESUME SIP
// =========================

router.patch(

  "/:sipId/resume",

  authenticateUser,

  authorizeRole("INVESTOR"),

  resumeSIP
);


// =========================
// CANCEL SIP
// =========================

router.patch(

  "/:sipId/cancel",

  authenticateUser,

  authorizeRole("INVESTOR"),

  cancelSIP
);


module.exports = router;