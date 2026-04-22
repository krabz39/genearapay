async function pay() {
  const btn = document.getElementById("payBtn");
  const loader = document.getElementById("loader");
  const text = document.getElementById("btnText");

  loader.style.display = "block";
  text.innerText = "Processing...";

  const phone = document.getElementById("phone").value;
  const amount = document.getElementById("amount").value;

  const res = await fetch("https://genearapay.onrender.com/pay", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ phone, amount })
  });

  if (!data.success) {
  console.error("Payment error:", data.error);
  alert("Payment failed: " + JSON.stringify(data.error));
  return;
}

  const data = await res.json();

  if (data.success) {
    checkStatus(data.ref, phone, amount);
  } else {
    alert("Payment failed");
  }
}

async function checkStatus(ref, phone, amount) {

  const interval = setInterval(async () => {

    const res = await fetch(`https://genearapay.onrender.com/status/${ref}`);
    const data = await res.json();

    if (data.status === "Success") {

      clearInterval(interval);

      document.getElementById("emptyState").style.display = "none";
      document.getElementById("receiptBox").classList.remove("hidden");

      const date = new Date().toLocaleString();

      document.getElementById("rAmount").innerText = "KES " + amount;
      document.getElementById("rPhone").innerText = phone;
      document.getElementById("rReceipt").innerText = data.mpesaReceipt;
      document.getElementById("rDate").innerText = date;
      document.getElementById("rRef").innerText = ref;

      const verify = `https://genearapay.onrender.com/verify/${ref}`;
      document.getElementById("verifyLink").innerText = verify;

      document.getElementById("qr").src = data.qr;

      const msg = `Geneara Pay Receipt ✅
Amount: KES ${amount}
Phone: ${phone}
Receipt: ${data.mpesaReceipt}

Verify: ${verify}`;

      document.getElementById("waLink").href =
        `https://wa.me/?text=${encodeURIComponent(msg)}`;

    }

  }, 3000);
}