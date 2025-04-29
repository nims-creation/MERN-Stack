import mongoose from "mongoose";

const twoFactorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true
  },
  secret: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  backupCodes: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TwoFactor = mongoose.model("TwoFactor", twoFactorSchema);

export default TwoFactor; 