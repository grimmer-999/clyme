import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { fetchCurrentWeather, fetchForecast, fetchGlobalSnapshot } from "../services/weather";

export const weatherRouter = createRouter({
  getCurrent: publicQuery
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
      })
    )
    .query(async ({ input }) => {
      return fetchCurrentWeather(input.lat, input.lon);
    }),

  getForecast: publicQuery
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
        hours: z.number().max(48).default(24),
      })
    )
    .query(async ({ input }) => {
      return fetchForecast(input.lat, input.lon, input.hours);
    }),

  getGlobalSnapshot: publicQuery
    .input(
      z.object({
        layer: z.enum(["temperature", "pressure", "humidity", "wind", "precipitation"]),
      })
    )
    .query(async ({ input }) => {
      return fetchGlobalSnapshot(input.layer);
    }),
});
