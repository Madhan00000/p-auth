const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    tokenVerified: { type: Boolean, default: false },
    
  },
  { collection: 'users' } // Explicitly set collection name
);

module.exports = mongoose.model('User', userSchema);
