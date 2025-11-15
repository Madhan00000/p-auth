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

    // Check if user is already active
    if (user.tokenStatus === "active" && user.tokenExpiry && new Date(user.tokenExpiry) > new Date()) {
      await client.close();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Token is already active. No overwrite done.",
          tokenStatus: user.tokenStatus,
          expiresAt: user.tokenExpiry,
        }),
      };
    }

    // Only activate if inactive
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await users.updateOne(
      { email, tokenStatus: "inactive" },  // ensures overwrite happens ONLY if inactive
      {
        $set: {
          tokenStatus: "active",
          tokenExpiry: expiryTime,
        },
      }
    );

    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Verification successful! Token activated.",
        expiresAt: expiryTime,
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
