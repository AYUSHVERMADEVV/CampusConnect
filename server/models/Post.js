const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: String,
      enum: ["question", "discussion", "announcement", "general"],
      default: "general",
    },

    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      default: null,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const { Post: MemoryPost } = require("./inMemoryStore");
const MongoosePost = mongoose.models.Post || mongoose.model("Post", postSchema);

module.exports = new Proxy(MongoosePost, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in MemoryPost) {
      return MemoryPost[prop];
    }
    return target[prop];
  },
  apply(target, thisArg, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.apply(target, thisArg, argumentsList);
    }
    return MemoryPost.create(...argumentsList);
  },
  construct(target, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.construct(target, argumentsList);
    }
    return MemoryPost.create(...argumentsList);
  },
});

