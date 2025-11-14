const mongoose = require('mongoose');
const User = require('../../models/User');

let isConnected = false;

module.exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const { userId, tokenVerified } = JSON.parse(event.body || '{}');

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing userId" }),
    };
  }

  if (!isConnected) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "MongoDB URI not found in environment" }),
      };
    }

    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      isConnected = true;
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "MongoDB connection failed", error: error.message }),
      };
    }
  }

  try {
    const user = await User.findOneAndUpdate(
      { userId },
      { tokenVerified: !!tokenVerified },
      { upsert: true, new: true }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User verified", user }),
    };
  } catch (error) {
    console.error("❌ DB write error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error", error: error.message }),
    };
  }
};
