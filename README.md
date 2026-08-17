# 🚀 NestJS Enterprise Backend Template
### (NestJS 11 + PostgreSQL 16 + Prisma ORM 7 + Redis 7 Cache + Docker Compose + Swagger)

Template backend hoàn chỉnh, chuẩn hóa theo kiến trúc Enterprise, tích hợp sẵn cơ chế **Cache-Aside với Redis**, tầng dữ liệu mạnh mẽ với **Prisma 7 & PostgreSQL**, tài liệu hóa **Swagger / OpenAPI**, cùng cấu hình **Docker Compose đa môi trường**.

---

## 📊 1. Tổng hợp Tech Stack

| Thành phần | Công nghệ | Phiên bản | Vai trò & Mục đích |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | [NestJS](https://nestjs.com/) | `^11.0.1` | Kiến trúc module, DI (Dependency Injection), Controller, Service |
| **Language & Runtime** | [Node.js](https://nodejs.org/) & TypeScript | `Node 20+` / `TS 5.7` | Ngôn ngữ tĩnh kiểu mạnh, an toàn và dễ bảo trì |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | `16-alpine` | Cơ sở dữ liệu quan hệ (RDBMS) chính |
| **ORM & Query Engine** | [Prisma ORM](https://www.prisma.io/) | `^7.9.1` | Quản lý schema, migration, client type-safe, driver adapter PostgreSQL |
| **In-Memory Cache** | [Redis](https://redis.io/) (`ioredis`) | `7-alpine` / `ioredis ^6.0` | Bộ nhớ đệm tốc độ cao, hỗ trợ TTL, Cache-Aside, non-blocking SCAN key purge |
| **Redis GUI Manager** | [Redis Commander](https://joeferner.github.io/redis-commander/) | `latest` | Giao diện Web trực quan quản lý cache key trên trình duyệt (Port 8081) |
| **API Documentation** | [Swagger / OpenAPI](https://swagger.io/) | `^11.4.6` | Tự động sinh tài liệu API tương tác tại `/api/docs` |
| **Validation & Transform** | `class-validator` & `class-transformer` | `^0.15` / `^0.5` | Xác thực dữ liệu đầu vào DTO và biến môi trường `.env` |
| **Security & Middleware** | `helmet`, `compression`, `cors` | Latest | Bảo vệ HTTP headers, nén gzip giảm tải băng thông |
| **Containerization** | [Docker](https://www.docker.com/) & Docker Compose | `Compose v2` | Đóng gói toàn bộ ứng dụng và hạ tầng DB/Redis |

---

## 📁 2. Cấu trúc thư mục dự án

```text
kada1/
├── prisma/
│   ├── schema.prisma             # Định nghĩa Database Models (User, Post)
│   └── seed.ts                   # Script nạp dữ liệu mẫu ban đầu
├── src/
│   ├── common/                   # Shared modules, filters, interceptors
│   │   ├── dto/pagination.dto.ts # DTO chuẩn hóa phân trang & tìm kiếm
│   │   ├── filters/              # Global Exception Filter (Chuẩn hóa JSON lỗi)
│   │   └── interceptors/         # Response Envelope & Request Logging
│   ├── config/
│   │   └── env.validation.ts     # Validate biến môi trường bằng class-validator
│   ├── generated/prisma/         # Prisma Client type-safe sinh tự động
│   ├── health/                   # API Health Check (Kiểm tra Postgres & Redis)
│   ├── prisma/                   # PrismaService & Prisma Exception Filter
│   ├── redis/                    # RedisService (Get/Set, TTL, SCAN Invalidation)
│   ├── users/                    # Module Users (CRUD + Cache-Aside)
│   ├── posts/                    # Module Posts (Quan hệ 1-N với User + Cache)
│   ├── app.module.ts             # Root Module kết nối toàn bộ hệ thống
│   └── main.ts                   # Entry point (Swagger, Pipes, Interceptors, Security)
├── docker-compose.yml            # Docker Compose cho App, Postgres, Redis, Redis-Commander
├── Dockerfile                    # Multi-stage Docker build tối ưu dung lượng cho NestJS
├── .dockerignore                 # Các file bỏ qua khi đóng gói Docker Image
├── prisma.config.ts              # Cấu hình Prisma 7 Datasource & Migrations
├── .env                          # File cấu hình môi trường local
├── .env.example                  # File mẫu biến môi trường
└── package.json                  # Định nghĩa dependencies và scripts
```

---

## 🐳 3. Hướng dẫn chạy dự án với Docker

Dự án cung cấp 2 phương thức chạy linh hoạt:

### Cách 1: Chạy Hạ tầng qua Docker (Postgres + Redis) + Chạy NestJS Local (Khuyên dùng khi Dev)

Phương thức này giúp bạn tận dụng tính năng **Hot-Reload** của NestJS trên máy local trong khi DB và Redis chạy biệt lập trong Docker.

#### 1️⃣ Bật cơ sở dữ liệu PostgreSQL & Redis:
```bash
npm run docker:infra
```
> Lệnh này sẽ khởi động 3 container:
> - **PostgreSQL 16**: `localhost:5432`
> - **Redis 7**: `localhost:6379`
> - **Redis Commander GUI**: `http://localhost:8081`

#### 2️⃣ Đồng bộ Schema và nạp dữ liệu mẫu:
```bash
npm run prisma:push
npm run prisma:seed
```

#### 3️⃣ Khởi động NestJS ở chế độ Development:
```bash
npm run start:dev
```

---

### Cách 2: Chạy Toàn bộ hệ thống bằng Docker Compose (Full-Stack Containerized)

Phương thức này đóng gói toàn bộ NestJS App, PostgreSQL, Redis và Redis Commander vào Docker, sẵn sàng deploy môi trường Staging / Production.

#### 1️⃣ Khởi động toàn bộ dịch vụ:
```bash
npm run docker:all
```
*(Hoặc dùng lệnh: `docker compose up -d --build`)*

Docker sẽ tự động:
1. Build `Dockerfile` đa tầng (multi-stage) cho NestJS App.
2. Khởi động PostgreSQL và Redis với cơ chế `healthcheck`.
3. Chỉ khởi động NestJS API sau khi PostgreSQL và Redis đã hoàn toàn sẵn sàng (`service_healthy`).

#### 2️⃣ Xem realtime logs của hệ thống:
```bash
npm run docker:logs
```

#### 3️⃣ Dừng toàn bộ hệ thống:
```bash
npm run docker:down
```

---

## 🌐 4. Các đường dẫn truy cập (Endpoints)

| Dịch vụ | Địa chỉ | Mô tả |
| :--- | :--- | :--- |
| **API Base URL** | `http://localhost:3000/api/v1` | Tiền tố chung của các API routes |
| **Swagger API Docs** | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) | Giao diện kiểm thử và tài liệu API OpenAPI tương tác |
| **Health Check API** | [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health) | Kiểm tra realtime kết nối Postgres, Redis, RAM & Uptime |
| **Redis Commander GUI** | [http://localhost:8081](http://localhost:8081) | Giao diện Web quản lý trực tiếp các Key/Value trong Redis |
| **Prisma Studio** | `npm run prisma:studio` (Port `5555`) | Giao diện trực quan xem & sửa dữ liệu PostgreSQL |

---

## ⚡ 5. Bảng tổng hợp các lệnh Scripts (`package.json`)

| Nhóm | Lệnh | Mô tả |
| :--- | :--- | :--- |
| **Development** | `npm run start:dev` | Chạy dev server với hot-reload |
| **Build & Test** | `npm run build` | Biên dịch TypeScript sang thư mục `dist/` |
| | `npm run test` | Chạy bộ kiểm thử Unit Tests với Jest |
| | `npm run lint` | Tự động kiểm tra và sửa lỗi cú pháp ESLint |
| **Prisma ORM** | `npm run prisma:generate` | Sinh Prisma Client TypeScript vào `src/generated/` |
| | `npm run prisma:push` | Đẩy trực tiếp schema vào DB mà không cần migration file |
| | `npm run prisma:migrate` | Tạo và chạy migration có versioning |
| | `npm run prisma:seed` | Nạp dữ liệu mẫu vào PostgreSQL |
| | `npm run prisma:studio` | Bật giao diện web quản trị cơ sở dữ liệu Prisma Studio |
| **Docker** | `npm run docker:infra` | Chỉ bật PostgreSQL, Redis và Redis Commander |
| | `npm run docker:all` | Build và bật toàn bộ hệ thống (kèm NestJS API container) |
| | `npm run docker:down` | Dừng và hạ toàn bộ containers |
| | `npm run docker:logs` | Xem logs trực tiếp của tất cả containers |

---

## ⚙️ 6. Cấu hình Biến môi trường (`.env`)

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
SWAGGER_PATH=api/docs

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=nest_db
DB_SCHEMA=public
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/nest_db?schema=public

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
REDIS_DB=0
REDIS_TTL=3600
```

---

## 💡 7. Kiến trúc & Các cơ chế cốt lõi

### 🧠 Cơ chế Cache-Aside (Redis)
1. **Đọc dữ liệu (`GET`)**: Ứng dụng kiểm tra Redis cache trước. Nếu có (*Cache Hit*), trả kết quả ngay lập tức mà không cần query Database. Nếu chưa có (*Cache Miss*), query PostgreSQL, ghi vào Redis với thời gian hết hạn (`TTL`), rồi trả về cho client.
2. **Ghi / Cập nhật / Xoá (`POST`, `PATCH`, `DELETE`)**: Ứng dụng cập nhật Database, đồng thời tự động xóa cache đơn lẻ và xóa các cache danh sách liên quan thông qua non-blocking Redis `SCAN` cursor (`delByPattern`), tránh hiện tượng dữ liệu cũ (*stale data*).

### 🛡️ Chuẩn hóa lỗi & Phản hồi
- **Chuẩn hóa phản hồi thành công**: Mọi API trả về đều có định dạng chuẩn:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": { ... },
    "timestamp": "2026-08-12T07:30:00.000Z"
  }
  ```
- **Xử lý ngoại lệ Prisma tự động**: Bộ lọc `PrismaClientExceptionFilter` bắt các mã lỗi Prisma như `P2002` (Trùng unique key), `P2025` (Không tìm thấy record), `P2003` (Lỗi khoá ngoại) và chuyển hóa thành HTTP 409 Conflict, 404 Not Found, 400 Bad Request một cách rõ ràng.
