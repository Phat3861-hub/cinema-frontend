# Project context – cinema-frontend

> Bộ nhớ dự án giữa các session. Được import vào `CLAUDE.md` nên tự động nạp ở đầu mỗi session.
> Cập nhật theo skill `/update-context` (rule CLAUDE.md §0). Ghi **trạng thái hiện tại**, không chép lại code hay git log.
> Trạng thái backend / API đã sẵn sàng: `../cinema-backend/docs/project-context.md` (mục 4).
>
> **Cập nhật lần cuối:** 2026-10-13

## 1. Trạng thái hiện tại
- Mới có khung project: routing cho `(main)`, `(auth)`, `admin` với trang placeholder (`components/layout/page-placeholder.tsx`),
  header / footer / admin sidebar, `lib/api-client.ts`, `lib/env.ts`, `constants/routes.ts`, `types/api.ts`.
- Các thư mục `features/*` còn trống; chưa gọi API backend nào.

## 2. Môi trường dev
- `npm run dev` → `http://localhost:3000`, backend kỳ vọng ở `http://localhost:8080`.
- Backend: PostgreSQL chạy bằng Docker (xem context backend), API auth đang được làm.

## 3. Màn hình / tính năng đã làm
_Chưa có._

| Màn hình | Route | API backend dùng | Trạng thái |
|---|---|---|---|

## 4. Bước tiếp theo
1. Chờ backend xong API auth (đăng nhập / đăng ký / refresh / đăng xuất).
2. `features/auth`: form đăng nhập, đăng ký; lưu token bằng httpOnly cookie (không dùng `localStorage`).
3. Ẩn / hiện menu admin theo `permissions` trong token.

## 5. Quyết định thiết kế
| Ngày | Quyết định | Lý do |
|---|---|---|

## 6. Vấn đề mở / lưu ý
_Chưa có._

## 7. Nhật ký session (mới nhất trên cùng, giữ tối đa 10 dòng)
- **2026-10-13** – Thêm cơ chế project memory (file này + skill `/update-context`). Chưa thay đổi code frontend.
