async function pay() {
  try {
    const loader = document.getElementById("loader");
    const text = document.getElementById("btnText");

    loader.style.display = "block";
    text.innerText = "Processing...";

    const phone = document.getElementById("phone").value;
    const amount = document.getElementById("amount").value;

    const res = await fetch("https://genearapay.onrender.com/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phone, amount })
    });

    const data = await res.json();

    if (!data.success) {
      alert("Payment failed: " + JSON.stringify(data.error));
      loader.style.display = "none";
      text.innerText = "Pay Now";
      return;
    }

    // ✅ SHOW RECEIPT IMMEDIATELY
    document.getElementById("emptyState").style.display = "none";

    const receiptBox = document.getElementById("receiptBox");
    receiptBox.classList.remove("hidden");
    receiptBox.style.display = "block";

    // ✅ SHOW MANUAL FLOW IMMEDIATELY
    document.getElementById("manualInstructions").style.display = "block";

    showReceipt(
      { mpesaReceipt: null, qr: null },
      data.ref,
      phone,
      amount,
      "PENDING"
    );

    // 🔥 USE SMART CHECK (REPLACE OLD checkStatus)
    smartCheckStatus(data.ref, phone, amount);

  } catch (err) {
    alert("Network error");

    document.getElementById("loader").style.display = "none";
    document.getElementById("btnText").innerText = "Pay Now";
  }
}

async function smartCheckStatus(ref, phone, amount) {
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

    // 🔥 AUTO SWITCH TO MANUAL
  else if (
  data.status === "ManualRequired" ||
  data.status === "Timeout" ||
  attempts >= 10
) {
  clearInterval(interval);

  // 🔥 FORCE MANUAL MODE
  document.getElementById("manualInstructions").style.display = "block";

  showReceipt(
    data,
    ref,
    phone,
    amount,
    "ManualRequired"
  );

      document.getElementById("manualInstructions").style.display = "block";
    }

  }, 3000);
}
function showReceipt(data, ref, phone, amount, status) {
  const icon = document.getElementById("statusIcon");
  const title = document.getElementById("receiptTitle");
  const sub = document.getElementById("receiptSub");

  // 🎯 STATUS UI
  if (status === "SUCCESS") {
    icon.innerText = "✅";
    title.innerText = "Payment Successful";
    sub.innerText = "Transaction completed successfully";
  } 
  else if (status === "FAILED") {
    icon.innerText = "❌";
    title.innerText = "Payment Failed";
    sub.innerText = "Something went wrong";
  } 
  else if (status === "ManualRequired") {
    icon.innerText = "⚠️";
    title.innerText = "Manual Payment Required";
    sub.innerText = "Complete via M-Pesa and confirm below";
  } 
  else {
    icon.innerText = "⏳";
    title.innerText = "Processing Payment";
    sub.innerText = "Waiting for M-Pesa prompt...";
  }

  document.getElementById("rAmount").innerText = "KES " + amount;
  document.getElementById("rPhone").innerText = phone;
  document.getElementById("rReceipt").innerText = data.mpesaReceipt || "-";
  document.getElementById("rRef").innerText = ref;
  document.getElementById("rStatus").innerText = status;

  const verifyUrl = `https://genearapay.onrender.com/verify/${ref}`;
  document.getElementById("verifyLink").innerText = verifyUrl;
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
}
async function manualVerify() {
  const ref = document.getElementById("rRef").innerText;
  let receipt = document.getElementById("manualReceipt").value;

  if (!receipt) {
    alert("Enter M-Pesa code");
    return;
  }

  receipt = receipt.trim().toUpperCase();

  try {
    const res = await fetch("https://genearapay.onrender.com/manual-verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ref, receipt })
    });

    const data = await res.json();

    if (data.success) {
      showReceipt(
        { mpesaReceipt: receipt },
        ref,
        null,
        null,
        "SUCCESS"
      );
    } else {
      alert(data.message || "Verification failed");
    }

  } catch (err) {
    alert("Verification error");
  }
}