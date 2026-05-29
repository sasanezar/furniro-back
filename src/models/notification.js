const mongoose = require("mongoose");
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);
const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: Number,
    unique: true,
  },
  userId: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const maxNotif = await this.constructor.findOne().sort("-notificationId");
      const maxId = maxNotif && maxNotif.notificationId ? maxNotif.notificationId : 0;

      let counter = await Counter.findOneAndUpdate(
        { name: "notificationId" },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );

      if (counter.value <= maxId) {
        counter = await Counter.findOneAndUpdate(
          { name: "notificationId" },
          { $set: { value: maxId + 1 } },
          { new: true }
        );
      }

      this.notificationId = counter.value;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Notification2", notificationSchema);
