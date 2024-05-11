import { protectedProcedure, router, trpcError } from "../../trpc/core";
import { z } from "zod";
import { db, schema } from "../../db/client";
import { and, desc, eq, gte, sql } from "drizzle-orm";


export const subscriptionActivations = router({
    upgradePlan: protectedProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ ctx: { user }, input }) => {
        const { planId } = input;
        const userId = user;

        const plan = await db.query.users.findFirst({
            where: eq(schema.plans, planId),
        }); 

        if (!plan
            ) {
            throw new trpcError({
              code: "BAD_REQUEST",
              message: "Plan doesnt exist",
            });
          }
  
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
  
        // Create a new subscription
        const newSubscription = await db
            .insert(schema.subscriptions)
            .values({
                teamId: team.id,
                planId: planId,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                })
            .returning();  
        // Create a new subscription
        const newSubscriptionActivationn = await db
            .insert(schema.subscriptionActivations)
            .values({
            teamId: team.id,
            subscriptionId: newSubscription?.,
            activatedAt: new Date(),
            expiresAt: new Date(),
            })
            .returning();  
            return {
            success: true,
            // Other relevant details
            };
        }),
  });
  