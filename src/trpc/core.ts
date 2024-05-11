import { initTRPC, TRPCError } from "@trpc/server";
import type { createContext } from "./context";
import { db, schema }from "../db/client";
import { clearTokens, verifyAccessToken } from "../modules/auth/model";
import { and, desc, eq, gte, sql } from "drizzle-orm";
const t = initTRPC.context<typeof createContext>().create();

export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;
export const trpcError = TRPCError;
export const createCallerFactory = t.createCallerFactory;

// user procedure
const isUser = middleware(({ ctx: { req, res }, next }) => {
  try {
    const { userId } = verifyAccessToken({ req });
    return next({
      ctx: {
        user: { userId },
      },
    });
  } catch (error) {
    clearTokens({ res });
    throw new trpcError({
      code: "UNAUTHORIZED",
    });
  }
});
export const protectedProcedure = publicProcedure.use(isUser);

// isAdmin procedure
const isAdmin = middleware(async ({ ctx: { req, res }, next }) => {
  try {
    const { userId } = verifyAccessToken({ req });
    const targetUser = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (targetUser?.isAdmin)
      return next({
        ctx: {
          user: { userId },
        },
      });
    throw new Error("u");
  } catch (error) {
    clearTokens({ res });
    throw new trpcError({
      code: "UNAUTHORIZED",
    });
  }
});
export const protectedAdminProcedure = publicProcedure.use(isAdmin);