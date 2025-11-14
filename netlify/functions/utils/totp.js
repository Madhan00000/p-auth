// netlify/functions/utils/totp.js
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

async function generateSecret(email, appName = "MyApp") {
  const secret = speakeasy.generateSecret({
    name: `${appName} (${email})`,
    length: 20,
  });
  // secret.base32 and secret.otpauth_url are available
  return secret;
}

async function getQRCodeDataURL(otpauth_url) {
  // returns data URL PNG for <img src=... />
  return qrcode.toDataURL(otpauth_url);
}

function verifyToken(token, base32Secret, window = 1) {
  return speakeasy.totp.verify({
    secret: base32Secret,
    encoding: "base32",
    token,
    window,
  });
}

module.exports = {
  generateSecret,
  getQRCodeDataURL,
  verifyToken,
};
