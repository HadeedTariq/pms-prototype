import "express-session";

declare module "express-session" {
  interface SessionData {
    trustapState?: any;
  }
}

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
}
