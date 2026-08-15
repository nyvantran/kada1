# 🚀 NestJS Backend (PostgreSQL + Prisma ORM + Redis Cache)

Dự án Backend tiêu chuẩn doanh nghiệp được xây dựng trên nền tảng **NestJS**, tích hợp **PostgreSQL** thông qua **Prisma ORM**, hệ thống **Redis Cache (Cache-Aside Pattern)**, tài liệu hoá API tự động với **Swagger / OpenAPI**, và được đóng gói hoàn chỉnh bằng **Docker & Docker Compose**.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Framework**: [NestJS 11](https://nestjs.com/) (Node.js TypeScript framework)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/)
- **ORM**: [Prisma 7](https://www.prisma.io/) (Type-safe Database Client & Migrations)
- **Cache / In-Memory Store**: [Redis 7](https://redis.io/) via `ioredis`
- **Documentation**: [Swagger / OpenAPI](https://swagger.io/)
- **Validation**: `class-validator` & `class-transformer`
- **Security & Performance**: `helmet`, `compression`, `cors`
- **Containerization**: `Docker` & `Docker Compose` (NestJS App + PostgreSQL + Redis + Redis Commander Web UI)

---

## 📋 Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Docker Desktop** (hoặc Docker Engine & Docker Compose v2+)
- **Node.js** (v20+ nếu bạn chọn chạy NestJS trực tiếp ở máy local)
- **Git**

---

## 🐳 Hướng dẫn chạy dự án với Docker

Có **2 phương thức** khởi chạy dự án dựa trên nhu cầu của bạn:

---

### 🌟 Cách 1: Chạy TOÀN BỘ Stack trong Docker (Full Docker Container)
> *Phù hợp khi test sản phẩm, staging, hoặc môi trường production mà không cần cài Node.js trên máy host.*

#### Bước 1: Sao chép file cấu hình môi trường
```bash
cp .env.example .env
```

#### Bước 2: Build và khởi chạy tất cả Services
Chạy lệnh sau để build image NestJS App và khởi chạy PostgreSQL, Redis, Redis Commander:
```bash
npm run docker:build
# Hoặc sử dụng trực tiếp lệnh docker compose:
# docker compose up -d --build
```

#### Bước 3: Đồng bộ Schema & Seed data vào Database trong Docker
Sau khi các container chạy thành công, thực hiện chạy Prisma Push & Seed ngay bên trong container `nest_api`:
```bash
# Đồng bộ Prisma Schema vào Database PostgreSQL
docker exec -it nest_api npx prisma db push

# (Tùy chọn) Nạp dữ liệu mẫu Seed Data
docker exec -it nest_api npx tsx prisma/seed.ts
```

---

### 🛠️ Cách 2: Chạy Database & Redis trên Docker, Chạy NestJS App trên Local (Development / Live Reload)
> *Phù hợp cho lập trình viên (Developer) trong quá trình phát triển tính năng, hỗ trợ Hot-Reload code tức thì.*

#### Bước 1: Khởi động Hạ tầng (PostgreSQL + Redis + Redis Commander)
Chạy lệnh chỉ bật các dịch vụ hạ tầng phụ trợ:
```bash
npm run docker:infra
# Hoặc: docker compose up postgres redis redis-commander -d
```

#### Bước 2: Cài đặt Dependencies local
```bash
npm install
```

#### Bước 3: Đồng bộ Database Schema (Prisma)
```bash
# Push schema vào database PostgreSQL trên Docker
npm run prisma:push

# (Tùy chọn) Tạo dữ liệu mẫu ban đầu
npm run prisma:seed
```

#### Bước 4: Chạy ứng dụng NestJS ở chế độ Development
```bash
npm run start:dev
```

---

## 🌐 Các cổng dịch vụ & Truy cập (Access Endpoints)

Sau khi hệ thống khởi chạy thành công, bạn có thể truy cập các đường dẫn sau:

| Dịch vụ | URL | Mô tả |
| :--- | :--- | :--- |
| **NestJS API Base** | `http://localhost:3000/api/v1` | Root endpoint của ứng dụng |
| **Swagger API Docs** | `http://localhost:3000/api/docs` | Giao diện kiểm thử & tài liệu API trực quan |
| **Health Check API** | `http://localhost:3000/api/v1/health` | Kiểm tra kết nối DB, Redis, Memory & Uptime |
| **Redis Commander GUI** | `http://localhost:8081` | Web UI quản lý & soi các Cache Key trong Redis |
| **PostgreSQL** | `localhost:5432` | Cổng database PostgreSQL (User: `postgres`, Pass: `postgres123`) |
| **Redis Server** | `localhost:6379` | Cổng Redis Server (Pass: `redis123`) |

---

## 📦 Cấu trúc Services trong `docker-compose.yml`

Hệ thống Docker Compose bao gồm 4 container được phối hợp tự động:

```text
               ┌─────────────────────────────────────────┐
               │              Redis Commander            │ (Port 8081)
               └────────────────────┬────────────────────┘
                                    │
                                    ▼
┌───────────────────┐      ┌─────────────────┐      ┌───────────────────┐
│    nest_api       │─────▶│   nest_redis    │      │   nest_postgres   │
│ (NestJS App:3000) │      │  (Redis:6379)   │      │  (Postgres:5432)  │
└─────────┬─────────┘      └─────────────────┘      └─────────┬─────────┘
          │                                                   ▲
          └───────────────────────────────────────────────────┘
```

1. **`app` (`nest_api`)**:
   - NestJS application container được build dựa trên multi-stage `Dockerfile`.
   - Lắng nghe cổng `3000`. Tự động đợi `postgres` và `redis` ở trạng thái `healthy` trước khi khởi động.
2. **`postgres` (`nest_postgres`)**:
   - Cơ sở dữ liệu PostgreSQL 16 Alpine. Tự động lưu dữ liệu qua volume `postgres_data`.
3. **`redis` (`nest_redis`)**:
   - Bộ nhớ đệm Redis 7 Alpine có bật Append-Only File (AOF) lưu vết dữ liệu vào volume `redis_data`.
4. **`redis-commander` (`nest_redis_commander`)**:
   - Giao diện quản trị Redis Web UI giúp dễ dàng debug và kiểm tra key cache.

---

## 🛠️ Các lệnh Docker thường dùng (Cheat Sheet)

| Lệnh npm | Lệnh Docker Compose tương đương | Mô tả |
| :--- | :--- | :--- |
| `npm run docker:build` | `docker compose up -d --build` | Build lại image và bật toàn bộ containers |
| `npm run docker:up` | `docker compose up -d` | Bật toàn bộ các container đã build |
| `npm run docker:infra` | `docker compose up postgres redis redis-commander -d` | Chỉ bật DB & Redis cho dev local |
| `npm run docker:down` | `docker compose down` | Dừng và xoá tất cả containers/networks |
| `npm run docker:logs` | `docker compose logs -f` | Xem realtime log của tất cả dịch vụ |
| `-` | `docker compose logs -f app` | Xem realtime log riêng của NestJS App |
| `-` | `docker compose ps` | Kiểm tra trạng thái hoạt động của các container |
| `-` | `docker compose down -v` | Dừng container và xoá sạch Volumes dữ liệu |

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
| `GET` | `/api/v1/users/stats` | Xem thống kê tổng số Users, Posts và User mới nhất (Cache 5 phút) |
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

## ⚙️ Cấu hình Biến môi trường (`.env`)

| Biến môi trường | Giá trị mặc định | Giải thích |
| :--- | :--- | :--- |
| `PORT` | `3000` | Cổng ứng dụng NestJS |
| `API_PREFIX` | `api/v1` | Tiền tố chung cho tất cả các API route |
| `SWAGGER_PATH` | `api/docs` | Đường dẫn truy cập Swagger UI |
| `DB_HOST` | `localhost` / `postgres` | Host kết nối PostgreSQL |
| `DB_PORT` | `5432` | Cổng PostgreSQL |
| `DB_USER` | `postgres` | Tài khoản PostgreSQL |
| `DB_PASSWORD` | `postgres123` | Mật khẩu PostgreSQL |
| `DB_NAME` | `nest_db` | Tên Cơ sở dữ liệu |
| `DATABASE_URL` | `postgresql://postgres:postgres123@localhost:5432/nest_db?schema=public` | Connection String cho Prisma |
| `REDIS_HOST` | `localhost` / `redis` | Host kết nối Redis |
| `REDIS_PORT` | `6379` | Cổng Redis |
| `REDIS_PASSWORD` | `redis123` | Mật khẩu Redis |
| `REDIS_TTL` | `3600` | Thời gian đệm cache (giây) |

---

## 🌟 Tính năng kỹ thuật nổi bật

1. **Multi-stage Docker Build**: Tối ưu dung lượng Docker Image cho NestJS backend bằng cách tách biệt stage build và runner production.
2. **Prisma 7 Engine & PostgreSQL**: Truy vấn dữ liệu type-safe tối ưu với Prisma ORM.
3. **Cơ chế Cache-Aside với Redis**: Tự động kiểm tra cache trước khi truy vấn DB, tự động invalidation khi thay đổi dữ liệu.
4. **Health Check endpoint**: Theo dõi thời gian thực tình trạng PostgreSQL, Redis và hệ thống memory/uptime.
5. **Swagger API Documentation**: Đã tích hợp sẵn tài liệu tương tác Swagger cho toàn bộ các endpoint.

---

## 👥 Nhóm Thực Hiện - HR360

| STT | Họ và Tên | MSSV | Vai Trò | Mô Tả Công Việc |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Trần Ti Ni** |  | Trưởng nhóm / AI & Tech Lead | Xây dựng kiến trúc hệ thống NestJS, tích hợp AI/LLM, thiết kế Multi-stage Docker Compose và chỉ đạo quy trình phát triển. |
| 2 | **Lê Hoàng Thắng** | | Database Engineer | Thiết kế Schema dữ liệu với Prisma 7, quản trị PostgreSQL & Redis Caching, viết kịch bản Migration và tối ưu truy vấn database. |
| 3 | **Nguyễn Hồ Quang Minh** | | Backend Developer 1 | Phát triển RESTful API bằng NestJS, xây dựng phân hệ Quản lý Người dùng (Users Module) và tích hợp tài liệu Swagger UI. |
| 4 | **Phạm Duy Linh** | | Backend Developer 2 | Xây dựng cơ chế Cache-Aside với Redis, tích hợp Health Check endpoints và tối ưu hóa hiệu năng hệ thống. |
| 5 | **Trần Đỗ Mạnh Duy** |  | QA & DevOps Engineer | Cấu hình containerization Docker, kiểm thử tự động API (Jest/Supertest), thiết kế test case và đảm bảo chất lượng phần mềm. |