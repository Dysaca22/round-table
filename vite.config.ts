import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, ".", "");
    return {
        base: "/round-table/",
        build: {
            outDir: "build",
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "."),
            },
        },
    };
});
