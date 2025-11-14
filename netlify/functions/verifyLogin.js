const { MongoClient } = require("mongodb");
const speakeasy = require("speakeasy");

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
    const body = JSON.parse(event.body || "{}");
    const { email, password, code } = body;

    if (!email || !password || !code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing email, password or code" }),
      };
    }

    const client = await connectDB();
    const db = client.db("usersdb");
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    if (user.password !== password) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid password" }),
      };
    }

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: "base32",
      token: code,
      window: 1, // allow slight time difference
    });

    if (!verified) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid code" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Login successful" }),
    };
  } catch (err) {
    console.error("verifyLogin error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Login failed" }),
    };
  }
};
