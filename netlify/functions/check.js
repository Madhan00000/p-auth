const mongoose = require('mongoose');
const User = require('../../models/User');

let isConnected = false;

module.exports.handler = async (event) => {
  const userId = event.path.split("/").pop();

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
    const user = await User.findOne({ userId });

    return {
      statusCode: 200,
      body: JSON.stringify({
        exists: !!user,
        tokenVerified: user?.tokenVerified || false,
      }),
    };
  } catch (error) {
    console.error("❌ DB read error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error", error: error.message }),
    };
  }
};
