import { protectedProcedure, router, trpcError } from "../../trpc/core";
import { z } from "zod";
import { db, schema } from "../../db/client";
import { and, desc, eq, gte, sql } from "drizzle-orm";


export const subscriptionActivations = router({
    upgradePlan: protectedProcedure
      .input(z.object({ newPlanId: z.number() }))
      .mutation(async ({ ctx: { user }, input }) => {
        const { newPlanId } = input;
        const userId = user;

        const userT = await db.query.users.findFirst({
            where: eq(schema.users, userId),
        });
    
        // Retrieve the user's team and current subscription
        const team = await db.query.teams.findFirst({
          where: eq(schema.teams.id, userT?.teamId),
        });
  
        if (!team) {
          throw new trpcError({
            code: "BAD_REQUEST",
            message: "User does not have a team",
          });
        }
  
        const currentSubscription = await db.query.subscriptions.findFirst({
          where: and(eq(schema.subscriptions.isActive, true), eq(schema.subscriptions.teamId, team.id)),
        });
  
        if (!currentSubscription) {
          throw new trpcError({
            code: "NOT_FOUND",
            message: "No active subscription found",
          });
        }
  
        // Existing upgrade logic can be reused here
  
        return {
          success: true,
          // Other relevant details
        };
      }),
  });
  