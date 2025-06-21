require('dotenv').config(); // <-- make sure this is at the top
const TelegramBot = require('node-telegram-bot-api');
const QRCode = require('qrcode');
const sharp = require('sharp');
const path = require('path');

// Load bot token from .env
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN not found in .env file');
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const baseImagePath = path.join(__dirname, 'random.jpeg');

// Function to generate the image
async function generateQRCodeImage(walletAddress) {
  try {
    const qrSvg = await QRCode.toString(walletAddress, {
      type: 'svg',
      width: 235,
      height: 245,
      margin: 0,
      color: {
        dark: '#000000FF',
        light: '#FFFFFFFF',
      },
    });

    const rotatedQrBuffer = await sharp(Buffer.from(qrSvg))
      .rotate(12, {
        background: { r: 255, g: 255, b: 255 },
      })
      .toBuffer();

    const finalImage = await sharp(baseImagePath)
      .composite([{ input: rotatedQrBuffer, top: 422, left: 627 }])
      .jpeg()
      .toBuffer();

    return finalImage;
  } catch (error) {
    console.error('Failed to generate QR image:', error);
    throw new Error('QR image generation failed');
  }
}

// Telegram command handler
bot.onText(/\/sendqr (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const walletAddress = match[1];

  try {
    const imageBuffer = await generateQRCodeImage(walletAddress);

    await bot.sendPhoto(chatId, imageBuffer, {
      caption: `🧾 QR Code for Wallet:\n${walletAddress}`,
    });
  } catch (err) {
    console.error(err);
    await bot.sendMessage(chatId, '❌ Failed to generate QR code image.');
  }
});
