const axios = require("axios");

/* 🔑 GET ACCESS TOKEN */
async function getToken() {
  const url =
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const auth = Buffer.from(
    `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`
  ).toString("base64");

  const res = await axios.get(url, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  return res.data.access_token;
}

/* ⏱ TIMESTAMP */
function getTimestamp() {
  const d = new Date();

  const YYYY = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
}

/* 🔐 PASSWORD (must use SAME timestamp) */
function getPassword(timestamp) {
  const str = process.env.SHORTCODE + process.env.PASSKEY + timestamp;
  return Buffer.from(str).toString("base64");
}

module.exports = { getToken, getTimestamp, getPassword };