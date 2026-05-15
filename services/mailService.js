const nodemailer =
  require("nodemailer");

const transporter =
  nodemailer.createTransport({

    service: "gmail",

    auth: {

      user:
        process.env.EMAIL_USER,

      pass:
        process.env.EMAIL_PASS,

    },

  });

async function sendResetEmail(
  email,
  resetLink
) {

  await transporter.sendMail({

    from:
      process.env.EMAIL_USER,

    to: email,

    subject:
      "FinTrack Password Reset",

    html: `
      <h2>Password Reset</h2>

      <p>
        Click below to reset password:
      </p>

      <a href="${resetLink}">
        Reset Password
      </a>
    `,

  });

}

module.exports = {
  sendResetEmail,
};