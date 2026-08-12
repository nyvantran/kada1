# 🚀 NestJS Backend (PostgreSQL + Prisma ORM + Redis Cache)

Dự án Backend tiêu chuẩn doanh nghiệp được xây dựng trên nền tảng **NestJS**, tích hợp **PostgreSQL** thông qua **Prisma ORM**, hệ thống **Redis Cache (Cache-Aside Pattern)**, tài liệu hoá API tự động với **Swagger / OpenAPI**, cùng cấu hình Docker Compose sẵn sàng chạy ngay.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Framework**: [NestJS 11](https://nestjs.com/) (Node.js TypeScript framework)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/)
- **ORM**: [Prisma 7](https://www.prisma.io/) (Type-safe Database Client & Migrations)
- **Cache / In-Memory Store**: [Redis 7](https://redis.io/) via `ioredis`
- **Documentation**: [Swagger / OpenAPI](https://swagger.io/)
- **Validation**: `class-validator` & `class-transformer`
- **Security & Performance**: `helmet`, `compression`, `cors`
- **Containerization**: `docker-compose` (PostgreSQL + Redis + Redis Commander Web UI)

---

## 📁 Cấu trúc thư mục (Project Structure)

```text
├── prisma/
│   ├── schema.prisma             # Định nghĩa Database Models (User, Post, ...)
│   └── seed.ts                   # Dữ liệu mẫu (Database Seeding)
├── src/
│   ├── common/                   # Shared Filters, Interceptors, DTOs
│   │   ├── dto/pagination.dto.ts # DTO phân trang, tìm kiếm, sắp xếp
│   │   ├── filters/              # Global Exception Filter (Chuẩn hoá JSON lỗi)
│   │   └── interceptors/         # Response Envelope & Logging Interceptor
│   ├── config/
│   │   └── env.validation.ts     # Validate biến môi trường bằng class-validator
│   ├── health/                   # Endpoint kiểm tra sức khoẻ hệ thống (DB & Redis)
│   ├── prisma/                   # PrismaService & Prisma Exception Filter
│   ├── redis/                    # RedisService (Get/Set, Del, DelByPattern, GetOrSet)
│   ├── users/                    # Module Quản lý User (CRUD + Redis Cache)
│   ├── posts/                    # Module Quản lý Post (Quan hệ với User + Cache)
│   ├── app.module.ts             # Root Module
│   └── main.ts                   # Bootstrap App (Swagger, Pipes, Filters, Security)
├── docker-compose.yml            # Khởi chạy PostgreSQL, Redis & Redis Commander
├── prisma.config.ts              # Cấu hình Prisma 7 Datasource & Migrations
├── .env                          # Biến môi trường local
├── .env.example                  # Template biến môi trường
└── package.json
```

---

## ⚡ Hướng dẫn cài đặt & Chạy dự án (Quick Start)

### 1. Khởi động PostgreSQL & Redis qua Docker

Chạy lệnh sau để khởi động PostgreSQL (cổng `5432`), Redis (cổng `6379`), và Redis Commander GUI (cổng `8081`):

```bash
npm run docker:up
```

> 💡 **Redis Commander GUI**: Truy cập `http://localhost:8081` để xem trực quan các cache key trong Redis.

---

### 2. Đồng bộ Database Schema (Prisma)

Đẩy schema vào cơ sở dữ liệu PostgreSQL và tạo dữ liệu mẫu (Seed data):

```bash
# Push schema trực tiếp vào PostgreSQL
npm run prisma:push

# (Tuỳ chọn) Tạo dữ liệu mẫu ban đầu
npm run prisma:seed
```

Hoặc nếu bạn muốn tạo file migration:
```bash
npm run prisma:migrate
```

---

### 3. Chạy ứng dụng NestJS

```bash
# Chế độ phát triển (Hot-reload)
npm run start:dev

# Chế độ Production
npm run build
npm run start:prod
```

Ứng dụng sẽ khởi chạy tại:
- **API Base URL**: `http://localhost:3000/api/v1`
- **Swagger API Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Health Check Endpoint**: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

---

## 📖 Danh sách API chính (Endpoints)

### 🩺 Health & Diagnostics
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Kiểm tra kết nối PostgreSQL, Redis và trạng thái RAM/Uptime |

### 👤 Users Management (Tích hợp Redis Cache)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/users?page=1&limit=10&search=admin` | Lấy danh sách Users phân trang (Được cache 2 phút) |
| `GET` | `/api/v1/users/stats` | Xem thống kê tổng số Users, Posts và User mới nhất (Cache-Aside 5 phút) |
| `GET` | `/api/v1/users/:id` | Xem chi tiết User (Cache-Aside 10 phút) |
| `POST` | `/api/v1/users` | Tạo mới User (Tự động xoá cache danh sách cũ) |
| `PATCH` | `/api/v1/users/:id` | Cập nhật User (Tự động xoá cache user & danh sách) |
| `DELETE` | `/api/v1/users/:id` | Xoá User (Tự động dọn dẹp cache) |

### 📝 Posts Management
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/posts?page=1&limit=10` | Lấy danh sách bài viết kèm thông tin Tác giả |
| `GET` | `/api/v1/posts/:id` | Xem chi tiết bài viết (Cache) |
| `POST` | `/api/v1/posts` | Tạo bài viết mới gắn với `authorId` |
| `PATCH` | `/api/v1/posts/:id` | Cập nhật bài viết |
| `DELETE` | `/api/v1/posts/:id` | Xoá bài viết |

---

## 🔧 Các lệnh Scripts hữu ích

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run start:dev` | Chạy dev server với hot-reload |
| `npm run build` | Biên dịch TypeScript sang thư mục `dist/` |
| `npm run test` | Chạy Unit Tests với Jest |
| `npm run prisma:generate` | Tạo Prisma Client TypeScript |
| `npm run prisma:push` | Đồng bộ schema trực tiếp vào PostgreSQL |
| `npm run prisma:migrate` | Tạo & chạy migration |
| `npm run prisma:studio` | Mở giao diện Prisma Studio quản lý dữ liệu trên trình duyệt |
| `npm run prisma:seed` | Nạp dữ liệu mẫu vào database |
| `npm run docker:up` | Bật toàn bộ containers (Postgres, Redis, Redis Commander) |
| `npm run docker:down` | Dừng các containers |
| `npm run docker:logs` | Xem realtime logs của Docker containers |

---

## ⚙️ Cấu hình Biến môi trường (`.env`)

| Biến | Giá trị mặc định | Giải thích |
| :--- | :--- | :--- |
| `PORT` | `3000` | Cổng chạy NestJS server |
| `API_PREFIX` | `api/v1` | Tiền tố chung cho tất cả các API route |
| `SWAGGER_PATH` | `api/docs` | Đường dẫn truy cập Swagger UI |
| `DATABASE_URL` | `postgresql://postgres:postgres123@localhost:5432/nest_db?schema=public` | Chuỗi kết nối PostgreSQL |
| `REDIS_HOST` | `localhost` | Địa chỉ máy chủ Redis |
| `REDIS_PORT` | `6379` | Cổng Redis |
| `REDIS_PASSWORD` | `redis123` | Mật khẩu xác thực Redis |
| `REDIS_TTL` | `3600` | Thời gian sống mặc định của cache (giây) |

---

## 🌟 Tính năng nổi bật

1. **Prisma 7 Engine & PostgreSQL Adapter**: Tận dụng kiến trúc driver adapter hiện đại của Prisma 7 mang lại tốc độ truy vấn tối ưu.
2. **Cơ chế Cache-Aside với Redis**: Tự động kiểm tra cache trước khi truy vấn DB, đồng thời tự động vô hiệu hoá cache (invalidation) khi có hành động thêm/sửa/xoá.
3. **Scan Pattern Key Invalidation**: Xoá cache theo mẫu (wildcard pattern) an toàn thông qua non-blocking Redis `SCAN` cursor.
4. **Global Standardized Response Envelope**: Tất cả phản hồi thành công đều tuân thủ chuẩn `{ success: true, statusCode: 200, data: ..., timestamp: ... }`.
5. **Prisma Exception Filter**: Bắt lỗi ràng buộc dữ liệu (Unique constraint `P2002`, Not found `P2025`, Foreign key `P2003`) và trả về mã HTTP tương ứng (409, 404, 400).
6. **Bảo mật sẵn có**: Tích hợp `helmet` chống các lỗ hổng HTTP header phổ biến, hỗ trợ nén `compression` và CORS linh hoạt.
