// netlify/functions/verifyOtp.js
const { MongoClient } = require("mongodb");

let cachedClient = null;
async function connectDB() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

exports.handler = async (event) => {
  try {
    const { email, otp } = JSON.parse(event.body || "{}");

    if (!email || !otp) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email and OTP required" }) };
    }

    const client = await connectDB();
    const db = client.db("usersdb");
    const otps = db.collection("otps");

    const record = await otps.findOne({ email });

    if (!record) {
      return { statusCode: 400, body: JSON.stringify({ error: "OTP not found" }) };
    }

    if (record.otp !== otp) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid OTP" }) };
    }

    if (new Date(record.expiry) < new Date()) {
      // Delete expired OTP to clean up
      await otps.deleteOne({ email });
      return { statusCode: 400, body: JSON.stringify({ error: "OTP expired" }) };
    }

    // Valid — keep record if you want, but delete to avoid reuse
    await otps.deleteOne({ email });

    return { statusCode: 200, body: JSON.stringify({ verified: true }) };
  } catch (err) {
    console.error("verifyOtp error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "OTP verification failed" }) };
  }
};
