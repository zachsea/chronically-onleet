import UserService from "../services/user-service.js";

export type UserSettings = Awaited<ReturnType<typeof UserService.prototype.getUserSettings>>;
