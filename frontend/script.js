async function pay() {
  const btn = document.getElementById("payBtn");
  const loader = document.getElementById("loader");
  const text = document.getElementById("btnText");

  loader.style.display = "block";
  text.innerText = "Processing...";

  const phone = document.getElementById("phone").value;
  const amount = document.getElementById("amount").value;

  const res = await fetch("https://chequematez.co.ke/pay", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ phone, amount })
  });

  const data = await res.json();

  if (data.success) {
    checkStatus(data.ref, phone, amount);
  } else {
    alert("Payment failed");
  }
}

async function checkStatus(ref, phone, amount) {

  const interval = setInterval(async () => {

    const res = await fetch(`https://chequematez.co.ke/status/${ref}`);
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

      const verify = `https://chequematez.co.ke/verify/${ref}`;
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