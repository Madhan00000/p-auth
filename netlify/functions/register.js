// netlify/functions/register.js
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const { authenticator } = require("otplib");
const qrcode = require("qrcode");
const crypto = require("crypto");

// DB connection caching for Netlify functions
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
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const { action, email, password, token, referralCode } = body;

    if (!action) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing action" }) };
    }

    const client = await connectDB();
    const db = client.db("usersdb");
    const users = db.collection("users");
    const pending = db.collection("pending_registration");

    // ---------------------------
    // ACTION: init  (generate secret + QR)
    // ---------------------------
    if (action === "init") {
      if (!email || !password) {
        return { statusCode: 400, body: JSON.stringify({ error: "Email and password required" }) };
      }

      // Check if user already exists
      const existing = await users.findOne({ email });
      if (existing) {
        return { statusCode: 400, body: JSON.stringify({ error: "User already exists" }) };
      }

      // Generate TOTP secret and QR
      const secret = authenticator.generateSecret(); // base32
      const otpauth_url = authenticator.keyuri(email, "MyApp", secret);
      const qrDataURL = await qrcode.toDataURL(otpauth_url);

      // Hash password (store hashed in pending)
      const passwordHash = await bcrypt.hash(password, 10);

      // Save pending registration (temp)
      await pending.updateOne(
        { email },
        {
          $set: {
            email,
            passwordHash,
            totpSecret: secret,
            otpauth_url,
            referralCodeInput: referralCode || null,
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Scan the QR with an authenticator app and enter the code to verify.",
          qr: qrDataURL,
          manualKey: secret,
        }),
      };
    }

    // ---------------------------
    // ACTION: verify  (verify TOTP and create user)
    // ---------------------------
    if (action === "verify") {
      if (!email || !token) {
        return { statusCode: 400, body: JSON.stringify({ error: "Email and token required" }) };
      }

      // find pending registration
      const p = await pending.findOne({ email });
      if (!p) {
        return { statusCode: 400, body: JSON.stringify({ error: "No pending registration found" }) };
      }

      // verify token (allow +/- 1 time-step)
      authenticator.options = { window: 1 };
      const ok = authenticator.check(token, p.totpSecret);
      if (!ok) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid TOTP code" }) };
      }

      // Create user object
      const newReferralCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      const newUser = {
        email: p.email,
        passwordHash: p.passwordHash,
        totpSecret: p.totpSecret,
        referralCode: newReferralCode,
        referredUsers: [],
        tokenStatus: "inactive",
        tokenExpiry: null,
        referralApplied: false,
        createdAt: new Date().toISOString(),
      };

      // If the pending registration included a referral code, apply it
      if (p.referralCodeInput) {
        const referrer = await users.findOne({ referralCode: p.referralCodeInput });
        if (referrer) {
          // Add referred user to referrer's record
          await users.updateOne(
            { referralCode: p.referralCodeInput },
            { $addToSet: { referredUsers: p.email } }
          );

          // Extend referrer's token expiry by +10 minutes from existing expiry or now
          const now = new Date();
          const currentExpiry = referrer.tokenExpiry ? new Date(referrer.tokenExpiry) : now;
          const baseTime = currentExpiry > now ? currentExpiry : now;
          const newExpiry = new Date(baseTime.getTime() + 10 * 60 * 1000); // +10 minutes

          await users.updateOne(
            { referralCode: p.referralCodeInput },
            {
              $set: {
                tokenStatus: "active",
                tokenExpiry: newExpiry.toISOString(),
              },
            }
          );

          newUser.referralApplied = true;
        }
      }

      // Insert new user into users collection
      await users.insertOne(newUser);

      // Remove pending registration
      await pending.deleteOne({ email });

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Registered successfully",
          email: newUser.email,
          referralCode: newUser.referralCode,
        }),
      };
    }

    // Unknown action
    return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
  } catch (err) {
    console.error("register function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error", details: err.message }) };
  }
};
