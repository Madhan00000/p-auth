// /netlify/functions/verifyTokenStatus.js
// /netlify/functions/verifyTokenStatus.js
// /netlify/functions/verifyTokenStatus.js
const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body || "{}");

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

    const user = await users.findOne({ email });
    if (!user) {
      await client.close();
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    const now = new Date();
    const expiry = user.tokenExpiry ? new Date(user.tokenExpiry) : null;
    const isExpired = !expiry || expiry <= now;

    // ❌ If token is active and NOT expired → don't update
    if (user.tokenStatus === "active" && !isExpired) {
      await client.close();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Token already active. No update done.",
          tokenStatus: user.tokenStatus,
          expiresAt: user.tokenExpiry,
        }),
      };
    }

    // ✅ If inactive OR expired → activate + set new expiry
    const newExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await users.updateOne(
      { email },
      {
        $set: {
          tokenStatus: "active",
          tokenExpiry: newExpiry,
        },
      }
    );

    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Token activated (inactive or expired).",
        expiresAt: newExpiry,
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
