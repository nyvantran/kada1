import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [totalUsers, activeUsers, totalPosts, publishedPosts] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.post.count(),
        this.prisma.post.count({ where: { published: true } }),
      ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      posts: {
        total: totalPosts,
        published: publishedPosts,
        draft: totalPosts - publishedPosts,
      },
    };
  }

  async getUsersByRole() {
    const groups = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
      orderBy: { role: 'asc' },
    });

    return groups.map((group) => ({
      role: group.role,
      count: group._count._all,
    }));
  }

  async getRecentPosts(limit: number) {
    return this.prisma.post.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        published: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}
