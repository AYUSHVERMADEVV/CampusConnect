const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    // Users who liked this comment
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    parentComment: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Comment",
  default: null,
},
  },
  {
    timestamps: true,
  }
);

const { Comment: MemoryComment } = require("./inMemoryStore");
const MongooseComment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

module.exports = new Proxy(MongooseComment, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in MemoryComment) {
      return MemoryComment[prop];
    }
    return target[prop];
  },
  apply(target, thisArg, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.apply(target, thisArg, argumentsList);
    }
    return MemoryComment.create(...argumentsList);
  },
  construct(target, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.construct(target, argumentsList);
    }
    return MemoryComment.create(...argumentsList);
  },
});
