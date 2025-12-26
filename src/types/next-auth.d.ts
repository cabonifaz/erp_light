import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: string;
    branch_name?: string;
    id?: string;
  }
  interface Session {
    user: {
      role?: string;
      branch_name?: string;
      id?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    branch_name?: string;
    id?: string;
  }
}