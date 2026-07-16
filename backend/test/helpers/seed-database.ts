import { execSync } from 'child_process';
import { join } from 'path';

export function seedDatabase(): void {
  execSync('npx ts-node prisma/seed.ts', {
    cwd: join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });
}
