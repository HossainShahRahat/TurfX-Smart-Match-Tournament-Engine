import { POST_TYPES, USER_ROLES } from "@/config/constants";
import { authenticateRequest, authorizeRoles } from "@/middleware/auth";
import { errorResponse, successResponse } from "@/utils/api-response";

import {
  addCommentToPost,
  createPostEntry,
  generateFeed,
  getPlayerPublicProfile,
  getPostDetails,
  likePost,
} from "./service";
import {
  parseSocialRequestBody,
  validateCommentPayload,
  validateLikePayload,
  validateObjectId,
  validatePostPayload,
} from "./validator";

export async function getFeedController(request) {
  try {
    const user = authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    const feed = await generateFeed(user.id, { page, limit });
    return successResponse(feed, "Feed fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch feed.");
  }
}

export async function createPostController(request) {
  try {
    const user = authorizeRoles(request, [
      USER_ROLES.ADMIN,
      USER_ROLES.TURF_OWNER,
      USER_ROLES.PLAYER,
    ]);
    const body = await parseSocialRequestBody(request);

    validatePostPayload(body);

    const post = await createPostEntry({
      authorId: user.id,
      type: POST_TYPES.MANUAL_POST,
      title: body.title,
      content: body.content,
      media: Array.isArray(body.media) ? body.media : [],
      matchId: body.matchId || null,
      tournamentId: body.tournamentId || null,
      playerId: body.playerId || null,
      systemGenerated: false,
      metadata: {
        source: "manual",
      },
    });

    return successResponse(post, "Post created successfully.", 201);
  } catch (error) {
    return errorResponse(error, "Failed to create post.");
  }
}

export async function likePostController(request) {
  try {
    const user = authenticateRequest(request);
    const body = await parseSocialRequestBody(request);

    validateLikePayload(body);

    const post = await likePost(body.postId, user.id);
    return successResponse(post, "Post liked successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to like post.");
  }
}

export async function createCommentController(request) {
  try {
    const user = authenticateRequest(request);
    const body = await parseSocialRequestBody(request);

    validateCommentPayload(body);

    const result = await addCommentToPost(body.postId, user.id, body.text);
    return successResponse(result, "Comment added successfully.", 201);
  } catch (error) {
    return errorResponse(error, "Failed to add comment.");
  }
}

export async function getPostByIdController(_request, context) {
  try {
    const { id } = await context.params;
    validateObjectId(id, "post id");

    const post = await getPostDetails(id);
    return successResponse(post, "Post fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch post.");
  }
}

export async function getPublicPlayerProfileController(_request, context) {
  try {
    const { id } = await context.params;
    validateObjectId(id, "player id");

    const profile = await getPlayerPublicProfile(id);
    return successResponse(profile, "Player profile fetched successfully.");
  } catch (error) {
    return errorResponse(error, "Failed to fetch player profile.");
  }
}
