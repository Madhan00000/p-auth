// /netlify/functions/registerUser.js
const { MongoClient } = require("mongodb");
const crypto = require("crypto");

exports.handler = async (event) => {
  try {
    const { email, referralCode } = JSON.parse(event.body || "{}");

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email is required" }),
      };
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("usersdb");
    const users = db.collection("users");

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      await client.close();
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "User already exists" }),
      };
    }

    // Generate referral code for new user
    const newReferralCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    const newUser = {
      email,
      referralCode: newReferralCode,
      referredUsers: [],
      tokenStatus: "inactive",
      tokenExpiry: null,
      referralApplied: !!referralCode,
      createdAt: new Date(),
    };

    // ✅ If referral code was entered
    if (referralCode) {
      const referrer = await users.findOne({ referralCode });

      if (referrer) {
        const now = new Date();
        const currentExpiry = referrer.tokenExpiry ? new Date(referrer.tokenExpiry) : now;
        const baseTime = currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(baseTime.getTime() + 10 * 60 * 1000);

        // Add this new user to referrer’s referredUsers & extend expiry
        await users.updateOne(
          { referralCode },
          {
            $push: { referredUsers: email },
            $set: {
              tokenStatus: "active",
              tokenExpiry: newExpiry,
            },
          }
        );
      }
    }

    // Save new user
    await users.insertOne(newUser);
    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User registered successfully",
        referralCode: newReferralCode,
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
