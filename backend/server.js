require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const pool = require("./db");
const { getToken, getTimestamp, getPassword } = require("./mpesa");
const QRCode = require("qrcode");
const crypto = require("crypto");

const app = express();
app.use(cors({
  origin: [
    "https://chequematez.co.ke",
    "https://www.chequematez.co.ke"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Geneara Pay API Live ✅");
});

/* CREATE PAYMENT */
app.post("/pay", async (req, res) => {
  try {
    let { phone, amount } = req.body;

    // ✅ FIX PHONE FORMAT (PUT IT HERE)
    if (phone.startsWith("+")) {
      phone = phone.replace("+", "");
    }
    if (phone.startsWith("0")) {
      phone = "254" + phone.substring(1);
    }

    const ref = "GEN-" + Date.now();

    // 🔑 GET TOKEN
    const token = await getToken();

    // 🧪 DEBUG LOGS (PUT HERE)
    console.log("TOKEN:", token);
    console.log("PHONE:", phone);
    console.log("AMOUNT:", amount);

    // ⏱ CREATE ONE TIMESTAMP (VERY IMPORTANT)
    const timestamp = getTimestamp();

    // 🚀 STK PUSH (REPLACE your old axios.post with this)
    const stk = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: process.env.SHORTCODE,
        Password: getPassword(timestamp), // ✅ SAME timestamp
        Timestamp: timestamp,             // ✅ SAME timestamp
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.CALLBACK_URL,
        AccountReference: "GenearaPay",
        TransactionDesc: "Payment",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("STK RESPONSE:", stk.data);
    
    const checkoutId = stk.data.CheckoutRequestID;

    // SAVE TO DB
    await pool.query(
      `INSERT INTO transactions (ref, phone, amount, status, checkout_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [ref, phone, amount, "Pending", checkoutId]
    );

    res.json({ success: true, ref });

  } catch (err) {
    console.log("DARJA ERROR:", err.response?.data || err.message);

    res.json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

/* CALLBACK (GET TEST) */
app.get("/callback", (req, res) => {
  res.send("Callback endpoint is live ✅");
});

/* CALLBACK */
app.post("/callback", async (req, res) => {
  console.log("🔥 CALLBACK RECEIVED:", JSON.stringify(req.body, null, 2));
  try {
    const result = req.body.Body.stkCallback;

    const checkoutId = result.CheckoutRequestID;

    let receipt = null;

    const items = result.CallbackMetadata?.Item || [];

    items.forEach(i => {
      if (i.Name === "MpesaReceiptNumber") receipt = i.Value;
    });

    let status = "Pending";

if (result.ResultCode === 0) {
  status = "Success";
} else if (result.ResultCode === 1032) {
  status = "Cancelled"; // user cancelled
} else if (result.ResultCode === 1) {
  status = "Insufficient"; // insufficient funds
} else if (result.ResultCode === 2001) {
  status = "InvalidPIN";
} else if (result.ResultCode === 2002) {
  status = "ManualRequired"; // 🔥 YOUR CASE
} else {
  status = "Failed";
}
  await pool.query(
  `UPDATE transactions
   SET status=$1, mpesa_receipt=$2, result_code=$3
   WHERE checkout_id=$4`,
  [status, receipt, result.ResultCode, checkoutId]
);

    res.json({ ResultCode: 0 });

  } catch (err) {
    res.json({ ResultCode: 0 });
  }
});

/* STATUS */
app.get("/status/:ref", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM transactions WHERE ref=$1",
    [req.params.ref]
  );

  if (!rows.length) return res.json({ status: "Not found" });

  const tx = rows[0];

  const verifyUrl = `${process.env.BASE_URL}/verify/${tx.ref}`;

  const qr = await QRCode.toDataURL(verifyUrl);

res.json({
  status: tx.status,
  mpesaReceipt: tx.mpesa_receipt || null,
  qr
});
});
/* MANUAL VERIFY */
app.post("/manual-verify", async (req, res) => {
  try {
    let { ref, receipt } = req.body;

    // ❌ Missing data
    if (!ref || !receipt) {
      return res.json({ success: false, message: "Missing data" });
    }

    // 🔒 Normalize receipt
    receipt = receipt.trim().toUpperCase();

    // 🔒 Validate format (M-Pesa code)
    if (!/^[A-Z0-9]{8,12}$/.test(receipt)) {
      return res.json({ success: false, message: "Invalid receipt format" });
    }

    // 🚫 Prevent reuse
    const existing = await pool.query(
      "SELECT * FROM transactions WHERE mpesa_receipt=$1",
      [receipt]
    );

    if (existing.rows.length) {
      return res.json({ success: false, message: "Receipt already used" });
    }

    // ✅ Update transaction SAFELY
    const resultUpdate = await pool.query(
      `UPDATE transactions
       SET status='Success', mpesa_receipt=$1
       WHERE ref=$2 AND status != 'Success'
       RETURNING *`,
      [receipt, ref]
    );

    // ❌ If nothing updated
    if (!resultUpdate.rows.length) {
      return res.json({
        success: false,
        message: "Transaction not found or already completed"
      });
    }

    // ✅ Success
    res.json({ success: true });

  } catch (err) {
    console.log("Manual verify error:", err.message);
    res.json({ success: false });
  }
});


/* VERIFY PAGE */
app.get("/verify/:ref", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM transactions WHERE ref=$1",
    [req.params.ref]
  );

  if (!rows.length) {
    return res.send("❌ Invalid payment");
  }

  const tx = rows[0];

  res.send(`
    <h2>Payment Verified ✅</h2>
    <p>Amount: ${tx.amount}</p>
    <p>Phone: ${tx.phone}</p>
    <p>Receipt: ${tx.mpesa_receipt}</p>
    <p>Status: ${tx.status}</p>
  `);
});

app.listen(process.env.PORT, () =>
  console.log("Server running on port " + process.env.PORT)
);