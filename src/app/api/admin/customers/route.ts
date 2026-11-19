import { z } from "zod";
import { handler, parseQuery } from "@/server/http";
import { paginationSchema } from "@/lib/validators/common";
import { listCustomers } from "@/server/services/user.service";

const querySchema = paginationSchema.extend({ q: z.string().trim().max(80).optional() });

export const GET = handler({ auth: "admin" }, async ({ req }) => listCustomers(parseQuery(req, querySchema)));
