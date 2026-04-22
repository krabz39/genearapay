const axios = require("axios");

async function getToken() {
  const res = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      auth: {
        username: process.env.CONSUMER_KEY,
        password: process.env.CONSUMER_SECRET,
      },
    }
  );

  return res.data.access_token;
}

function getTimestamp() {
  const d = new Date();
  return d.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

function getPassword() {
  const str = process.env.SHORTCODE + process.env.PASSKEY + getTimestamp();
  return Buffer.from(str).toString("base64");
}

module.exports = { getToken, getTimestamp, getPassword };