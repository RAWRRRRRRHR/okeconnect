const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function createQRIS(amount, userId) {
  const invoiceId = `user-${userId}-${uuidv4()}`;

  const payload = {
    amount: amount.toString(),
    external_id: invoiceId,
    customer_name: `User-${userId}`,
    expired: 300,
    callback_url: "https://namaprojek.repl.co/webhook"
  };

  const res = await axios.post(
    "https://api.okeconnect.id/qris",
    payload,
    {
      headers: {
        'Authorization': `Bearer ${process.env.OKE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return {
    qris_image_url: res.data.data.qr_url,
    invoice_id: invoiceId
  };
}

module.exports = { createQRIS };