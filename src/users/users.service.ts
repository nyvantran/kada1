import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PaginatedResult, PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { User } from '../generated/prisma/client.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly CACHE_PREFIX = 'users';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.prisma.user.create({
      data: createUserDto,
    });

    // Invalidate list caches
    await this.redis.delByPattern(`${this.CACHE_PREFIX}:list:*`);
    this.logger.log(`Created user with ID: ${user.id}`);

    return user;
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<User>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const order = query.order ?? 'desc';

    const cacheKey = `${this.CACHE_PREFIX}:list:p${page}_l${limit}_s${search || 'all'}_o${order}`;

    // Try cache first
    const cached = await this.redis.get<PaginatedResult<User>>(cacheKey);
    if (cached) {
      this.logger.log(`Returning users list from Redis cache [${cacheKey}]`);
      return cached;
    }

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [totalItems, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: order },
        include: {
          _count: {
            select: { posts: true },
          },
        },
      }),
    ]);

    const result: PaginatedResult<User> = {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit) || 1,
        currentPage: page,
      },
    };

    // Cache the result for 2 minutes (120s)
    await this.redis.set(cacheKey, result, 120);

    return result;
  }

  async findOne(id: string): Promise<User> {
    const cacheKey = `${this.CACHE_PREFIX}:id:${id}`;

    // Check Redis cache first
    const cachedUser = await this.redis.get<User>(cacheKey);
    if (cachedUser) {
      this.logger.log(`Returning user #${id} from Redis cache`);
      return cachedUser;
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        posts: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Cache user for 10 minutes (600s)
    await this.redis.set(cacheKey, user, 600);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Verify existence
    await this.findOne(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    // Invalidate individual cache and list caches
    await Promise.all([
      this.redis.del(`${this.CACHE_PREFIX}:id:${id}`),
      this.redis.delByPattern(`${this.CACHE_PREFIX}:list:*`),
    ]);

    this.logger.log(`Updated user #${id} and invalidated cache`);
    return updatedUser;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    // Verify existence
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });

    // Invalidate individual cache and list caches
    await Promise.all([
      this.redis.del(`${this.CACHE_PREFIX}:id:${id}`),
      this.redis.delByPattern(`${this.CACHE_PREFIX}:list:*`),
    ]);

    this.logger.log(`Deleted user #${id} and invalidated cache`);
    return { success: true, message: `User with ID ${id} has been deleted.` };
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalPosts: number;
    avgPostsPerUser: number;
    latestUser: { id: string; email: string; name: string | null; createdAt: Date } | null;
  }> {
    const cacheKey = `${this.CACHE_PREFIX}:stats`;

    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      this.logger.log(`Returning users stats from Redis cache`);
      return cached;
    }

    const [totalUsers, totalPosts, latestUser] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.user.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, createdAt: true },
      }),
    ]);

    const avgPostsPerUser = totalUsers > 0 ? parseFloat((totalPosts / totalUsers).toFixed(2)) : 0;

    const stats = {
      totalUsers,
      totalPosts,
      avgPostsPerUser,
      latestUser,
    };

    await this.redis.set(cacheKey, stats, 300);

    return stats;
  }
}
