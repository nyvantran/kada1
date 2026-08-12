import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { PaginatedResult, PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { Post } from '../generated/prisma/client.js';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly CACHE_PREFIX = 'posts';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    // Verify author exists
    const author = await this.prisma.user.findUnique({
      where: { id: createPostDto.authorId },
    });
    if (!author) {
      throw new NotFoundException(`Author with ID ${createPostDto.authorId} not found`);
    }

    const post = await this.prisma.post.create({
      data: createPostDto,
      include: {
        author: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    await this.redis.delByPattern(`${this.CACHE_PREFIX}:list:*`);
    this.logger.log(`Created post #${post.id} by author #${post.authorId}`);

    return post;
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Post>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const order = query.order ?? 'desc';

    const cacheKey = `${this.CACHE_PREFIX}:list:p${page}_l${limit}_s${search || 'all'}_o${order}`;

    const cached = await this.redis.get<PaginatedResult<Post>>(cacheKey);
    if (cached) {
      this.logger.log(`Returning posts list from Redis cache [${cacheKey}]`);
      return cached;
    }

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { content: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [totalItems, items] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: order },
        include: {
          author: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
    ]);

    const result: PaginatedResult<Post> = {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit) || 1,
        currentPage: page,
      },
    };

    await this.redis.set(cacheKey, result, 120);

    return result;
  }

  async findOne(id: string): Promise<Post> {
    const cacheKey = `${this.CACHE_PREFIX}:id:${id}`;

    const cached = await this.redis.get<Post>(cacheKey);
    if (cached) {
      this.logger.log(`Returning post #${id} from Redis cache`);
      return cached;
    }

    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    await this.redis.set(cacheKey, post, 600);

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    await this.findOne(id);

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        author: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    await Promise.all([
      this.redis.del(`${this.CACHE_PREFIX}:id:${id}`),
      this.redis.delByPattern(`${this.CACHE_PREFIX}:list:*`),
    ]);

    this.logger.log(`Updated post #${id} and invalidated cache`);
    return updatedPost;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    await this.prisma.post.delete({
      where: { id },
    });

    await Promise.all([
      this.redis.del(`${this.CACHE_PREFIX}:id:${id}`),
      this.redis.delByPattern(`${this.CACHE_PREFIX}:list:*`),
    ]);

    this.logger.log(`Deleted post #${id} and invalidated cache`);
    return { success: true, message: `Post with ID ${id} has been deleted.` };
  }
}
