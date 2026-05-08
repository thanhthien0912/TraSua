# S04: Deployment Readiness — UAT

**Milestone:** M005
**Written:** 2026-05-08T04:21:27.611Z

## UAT: Deployment Readiness (S04)

### Setup
1. Ensure .env file exists with all required variables
2. Ensure database is migrated: `npx prisma migrate deploy`

### Test Cases

#### 1. start.bat - Missing .env
- [ ] Delete .env file temporarily
- [ ] Run start.bat
- [ ] Shows clear Vietnamese error: "File .env không tìm thấy!"
- [ ] Lists required .env content
- [ ] Script exits

#### 2. start.bat - Missing ADMIN_PASSWORD
- [ ] Create .env without ADMIN_PASSWORD
- [ ] Run start.bat
- [ ] Shows clear Vietnamese error: "ADMIN_PASSWORD chưa được cấu hình"
- [ ] Shows required .env content
- [ ] Script exits

#### 3. start.bat - Missing SHOP_IP
- [ ] Create .env without SHOP_IP
- [ ] Run start.bat
- [ ] Shows clear Vietnamese error: "SHOP_IP chưa được cấu hình"
- [ ] Shows how to find IP address
- [ ] Script exits

#### 4. start.bat - Happy Path
- [ ] Create .env with all required variables
- [ ] Run start.bat
- [ ] Shows ✅ Đã kiểm tra cấu hình
- [ ] Shows ✅ Database sẵn sàng
- [ ] App starts at http://localhost:3000

#### 5. start.bat - First Run (no node_modules)
- [ ] Delete node_modules directory
- [ ] Run start.bat
- [ ] Shows 📦 Đang cài đặt thư viện
- [ ] npm install runs
- [ ] App starts

#### 6. README.md
- [ ] README.md exists and is in Vietnamese
- [ ] Covers Node.js installation
- [ ] Covers .env configuration
- [ ] Covers migration and seed
- [ ] Covers startup (start.bat and manual)
- [ ] Covers all app pages and access URLs
- [ ] Covers troubleshooting for common errors

### Expected Results
- All startup scripts show Vietnamese error messages for missing config
- App starts successfully with valid config
- README guides non-developer through full setup
- 178 tests pass: `npx vitest run`
