// /netlify/functions/getUserStatus.js
const { MongoClient } = require("mongodb");

exports.handler = async (event) => {
  try {
    const email = event.queryStringParameters.email;
    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email required" }) };
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

    let tokenStatus = user.tokenStatus;
    if (user.tokenExpiry && new Date() > new Date(user.tokenExpiry)) {
      tokenStatus = "inactive";
      await users.updateOne(
        { email },
        { $set: { tokenStatus: "inactive", tokenExpiry: null } }
      );
    }

    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        email: user.email,
        referralCode: user.referralCode,
        tokenStatus,
        tokenExpiry: user.tokenExpiry || null,
        referralApplied: user.referralApplied || false,
      }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};
