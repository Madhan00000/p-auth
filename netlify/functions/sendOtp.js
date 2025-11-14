// netlify/functions/sendOtp.js
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");

let cachedClient = null;
async function connectDB() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

// --- SMTP TRANSPORTER (BREVO) ---
function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER, // Brevo login
      pass: process.env.SMTP_PASS, // Brevo SMTP key
    },
  });
}
// --------------------------------

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password, referralCode } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and password are required" }),
      };
    }

    const client = await connectDB();
    const db = client.db("usersdb");
    const otps = db.collection("otps");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await otps.updateOne(
      { email },
      {
        $set: {
          email,
          password,
          referralCode: referralCode || null,
          otp,
          expiry: expiry.toISOString(),
        },
      },
      { upsert: true }
    );

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Your verification OTP",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.4">
          <h3>Your verification code</h3>
          <p><strong>${otp}</strong></p>
          <p>This code expires in 5 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "OTP sent to email" }),
    };
  } catch (err) {
    console.error("sendOtp error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send OTP" }),
    };
  }
};
