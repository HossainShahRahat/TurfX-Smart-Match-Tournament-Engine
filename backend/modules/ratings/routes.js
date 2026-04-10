import { submitMatchRatingsController } from "@/modules/ratings/controller";

export async function postMatchRatingsRoute(request, context) {
  return submitMatchRatingsController(request, context);
}
