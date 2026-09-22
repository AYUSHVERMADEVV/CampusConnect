const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const { Message: MemoryMessage } = require("./inMemoryStore");
const MongooseMessage = mongoose.models.Message || mongoose.model("Message", messageSchema);

module.exports = new Proxy(MongooseMessage, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in MemoryMessage) {
      return MemoryMessage[prop];
    }
    return target[prop];
  },
  apply(target, thisArg, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.apply(target, thisArg, argumentsList);
    }
    return MemoryMessage.create(...argumentsList);
  },
  construct(target, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.construct(target, argumentsList);
    }
    return MemoryMessage.create(...argumentsList);
  },
});
