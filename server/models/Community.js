const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      enum: ["Course", "Campus", "University", "Club", "Interest", "General"],
      default: "General",
    },
    type: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    avatar: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    college: {
      type: String,
      default: "",
    },
    branch: {
      type: String,
      default: "",
    },
    course: {
      type: String,
      default: "",
    },
    university: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const { Community: MemoryCommunity } = require("./inMemoryStore");
const MongooseCommunity =
  mongoose.models.Community || mongoose.model("Community", communitySchema);

module.exports = new Proxy(MongooseCommunity, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in MemoryCommunity) {
      return MemoryCommunity[prop];
    }
    return target[prop];
  },
  apply(target, thisArg, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.apply(target, thisArg, argumentsList);
    }
    return MemoryCommunity.create(...argumentsList);
  },
  construct(target, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.construct(target, argumentsList);
    }
    return MemoryCommunity.create(...argumentsList);
  },
});
