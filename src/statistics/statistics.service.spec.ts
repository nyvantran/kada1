import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { StatisticsService } from './statistics.service.js';

describe('StatisticsService', () => {
  let service: StatisticsService;

  const prisma = {
    user: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    post: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it('returns user and post overview statistics', async () => {
    prisma.user.count.mockResolvedValueOnce(10).mockResolvedValueOnce(8);
    prisma.post.count.mockResolvedValueOnce(15).mockResolvedValueOnce(9);

    await expect(service.getOverview()).resolves.toEqual({
      users: { total: 10, active: 8, inactive: 2 },
      posts: { total: 15, published: 9, draft: 6 },
    });
  });

  it('maps user role groups to a public response', async () => {
    prisma.user.groupBy.mockResolvedValue([
      { role: 'ADMIN', _count: { _all: 2 } },
      { role: 'USER', _count: { _all: 8 } },
    ]);

    await expect(service.getUsersByRole()).resolves.toEqual([
      { role: 'ADMIN', count: 2 },
      { role: 'USER', count: 8 },
    ]);
  });

  it('requests recent posts using the supplied limit', async () => {
    prisma.post.findMany.mockResolvedValue([]);

    await expect(service.getRecentPosts(3)).resolves.toEqual([]);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        orderBy: { createdAt: 'desc' },
      }),
    );
  });
});
