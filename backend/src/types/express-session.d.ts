import "express-session";

declare module "express-session" {
    interface SessionData {
        oldInput?: Record<string, string>;
    }
}
