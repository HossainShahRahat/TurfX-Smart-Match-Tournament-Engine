import connectToDatabase from "@/lib/db";
import "@/models/Comment";
import "@/models/PostLike";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import PostLike from "@/models/PostLike";

export async function createPost(payload) {
  await connectToDatabase();
  return Post.create(payload);
}

export async function findPostById(id, options = {}) {
  await connectToDatabase();

  let query = Post.findById(id);

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function findPost(filter = {}, options = {}) {
  await connectToDatabase();

  let query = Post.findOne(filter);

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function listPosts(filter = {}, options = {}) {
  await connectToDatabase();

  let query = Post.find(filter);

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.skip) {
    query = query.skip(options.skip);
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function updatePost(id, payload) {
  await connectToDatabase();
  return Post.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
}

export async function createComment(payload) {
  await connectToDatabase();
  return Comment.create(payload);
}

export async function listComments(filter = {}, options = {}) {
  await connectToDatabase();

  let query = Comment.find(filter).populate("userId", "name email role");

  if (options.sort) {
    query = query.sort(options.sort);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.lean) {
    return query.lean();
  }

  return query;
}

export async function countComments(filter = {}) {
  await connectToDatabase();
  return Comment.countDocuments(filter);
}

export async function createPostLike(payload) {
  await connectToDatabase();
  return PostLike.create(payload);
}

export async function countPostLikes(filter = {}) {
  await connectToDatabase();
  return PostLike.countDocuments(filter);
}
