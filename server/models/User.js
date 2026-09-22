const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["student", "club_admin", "admin"],
      default: "student",
    },

    college: {
      type: String,
      required: true,
    },

    branch: {
      type: String,
      required: true,
    },

    year: {
      type: String,
      required: true,
    },

    profilePicture: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const { User: MemoryUser } = require("./inMemoryStore");
const MongooseUser = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = new Proxy(MongooseUser, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in MemoryUser) {
      return MemoryUser[prop];
    }
    return target[prop];
  },
  apply(target, thisArg, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.apply(target, thisArg, argumentsList);
    }
    return MemoryUser.create(...argumentsList);
  },
  construct(target, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.construct(target, argumentsList);
    }
    return MemoryUser.create(...argumentsList);
  },
});
