import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres123@localhost:5432/nest_db?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing records in development
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const user1 = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'System Admin',
      role: 'ADMIN',
      posts: {
        create: [
          {
            title: 'Welcome to NestJS + PostgreSQL + Redis',
            content: 'This project is preconfigured with Prisma ORM, Redis caching, and Swagger documentation.',
            published: true,
          },
          {
            title: 'Redis Caching in NestJS',
            content: 'High-performance cache-aside caching pattern with automatic eviction.',
            published: true,
          },
        ],
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'developer@example.com',
      name: 'Jane Developer',
      role: 'USER',
      posts: {
        create: [
          {
            title: 'Getting Started with Prisma 7',
            content: 'Learn how Prisma 7 TypeScript engine and adapters provide ultra-fast query execution.',
            published: false,
          },
        ],
      },
    },
  });

  console.log('✅ Seeded users:', [user1.email, user2.email]);
  console.log('🌱 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
