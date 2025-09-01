import { Router } from "express";
import { UserController } from "../http/controllers";
import { UserService } from "../http/services";
import { FirebaseUserRepository } from "../repositories/FirebaseUserRepository";

const router = Router();
const userService = new UserService(new FirebaseUserRepository());
const controller = new UserController(userService);

router.post("", controller.createUser.bind(controller));
router.post("/login", controller.loginUser.bind(controller));
router.get("/:uid", controller.getUserByUid.bind(controller));
router.get("/email/:email", controller.getUserByEmail.bind(controller));
router.put("/:uid", controller.updateUser.bind(controller));
router.delete("/:uid", controller.deleteUser.bind(controller));
router.get("", controller.getAllUsers.bind(controller));
router.get("/role/:role", controller.getUsersByRole.bind(controller));
router.put("/:uid/deactivate", controller.deactivateUser.bind(controller));
router.put("/:uid/activate", controller.activateUser.bind(controller));
router.put("/:uid/last-login", controller.updateLastLogin.bind(controller));
router.get("/current", controller.getCurrentUser.bind(controller));

export { router as userRoutes };
