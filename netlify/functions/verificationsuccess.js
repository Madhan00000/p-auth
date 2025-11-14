// netlify/functions/verificationsuccess.js
const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  try {
    const email = event.queryStringParameters.email;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email required" }),
      };
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("usersdb");
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user) {
      await client.close();
      return { statusCode: 404, body: JSON.stringify({ error: "User not found" }) };
    }

    // ✅ Set 1-hour expiry for verified user
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 1);

    await users.updateOne(
      { email },
      { $set: { tokenStatus: "active", tokenExpiry: expiryTime.toISOString() } }
    );

    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User verified successfully",
        email,
        tokenStatus: "active",
        expiresAt: expiryTime,
      }),
    };
  } catch (err) {
    console.error("Verification error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};
