const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: [
        "Hackathon",
        "Workshop",
        "Seminar",
        "Cultural",
        "Sports",
        "Club",
        "Placement",
        "Academic",
        "Fest",
        "Other",
      ],
      default: "Other",
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    image: {
      type: String,
      default: "",
    },
    college: {
      type: String,
      default: "",
      trim: true,
    },
    branch: {
      type: String,
      default: "",
      trim: true,
    },
    course: {
      type: String,
      default: "",
      trim: true,
    },
    university: {
      type: String,
      default: "",
      trim: true,
    },
    capacity: {
      type: Number,
      default: null,
    },
    registrationRequired: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const { Event: MemoryEvent } = require("./inMemoryStore");
const MongooseEvent = mongoose.models.Event || mongoose.model("Event", eventSchema);

module.exports = new Proxy(MongooseEvent, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in MemoryEvent) {
      return MemoryEvent[prop];
    }
    return target[prop];
  },
  apply(target, thisArg, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.apply(target, thisArg, argumentsList);
    }
    return MemoryEvent.create(...argumentsList);
  },
  construct(target, argumentsList) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.construct(target, argumentsList);
    }
    return MemoryEvent.create(...argumentsList);
  },
});
