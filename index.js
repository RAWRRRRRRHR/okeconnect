require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { createQRIS } = require('./okeconnect');

const app = express();
app.use(express.json());

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
let users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Selamat datang! Ketik /deposit <jumlah> untuk top up via QRIS.');
});

bot.onText(/\/deposit (\d+)/, async (msg, match) => {
  const userId = msg.from.id;
  const amount = parseInt(match[1]);

  try {
    const { qris_image_url, invoice_id } = await createQRIS(amount, userId);
    bot.sendPhoto(msg.chat.id, qris_image_url, {
      caption: `Silakan bayar Rp${amount} ke QRIS ini.\nInvoice: ${invoice_id}`
    });
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, '❌ Gagal membuat QRIS.');
  }
});

app.post('/webhook', (req, res) => {
  const { external_id, status, amount } = req.body;

  if (status === 'PAID') {
    const userId = extractUserIdFromInvoice(external_id);
    if (!userId) return res.sendStatus(400);

    if (!users[userId]) users[userId] = { saldo: 0 };
    users[userId].saldo += parseInt(amount);
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

    bot.sendMessage(userId, `✅ Deposit Rp${amount} berhasil!\nSaldo sekarang: Rp${users[userId].saldo}`);
  }

  res.sendStatus(200);
});

function extractUserIdFromInvoice(invoice) {
  const match = invoice.match(/user-(\d+)-/);
  return match ? match[1] : null;
}

app.get('/', (req, res) => res.send('Bot Telegram + QRIS OkeConnect aktif 🚀'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});