import { createRouter, publicQuery } from "./middleware";
import { weatherRouter } from "./routers/weather";
import { climateRouter } from "./routers/climate";
import { aiRouter } from "./routers/ai";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  weather: weatherRouter,
  climate: climateRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
