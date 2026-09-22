const bcrypt = require("bcryptjs");

// In-Memory store for preview environment when MongoDB is offline
class MemoryId {
  constructor(id) {
    this.id = id || "id_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }
  toString() {
    return this.id;
  }
  toJSON() {
    return this.id;
  }
  valueOf() {
    return this.id;
  }
  equals(other) {
    return other && other.toString() === this.id;
  }
}

class MemoryQuery {
  constructor(dataPromise) {
    this.promise = Promise.resolve(dataPromise);
  }

  populate(path, select) {
    this.promise = this.promise.then((data) => {
      if (!data) return data;
      if (Array.isArray(data)) {
        return Promise.all(data.map((item) => populateItem(item, path, select)));
      }
      return populateItem(data, path, select);
    });
    return this;
  }

  sort(sortCriteria) {
    this.promise = this.promise.then((data) => {
      if (!Array.isArray(data)) return data;
      const sorted = [...data];
      if (sortCriteria) {
        const [field, order] = Object.entries(sortCriteria)[0] || [];
        if (field) {
          const dir = order === -1 || order === "desc" ? -1 : 1;
          sorted.sort((a, b) => {
            const valA = a[field] instanceof Date ? a[field].getTime() : (a[field] || 0);
            const valB = b[field] instanceof Date ? b[field].getTime() : (b[field] || 0);
            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
          });
        }
      }
      return sorted;
    });
    return this;
  }

  skip(count) {
    this.promise = this.promise.then((data) => {
      if (Array.isArray(data)) return data.slice(count);
      return data;
    });
    return this;
  }

  limit(count) {
    this.promise = this.promise.then((data) => {
      if (Array.isArray(data)) return data.slice(0, count);
      return data;
    });
    return this;
  }

  select(fields) {
    this.promise = this.promise.then((data) => {
      if (!data) return data;
      if (Array.isArray(data)) {
        return data.map((item) => filterFields(item, fields));
      }
      return filterFields(data, fields);
    });
    return this;
  }

  then(onFulfilled, onRejected) {
    return this.promise.then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.promise.catch(onRejected);
  }
}

function filterFields(item, fields) {
  if (!item) return item;
  const clone = typeof item.toObject === "function" ? item.toObject() : { ...item };
  if (!fields) return item;

  const fieldList = fields.split(" ").filter(Boolean);
  const isExclude = fieldList.some((f) => f.startsWith("-"));

  if (isExclude) {
    const excludes = fieldList.filter((f) => f.startsWith("-")).map((f) => f.slice(1));
    excludes.forEach((f) => delete clone[f]);
    return clone;
  }

  const result = { _id: clone._id };
  fieldList.forEach((f) => {
    result[f] = clone[f];
  });
  return result;
}

function populateItem(item, path, select) {
  if (!item) return item;

  if (
    path === "author" ||
    path === "sender" ||
    path === "receiver" ||
    path === "createdBy" ||
    path === "organizer"
  ) {
    const userId = item[path]?._id || item[path];
    const user = store.users.find((u) => u._id.toString() === userId?.toString());
    if (user) {
      item[path] = filterFields(user, select || "name email role profilePicture college");
    }
  } else if (path === "members" || path === "attendees") {
    const list = item[path];
    if (Array.isArray(list)) {
      item[path] = list.map((idOrObj) => {
        const uId = idOrObj?._id || idOrObj;
        const user = store.users.find((u) => u._id.toString() === uId?.toString());
        return user ? filterFields(user, select || "name email role profilePicture college") : idOrObj;
      });
    }
  } else if (path === "community") {
    const commId = item.community?._id || item.community;
    if (commId) {
      const community = store.communities?.find((c) => c._id.toString() === commId?.toString());
      if (community) {
        item.community = filterFields(community, select || "name category type");
      }
    }
  } else if (path === "parentComment") {
    const commentId = item.parentComment?._id || item.parentComment;
    if (commentId) {
      const comment = store.comments.find((c) => c._id.toString() === commentId?.toString());
      if (comment) {
        item.parentComment = { ...comment };
      }
    }
  }

  return item;
}

function createDoc(obj, collection) {
  const doc = {
    ...obj,
    _id: obj._id ? new MemoryId(obj._id.toString()) : new MemoryId(),
    createdAt: obj.createdAt || new Date(),
    updatedAt: obj.updatedAt || new Date(),
  };

  doc.save = async function () {
    this.updatedAt = new Date();
    const idx = collection.findIndex((item) => item._id.toString() === this._id.toString());
    if (idx !== -1) {
      collection[idx] = this;
    } else {
      collection.push(this);
    }
    return this;
  };

  doc.populate = async function (path, select) {
    return populateItem(this, path, select);
  };

  doc.toObject = function () {
    const copy = { ...this };
    delete copy.save;
    delete copy.populate;
    delete copy.toObject;
    return copy;
  };

  return doc;
}

// Initial Data Store
const defaultPasswordHash = bcrypt.hashSync("password123", 10);

const store = {
  users: [
    createDoc({
      _id: "660000000000000000000001",
      name: "Alex Johnson",
      email: "alex@campus.edu",
      password: defaultPasswordHash,
      role: "student",
      college: "Stanford University",
      branch: "Computer Science",
      year: "3",
      profilePicture: "",
      skills: ["React", "JavaScript", "Python"],
    }, []),
    createDoc({
      _id: "660000000000000000000002",
      name: "Ananya Sharma",
      email: "ananya@campus.edu",
      password: defaultPasswordHash,
      role: "student",
      college: "Design Institute",
      branch: "Interaction Design",
      year: "2",
      profilePicture: "",
      skills: ["UI/UX", "Figma", "Design Systems"],
    }, []),
    createDoc({
      _id: "660000000000000000000003",
      name: "Rohan Patel",
      email: "rohan@campus.edu",
      password: defaultPasswordHash,
      role: "student",
      college: "Institute of Technology",
      branch: "Information Technology",
      year: "4",
      profilePicture: "",
      skills: ["Node.js", "Docker", "AWS"],
    }, []),
  ],
  posts: [],
  comments: [],
  messages: [],
  communities: [],
  events: [],
};

// Seed initial communities
store.communities = [
  createDoc({
    _id: "990000000000000000000001",
    name: "Coding Club",
    description: "Official campus coding society. We organize weekly algorithm sprints, open-source workshops, web development bootcamps, and hackathons.",
    category: "Club",
    type: "public",
    avatar: "💻",
    createdBy: new MemoryId("660000000000000000000001"),
    members: [
      new MemoryId("660000000000000000000001"),
      new MemoryId("660000000000000000000002"),
      new MemoryId("660000000000000000000003"),
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 30),
  }, store.communities),
  createDoc({
    _id: "990000000000000000000002",
    name: "BCA Tech Circle",
    description: "Community for Bachelor of Computer Applications students to discuss assignments, share lecture notes, exam tips, and collaborate on projects.",
    category: "Course",
    type: "public",
    course: "BCA",
    avatar: "🎓",
    createdBy: new MemoryId("660000000000000000000002"),
    members: [
      new MemoryId("660000000000000000000002"),
      new MemoryId("660000000000000000000003"),
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 20),
  }, store.communities),
  createDoc({
    _id: "990000000000000000000003",
    name: "Placement Preparation Hub",
    description: "Prepare for campus placements and off-campus drives. Daily DSA problems, aptitude tests, resume reviews, and mock technical interviews.",
    category: "Interest",
    type: "public",
    avatar: "🚀",
    createdBy: new MemoryId("660000000000000000000003"),
    members: [
      new MemoryId("660000000000000000000001"),
      new MemoryId("660000000000000000000003"),
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 15),
  }, store.communities),
  createDoc({
    _id: "990000000000000000000004",
    name: "Maldahiya Campus Hub",
    description: "Connecting students across all departments at Maldahiya campus. Notice board, library hours, sports meetups, and fest announcements.",
    category: "Campus",
    type: "public",
    branch: "Maldahiya",
    avatar: "🏛️",
    createdBy: new MemoryId("660000000000000000000001"),
    members: [
      new MemoryId("660000000000000000000001"),
      new MemoryId("660000000000000000000002"),
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 10),
  }, store.communities),
  createDoc({
    _id: "990000000000000000000005",
    name: "VBSPU Student Network",
    description: "Pan-university collective for Veer Bahadur Singh Purvanchal University students. University circulars, exam schedules, and inter-college events.",
    category: "University",
    type: "public",
    university: "VBSPU",
    avatar: "🌐",
    createdBy: new MemoryId("660000000000000000000002"),
    members: [
      new MemoryId("660000000000000000000002"),
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 8),
  }, store.communities),
  createDoc({
    _id: "990000000000000000000006",
    name: "Hackathon & Innovators Club",
    description: "Form dream hackathon squads, share project ideas, find teammates for Smart India Hackathon and global developer challenges.",
    category: "Club",
    type: "public",
    avatar: "⚡",
    createdBy: new MemoryId("660000000000000000000001"),
    members: [
      new MemoryId("660000000000000000000001"),
      new MemoryId("660000000000000000000003"),
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 5),
  }, store.communities),
];

// Campus events store (initialized empty - real events come from database or user creation)
store.events = [];

// Seed initial posts
store.posts = [
  createDoc({
    _id: "770000000000000000000001",
    title: "UI/UX Sprint Workshop",
    content: "Finally wrapped up our UI/UX Sprint workshop! Such a talented bunch of creators in one room. Looking forward to the hackathon showcase next weekend.",
    category: "general",
    author: new MemoryId("660000000000000000000002"),
    imageUrl: "/uploads/posts/d8aaa9c0-775b-472a-8b6b-b2f2775c0143.jpg",
    likes: [new MemoryId("660000000000000000000001")],
    savedBy: [],
    commentsCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 5),
  }, store.posts),
  createDoc({
    _id: "770000000000000000000002",
    title: "Frontend Developers Wanted for Campus Hackathon",
    content: "We're looking for frontend developers to join our team for the upcoming Campus Hackathon. React experience is a huge plus! DM or drop a comment below.",
    category: "question",
    community: new MemoryId("990000000000000000000001"),
    author: new MemoryId("660000000000000000000001"),
    imageUrl: "",
    likes: [new MemoryId("660000000000000000000002"), new MemoryId("660000000000000000000003")],
    savedBy: [new MemoryId("660000000000000000000001")],
    commentsCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 18),
  }, store.posts),
  createDoc({
    _id: "770000000000000000000003",
    title: "Placement Prep: Algorithms & System Design Study Group",
    content: "Starting an evening study circle for FAANG placement prep focusing on graphs, DP, and distributed systems. Meeting every Tuesday and Thursday in the central library.",
    category: "discussion",
    community: new MemoryId("990000000000000000000003"),
    author: new MemoryId("660000000000000000000003"),
    imageUrl: "/uploads/posts/fde1fb0b-ba8c-4682-83ef-47ec9ceca79e.png",
    likes: [new MemoryId("660000000000000000000001")],
    savedBy: [],
    commentsCount: 0,
    createdAt: new Date(Date.now() - 3600000 * 48),
  }, store.posts),
  createDoc({
    _id: "770000000000000000000004",
    title: "Semester 4 DBMS & Web Tech Notes Compiled",
    content: "Hey BCA folks! I have uploaded the combined question bank and handwritten notes for DBMS and Web Technologies in our shared drive. Check it out and let me know if any topic is missing!",
    category: "announcement",
    community: new MemoryId("990000000000000000000002"),
    author: new MemoryId("660000000000000000000002"),
    imageUrl: "",
    likes: [new MemoryId("660000000000000000000001")],
    savedBy: [],
    commentsCount: 0,
    createdAt: new Date(Date.now() - 3600000 * 8),
  }, store.posts),
];

// Seed initial comments
store.comments = [
  createDoc({
    _id: "880000000000000000000001",
    content: "Amazing work everyone! The design sprint prototypes were truly inspiring.",
    author: new MemoryId("660000000000000000000001"),
    post: new MemoryId("770000000000000000000001"),
    likes: [new MemoryId("660000000000000000000002")],
    parentComment: null,
    createdAt: new Date(Date.now() - 3600000 * 3),
  }, store.comments),
  createDoc({
    _id: "880000000000000000000002",
    content: "Thanks Alex! Can't wait for the next sprint in the spring semester!",
    author: new MemoryId("660000000000000000000002"),
    post: new MemoryId("770000000000000000000001"),
    likes: [],
    parentComment: new MemoryId("880000000000000000000001"),
    createdAt: new Date(Date.now() - 3600000 * 2),
  }, store.comments),
  createDoc({
    _id: "880000000000000000000003",
    content: "Hey Alex! I have experience building React + Tailwind apps. Would love to join the team!",
    author: new MemoryId("660000000000000000000002"),
    post: new MemoryId("770000000000000000000002"),
    likes: [],
    parentComment: null,
    createdAt: new Date(Date.now() - 3600000 * 12),
  }, store.comments),
];

// Memory User Model
const MemoryUser = {
  findOne(query) {
    return new MemoryQuery(
      new Promise((resolve) => {
        if (!query) return resolve(null);
        if (query.email) {
          const user = store.users.find(
            (u) => u.email.toLowerCase() === query.email.toLowerCase()
          );
          return resolve(user || null);
        }
        resolve(null);
      })
    );
  },

  findById(id) {
    return new MemoryQuery(
      new Promise((resolve) => {
        const idStr = id?._id ? id._id.toString() : id?.toString();
        const user = store.users.find((u) => u._id.toString() === idStr);
        resolve(user || null);
      })
    );
  },

  find(query) {
    return new MemoryQuery(
      new Promise((resolve) => {
        let results = [...store.users];
        if (query?.$or) {
          results = results.filter((user) => {
            return query.$or.some((condition) => {
              const [field, pattern] = Object.entries(condition)[0] || [];
              if (!field || !pattern?.$regex) return false;
              const val = user[field] || "";
              return new RegExp(pattern.$regex, pattern.$options || "i").test(val);
            });
          });
        }
        resolve(results);
      })
    );
  },

  async create(data) {
    const user = createDoc(
      {
        ...data,
        role: data.role || "student",
        skills: data.skills || [],
        profilePicture: data.profilePicture || "",
      },
      store.users
    );
    store.users.push(user);
    return user;
  },
};

// Memory Post Model
const MemoryPost = {
  find(query) {
    return new MemoryQuery(
      new Promise((resolve) => {
        let results = [...store.posts];
        if (query?.community) {
          const commId = (query.community?._id || query.community).toString();
          results = results.filter((p) => {
            const pCommId = (p.community?._id || p.community)?.toString();
            return pCommId === commId;
          });
        }
        if (query?.savedBy) {
          const savedId = query.savedBy.toString();
          results = results.filter((p) =>
            p.savedBy?.some((u) => u.toString() === savedId)
          );
        } else if (query?.$or) {
          results = results.filter((post) => {
            return query.$or.some((condition) => {
              const [field, pattern] = Object.entries(condition)[0] || [];
              if (!field || !pattern?.$regex) return false;
              const val = post[field] || "";
              return new RegExp(pattern.$regex, pattern.$options || "i").test(val);
            });
          });
        }
        resolve(results);
      })
    );
  },

  findById(id) {
    return new MemoryQuery(
      new Promise((resolve) => {
        const idStr = id?._id ? id._id.toString() : id?.toString();
        const post = store.posts.find((p) => p._id.toString() === idStr);
        resolve(post || null);
      })
    );
  },

  async create(data) {
    const post = createDoc(
      {
        ...data,
        community: data.community
          ? data.community instanceof MemoryId
            ? data.community
            : new MemoryId(data.community.toString())
          : null,
        likes: [],
        savedBy: [],
        commentsCount: 0,
      },
      store.posts
    );
    store.posts.unshift(post);
    return post;
  },

  async countDocuments() {
    return store.posts.length;
  },

  async findByIdAndDelete(id) {
    const idStr = id?._id ? id._id.toString() : id?.toString();
    const idx = store.posts.findIndex((p) => p._id.toString() === idStr);
    if (idx !== -1) {
      const [deleted] = store.posts.splice(idx, 1);
      return deleted;
    }
    return null;
  },

  async findByIdAndUpdate(id, update) {
    const idStr = id?._id ? id._id.toString() : id?.toString();
    const post = store.posts.find((p) => p._id.toString() === idStr);
    if (post && update?.$inc?.commentsCount) {
      post.commentsCount = Math.max(0, (post.commentsCount || 0) + update.$inc.commentsCount);
    }
    return post;
  },
};

// Memory Comment Model
const MemoryComment = {
  find(query) {
    return new MemoryQuery(
      new Promise((resolve) => {
        let results = [...store.comments];
        if (query?.post) {
          const postIdStr = query.post.toString();
          results = results.filter((c) => c.post?.toString() === postIdStr);
        }
        resolve(results);
      })
    );
  },

  findById(id) {
    return new MemoryQuery(
      new Promise((resolve) => {
        const idStr = id?._id ? id._id.toString() : id?.toString();
        const comment = store.comments.find((c) => c._id.toString() === idStr);
        resolve(comment || null);
      })
    );
  },

  async create(data) {
    const comment = createDoc(
      {
        ...data,
        likes: [],
        parentComment: data.parentComment ? new MemoryId(data.parentComment.toString()) : null,
      },
      store.comments
    );
    store.comments.push(comment);
    return comment;
  },

  async findByIdAndDelete(id) {
    const idStr = id?._id ? id._id.toString() : id?.toString();
    const idx = store.comments.findIndex((c) => c._id.toString() === idStr);
    if (idx !== -1) {
      const [deleted] = store.comments.splice(idx, 1);
      return deleted;
    }
    return null;
  },

  async deleteMany(query) {
    if (query?.post) {
      const postIdStr = query.post.toString();
      store.comments = store.comments.filter((c) => c.post?.toString() !== postIdStr);
    }
    return { acknowledged: true };
  },
};

// Memory Message Model
const MemoryMessage = {
  find(query) {
    return new MemoryQuery(
      new Promise((resolve) => {
        let results = [...store.messages];
        if (query?.$or) {
          results = results.filter((msg) => {
            const msgSenderId = (msg.sender?._id ? msg.sender._id : msg.sender)?.toString();
            const msgReceiverId = (msg.receiver?._id ? msg.receiver._id : msg.receiver)?.toString();

            return query.$or.some((c) => {
              const querySenderId = (c.sender?._id ? c.sender._id : c.sender)?.toString();
              const queryReceiverId = (c.receiver?._id ? c.receiver._id : c.receiver)?.toString();

              const senderMatch = !querySenderId || msgSenderId === querySenderId;
              const receiverMatch = !queryReceiverId || msgReceiverId === queryReceiverId;
              return senderMatch && receiverMatch;
            });
          });
        }
        resolve(results);
      })
    );
  },

  findById(id) {
    return new MemoryQuery(
      new Promise((resolve) => {
        const idStr = id?._id ? id._id.toString() : id?.toString();
        const msg = store.messages.find((m) => m._id.toString() === idStr);
        resolve(msg || null);
      })
    );
  },

  async create(data) {
    const msg = createDoc(
      {
        ...data,
        isRead: false,
      },
      store.messages
    );
    store.messages.push(msg);
    return msg;
  },
};

// Memory Community Model
const MemoryCommunity = {
  find(query) {
    return new MemoryQuery(
      new Promise((resolve) => {
        let results = [...(store.communities || [])];
        if (query?.category && query.category !== "All") {
          results = results.filter(
            (c) => c.category?.toLowerCase() === query.category.toLowerCase()
          );
        }
        if (query?.$or) {
          results = results.filter((c) => {
            return query.$or.some((condition) => {
              const [field, pattern] = Object.entries(condition)[0] || [];
              if (!field || !pattern?.$regex) return false;
              const val = c[field] || "";
              return new RegExp(pattern.$regex, pattern.$options || "i").test(val);
            });
          });
        }
        resolve(results);
      })
    );
  },

  findById(id) {
    return new MemoryQuery(
      new Promise((resolve) => {
        const idStr = (id?._id ? id._id : id)?.toString();
        const community = (store.communities || []).find(
          (c) => c._id.toString() === idStr
        );
        resolve(community || null);
      })
    );
  },

  findOne(query) {
    return new MemoryQuery(
      new Promise((resolve) => {
        const communities = store.communities || [];
        if (query?.name) {
          if (query.name.$regex) {
            const reg = new RegExp(query.name.$regex, query.name.$options || "i");
            const found = communities.find((c) => reg.test(c.name));
            return resolve(found || null);
          }
          const found = communities.find(
            (c) => c.name.toLowerCase() === query.name.toLowerCase()
          );
          return resolve(found || null);
        }
        resolve(communities[0] || null);
      })
    );
  },

  async create(data) {
    const creatorId = data.createdBy?._id || data.createdBy;
    const initialMembers =
      Array.isArray(data.members) && data.members.length > 0
        ? data.members.map((m) =>
            m instanceof MemoryId ? m : new MemoryId(m.toString())
          )
        : [new MemoryId(creatorId.toString())];

    const community = createDoc(
      {
        ...data,
        category: data.category || "General",
        type: data.type || "public",
        members: initialMembers,
        createdBy: new MemoryId(creatorId.toString()),
      },
      store.communities
    );
    store.communities.unshift(community);
    return community;
  },

  async countDocuments() {
    return (store.communities || []).length;
  },
};

const MemoryEvent = {
  find(query = {}) {
    return new MemoryQuery(
      new Promise((resolve) => {
        let results = [...(store.events || [])];

        if (query.$or && Array.isArray(query.$or)) {
          results = results.filter((event) => {
            return query.$or.some((condition) => {
              const [field, pattern] = Object.entries(condition)[0] || [];
              if (!field || !pattern?.$regex) return false;
              const val = event[field] || "";
              return new RegExp(pattern.$regex, pattern.$options || "i").test(val);
            });
          });
        }

        if (query.category) {
          if (query.category.$regex) {
            const reg = new RegExp(query.category.$regex, query.category.$options || "i");
            results = results.filter((e) => reg.test(e.category));
          } else {
            results = results.filter(
              (e) => (e.category || "").toLowerCase() === query.category.toString().toLowerCase()
            );
          }
        }

        if (query.date) {
          if (query.date.$gte) {
            const gte = new Date(query.date.$gte).getTime();
            results = results.filter((e) => new Date(e.date).getTime() >= gte);
          }
          if (query.date.$lt) {
            const lt = new Date(query.date.$lt).getTime();
            results = results.filter((e) => new Date(e.date).getTime() < lt);
          }
        }

        resolve(results);
      })
    );
  },

  findById(id) {
    return new MemoryQuery(
      new Promise((resolve) => {
        const idStr = (id?._id ? id._id : id)?.toString();
        const event = (store.events || []).find((e) => e._id.toString() === idStr);
        resolve(event || null);
      })
    );
  },

  async findByIdAndDelete(id) {
    const idStr = (id?._id ? id._id : id)?.toString();
    const idx = (store.events || []).findIndex((e) => e._id.toString() === idStr);
    if (idx !== -1) {
      const deleted = store.events.splice(idx, 1)[0];
      return deleted;
    }
    return null;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const idStr = (id?._id ? id._id : id)?.toString();
    const event = (store.events || []).find((e) => e._id.toString() === idStr);
    if (!event) return null;
    Object.assign(event, update, { updatedAt: new Date() });
    return event;
  },

  async create(data) {
    const organizerId = data.organizer?._id || data.organizer;
    const initialAttendees =
      Array.isArray(data.attendees) && data.attendees.length > 0
        ? data.attendees.map((a) => (a instanceof MemoryId ? a : new MemoryId(a.toString())))
        : [new MemoryId(organizerId.toString())];

    const event = createDoc(
      {
        ...data,
        organizer: new MemoryId(organizerId.toString()),
        attendees: initialAttendees,
        date: data.date instanceof Date ? data.date : new Date(data.date),
      },
      store.events
    );
    store.events.unshift(event);
    return event;
  },

  async countDocuments() {
    return (store.events || []).length;
  },
};

module.exports = {
  User: MemoryUser,
  Post: MemoryPost,
  Comment: MemoryComment,
  Message: MemoryMessage,
  Community: MemoryCommunity,
  Event: MemoryEvent,
  store,
};
