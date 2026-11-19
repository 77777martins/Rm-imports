import { handler } from "@/server/http";
import { getDashboard } from "@/server/services/dashboard.service";

export const GET = handler({ auth: "admin" }, async () => getDashboard(30));
