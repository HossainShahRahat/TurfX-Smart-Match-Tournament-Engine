import { loginController, registerController } from "@/modules/auth/controller";

export async function registerPost(request) {
  return registerController(request);
}

export async function loginPost(request) {
  return loginController(request);
}
