async function pay() {
  try {
    const btn = document.getElementById("payBtn");
    const loader = document.getElementById("loader");
    const text = document.getElementById("btnText");

    // UI loading state
    loader.style.display = "block";
    text.innerText = "Processing...";

    const phone = document.getElementById("phone").value;
    const amount = document.getElementById("amount").value;

    // Call backend
    const res = await fetch("https://genearapay.onrender.com/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phone, amount })
    });

    // Parse response
    const data = await res.json();

    // Handle failure
    if (!data.success) {
      console.error("Payment error:", data.error);
      alert("Payment failed: " + JSON.stringify(data.error));

      loader.style.display = "none";
      text.innerText = "Pay Now";
      return;
    }

    // 🔥 SHOW RECEIPT IMMEDIATELY
document.getElementById("emptyState").style.display = "none";
document.getElementById("receiptBox").classList.remove("hidden");

// Initial state (pending)
showReceipt(
  { mpesaReceipt: null, qr: null },
  data.ref,
  phone,
  amount,
  "PENDING"
);
    // Continue if success
    checkStatus(data.ref, phone, amount);
    currentRef = data.ref;
    currentPhone = phone;
    currentAmount = amount;

  } catch (err) {
    console.error("Fetch error:", err);
    alert("Network error. Please try again.");

    document.getElementById("loader").style.display = "none";
    document.getElementById("btnText").innerText = "Pay Now";
  }
}

async function checkStatus(ref, phone, amount) {
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    const res = await fetch(`https://genearapay.onrender.com/status/${ref}`);
    const data = await res.json();

    // ✅ SUCCESS
    if (data.status === "Success") {
      clearInterval(interval);
      showReceipt(data, ref, phone, amount, "SUCCESS");
    }

    // ❌ FAILED
    else if (data.status === "Failed") {
      clearInterval(interval);
      showReceipt(data, ref, phone, amount, "FAILED");
    }

    // ⏳ BACKEND TIMEOUT
    else if (data.status === "Timeout") {
      clearInterval(interval);
      showReceipt(data, ref, phone, amount, "TIMEOUT");
    }

    // ⏳ FRONTEND TIMEOUT (~30s)
    else if (attempts >= 10) {
      clearInterval(interval);
      showReceipt(
        { mpesaReceipt: null, qr: null },
        ref,
        phone,
        amount,
        "PENDING"
      );
    }

  }, 3000);
}
function showReceipt(data, ref, phone, amount, status) {
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("receiptBox").classList.remove("hidden");

  const date = new Date().toLocaleString();

  document.getElementById("rAmount").innerText = "KES " + amount;
  document.getElementById("rPhone").innerText = phone;
  document.getElementById("rReceipt").innerText =
    data.mpesaReceipt || "-";
  document.getElementById("rDate").innerText = date;
  document.getElementById("rRef").innerText = ref;

  const verify = `https://genearapay.onrender.com/verify/${ref}`;
  document.getElementById("verifyLink").innerText = verify;

  if (data.qr) {
    document.getElementById("qr").src = data.qr;
  }

  const statusEl = document.getElementById("rStatus");
const manualBtn = document.getElementById("manualPayBtn");
const instructions = document.getElementById("manualInstructions");

// 🔥 HEADER UI ELEMENTS
const title = document.getElementById("receiptTitle");
const sub = document.getElementById("receiptSub");
const icon = document.getElementById("statusIcon");

 if (status === "SUCCESS") {
  statusEl.innerText = "SUCCESS ✅";
  statusEl.style.color = "green";

  title.innerText = "Payment Successful";
  sub.innerText = "Your payment was successful";
  icon.style.background = "#2e7d32";

  manualBtn.style.display = "none";
  instructions.style.display = "none";
}
else if (status === "FAILED") {
  statusEl.innerText = "FAILED ❌";
  statusEl.style.color = "red";

  title.innerText = "Payment Failed";
  sub.innerText = "Something went wrong";
  icon.style.background = "red";

  manualBtn.style.display = "none";
  instructions.style.display = "none";
}
else if (status === "TIMEOUT") {
  statusEl.innerText = "TIMED OUT ⏳";
  statusEl.style.color = "orange";

  title.innerText = "Timed Out";
  sub.innerText = "Complete payment manually";
  icon.style.background = "orange";

  manualBtn.style.display = "block";
  instructions.style.display = "block";
}
else {
  statusEl.innerText = "AWAITING CONFIRMATION ⏳";
  statusEl.style.color = "orange";

  title.innerText = "Awaiting Payment";
  sub.innerText = "Complete payment manually if needed";
  icon.style.background = "orange";

  manualBtn.style.display = "block";
  instructions.style.display = "block";
}}