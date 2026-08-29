import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Each spec file boots its own Nest app against the same Postgres and
    // relies on TypeORM's migrationsRun at startup — running files in
    // parallel races multiple apps to create the same schema at once.
    fileParallelism: false,
  },
});
