# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 |  | architecture | Tech stack cho hệ thống quản lý quán trà sữa | Next.js 14+ (App Router) + Tailwind CSS + SQLite (Prisma) + SSE | Next.js cho full-stack trong một project. SQLite không cần cài DB server riêng — phù hợp chạy local. Tailwind cho UI nhanh. SSE cho real-time đơn giản không cần WebSocket server. | Yes | collaborative |
| D002 |  | architecture | Cơ chế QR ordering | QR tĩnh chứa URL http://<local-ip>:3000/order?table=N, in sẵn 10-20 mã dán tại bàn | QR tĩnh đơn giản, in một lần dùng mãi. Không cần dynamic QR hay session — table number là identity đủ cho quán tầm trung. | Yes | collaborative |
