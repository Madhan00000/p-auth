// netlify/functions/login.js
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

let cachedClient = null;
async function connectDB() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

// POST /.netlify/functions/login
// body: { email, password }
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email and password required" }) };
    }

    const client = await connectDB();
    const db = client.db("usersdb");
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    // login successful — you can return user info
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Login successful", email: user.email, referralCode: user.referralCode }),
    };
  } catch (err) {
    console.error("login error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};
