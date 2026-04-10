import {
  createCommentController,
  createPostController,
  getFeedController,
  getPostByIdController,
  getPublicPlayerProfileController,
  likePostController,
} from "@/modules/social/controller";

export async function getFeedRoute(request) {
  return getFeedController(request);
}

export async function postRoute(request) {
  return createPostController(request);
}

export async function postLikeRoute(request) {
  return likePostController(request);
}

export async function postCommentRoute(request) {
  return createCommentController(request);
}

export async function getPostByIdRoute(request, context) {
  return getPostByIdController(request, context);
}

export async function getPublicPlayerProfileRoute(request, context) {
  return getPublicPlayerProfileController(request, context);
}
