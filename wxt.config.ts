import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte", "@wxt-dev/auto-icons"],
  manifestVersion: 3,
  manifest: {
    permissions: ["storage"],
    action: {
      default_title: "View Grades",
    },
    browser_specific_settings: {
      gecko: {
        id: "gradebook@ethandawes.dev",
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
