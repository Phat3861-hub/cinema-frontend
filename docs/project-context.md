# Project context – cinema-frontend

> Bộ nhớ dự án giữa các session. Được import vào `CLAUDE.md` nên tự động nạp ở đầu mỗi session.
> Cập nhật theo skill `/update-context` (rule CLAUDE.md §0). Ghi **trạng thái hiện tại**, không chép lại code hay git log.
> Trạng thái backend / API đã sẵn sàng: `../cinema-backend/docs/project-context.md` (mục 4).
>
> **Cập nhật lần cuối:** 2026-10-30 (API suất chiếu backend sẵn sàng; nền giao diện + cụm màn auth, nhánh `feature/auth-ui`)

## 1. Trạng thái hiện tại
- Nhánh **`feature/auth-ui`** (từ `main`), **chưa commit**: nền giao diện + toàn bộ màn auth + trang trống hiển thị role.
- **Nền giao diện đã có**: token Ticketor trong `globals.css` (`@theme`, reset `--color-*` nên chỉ còn màu của dự án;
  `text-h4` / `text-h6` / `text-h8`), font Manrope, `lucide-react`; `components/ui`: `Button` + `buttonClasses()` (cho `<Link>`),
  `TextField` (label / hint / lỗi + aria), `PasswordField` (ẩn/hiện), `Alert`, `Spinner`; `components/layout/logo.tsx`.
- `lib/api-client.ts`: `credentials: 'include'`, 401 `UNAUTHORIZED` → refresh **single-flight** rồi gọi lại 1 lần (chỉ ở browser);
  lỗi mạng → `ApiError` code `NETWORK_ERROR`. `lib/error-messages.ts`: dịch lỗi theo `code` (`getErrorMessage`, `getFieldErrors`).
- `features/auth`: `SessionProvider` / `useSession` (gọi `/auth/me`, bọc ở root layout), `hasAdminAccess` + nhãn role / permission
  tiếng Việt (`permissions.ts`), validation khớp DTO backend (`validation.ts`), `safeNextPath` chống open redirect.
- **Trang trống theo role**: `/` và `/admin` hiện `SessionOverview` (tên, email, trạng thái, role + phạm vi, danh sách permission,
  đăng xuất). `/admin` có `AdminGuard` (client): chưa đăng nhập → `/login?next=`, không có permission admin → `/`.
  Header `(main)` hiện Đăng nhập / Đăng ký hoặc tên + nút "Quản trị".
- Admin tạm dùng nền tối (`neutral-850`); khung light + dark mode, sidebar lọc theo permission làm cùng các màn admin.
- Các trang khác vẫn là `PagePlaceholder` (đã đổi sang token Ticketor).

## 2. Môi trường dev
- `npm run dev` → `http://localhost:3000`, backend kỳ vọng ở `http://localhost:8080`.
- Backend: PostgreSQL chạy bằng Docker (xem context backend), API auth đang được làm.

## 3. Màn hình / tính năng đã làm
| Màn hình | Route | API backend dùng | Trạng thái |
|---|---|---|---|
| Đăng nhập | `/login?next=` | `POST /auth/login` | UI xong, **chưa test với backend thật**. `EMAIL_NOT_VERIFIED` → link gửi lại mail; staff → `/admin`, khách → `/` (hoặc `next`) |
| Đăng ký | `/register` | `POST /auth/register` | UI xong; checklist mật khẩu realtime; `EMAIL/PHONE_ALREADY_EXISTS` gắn vào field |
| Kiểm tra email | `/register/check-email?email=` | `POST /auth/resend-verification` | Gửi lại (đếm ngược 60s); không có `email` → form nhập email |
| Xác thực email | `/verify-email?token=` | `POST /auth/verify-email` | Gọi 1 lần (guard StrictMode) → thành công / link hỏng → gửi lại |
| Quên mật khẩu | `/forgot-password` | `POST /auth/forgot-password` | Nhập email → "nếu email tồn tại…" + gửi lại 60s |
| Đặt lại mật khẩu | `/reset-password?token=` | `POST /auth/reset-password` | Mật khẩu mới + nhập lại → thành công; `TOKEN_*` → link yêu cầu lại |
| Trang trống theo role | `/`, `/admin` | `GET /auth/me`, `POST /auth/logout` | Tạm thời, để kiểm tra đăng nhập từng role |

## 4. Bước tiếp theo
0. Chủ dự án chạy backend (`docker compose up -d postgres mailpit` + app) và **test tay luồng auth** với từng role seed
   (link xác thực / reset ở Mailpit `http://localhost:8025`); review rồi commit nhánh `feature/auth-ui` (lệnh PowerShell, không trailer Claude).
   Còn thiếu của nền giao diện: `badge`, `dialog`, `table`, `pagination`, `skeleton`, navbar dạng "viên thuốc" + drawer mobile,
   footer đầy đủ, khung admin (sidebar nhóm menu lọc theo `permissions`, topbar + bộ chọn rạp, light/dark).
   Sau đó: trang chủ / phim / rạp → admin phim, thể loại, rạp, phòng, sơ đồ ghế, nhân viên, user, role.
   Màn `/account` (đổi mật khẩu, đăng xuất mọi thiết bị) chưa làm.
1. (đã làm) Gọi API với `credentials: 'include'`; backend tự set / xóa cookie HttpOnly – FE **không** đọc / lưu token.
3. Ẩn / hiện menu theo `permissions` lấy từ `GET /api/v1/auth/me` hoặc body login (JS không đọc được JWT trong cookie HttpOnly).
4. (đã làm trong `apiFetch`) Gặp 401 → refresh **single-flight** rồi gọi lại; 2 refresh song song cùng token = backend coi là bị đánh cắp.
5. Backend trả mọi message bằng **tiếng Anh** (lỗi, validation, tên role / permission) – FE làm i18n: dịch lỗi theo `code`
   của `ApiResponse`, dịch tên role / permission theo `code`; `message` của backend chỉ là fallback.
   Lỗi `VALIDATION_FAILED` có `data` = map field → message (tiếng Anh).
6. API phim đã có (nhánh `feature/movie-api`, backend context mục 4): trang chủ "Đang chiếu / Sắp chiếu"
   (`GET /api/v1/movies?status=NOW_SHOWING|COMING_SOON`), danh sách có lọc / tìm kiếm / phân trang, chi tiết theo slug
   (`/api/v1/movies/slug/{slug}` – dùng cho URL `/movies/[slug]`), danh sách thể loại; admin: CRUD phim / thể loại.
   Dịch tên thể loại theo `slug`, trạng thái / độ tuổi (`P`, `K`, `T13`, `T16`, `T18`) theo mã.
7. API rạp đã có (nhánh `feature/cinema-api`): danh sách rạp theo thành phố / "gần tôi" (`lat`, `lng` từ Geolocation API →
   `distanceKm`), chi tiết theo slug, danh sách thành phố. Admin panel: `GET /api/v1/cinemas/managed` làm bộ chọn rạp
   (menu theo rạp), CRUD phòng, **trình thiết kế sơ đồ ghế** (lưới chuỗi `S`/`V`/`C`/`.` – xem Swagger), khóa ghế hỏng,
   quản lý nhân viên rạp. Quyền theo rạp: `permissions` trong `/me` chưa đủ – backend trả **403** nếu thao tác sai rạp.
8. API suất chiếu đã có (nhánh `feature/showtime-api`, 2026-10-30): lịch chiếu theo ngày (`GET /api/v1/showtimes?cinemaId=&movieId=&date=`),
   thanh chọn ngày (`/showtimes/dates`), trang phim "suất chiếu theo rạp" (`GET /api/v1/movies/{id}/showtimes?date=&city=`),
   **sơ đồ ghế theo suất** (`/showtimes/{id}/seats`: vị trí giống sơ đồ phòng + `status` AVAILABLE/HELD/BOOKED/BLOCKED + `price`).
   Admin: lịch của rạp (`/cinemas/{id}/showtimes`), tạo 1 suất / hàng loạt (`/showtimes/bulk`), sửa, hủy, khóa ghế cho 1 suất.
   Giờ gửi / nhận là ISO UTC – hiển thị theo giờ VN; `date` / `startTimes` của bulk là giờ VN. Lỗi `SHOWTIME_OVERLAP` có `data` =
   danh sách slot trùng (đánh dấu trên form). Xóa phim / phòng, sửa sơ đồ, đóng rạp có thể trả 409 `*_HAS_SHOWTIMES` / `SEAT_LAYOUT_LOCKED`.
   Chưa có API giữ ghế / đặt vé (module booking) – trang chọn ghế mới hiển thị được, chưa đặt được.

## 5. Quyết định thiết kế
| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-10-28 | Khách hàng theo Figma Ticketor, admin theo bố cục BankDash + token Ticketor; thay brand `red-600`/`zinc` bằng token Ticketor (CLAUDE.md §8 đã sửa) | Chủ dự án chọn 2 mẫu Figma này |
| 2026-10-28 | Trang khách hàng **chỉ dark theme**; admin light mặc định + dark mode | Ticketor chỉ có dark; admin nhiều bảng / form đọc tốt hơn trên nền sáng |
| 2026-10-28 | Bỏ các phần Figma không có nghiệp vụ / dữ liệu: loại vé Adult/Senior/Child, OTP xác thực (backend dùng link), watchlist, ví, testimonials, đối tác, tải app | Bám đúng backend (`docs/ui-design.md` §4) |
| 2026-10-28 | Menu admin hiện theo **permission** (không theo tên role); trang theo rạp có `cinemaId` trong URL, chọn rạp ở topbar từ `/cinemas/managed` | Role mới do admin tạo tự khớp; deep-link được; backend vẫn chặn 403 khi sai rạp |
| 2026-10-30 | Không dùng `proxy.ts` để chặn `/admin`; dùng `AdminGuard` phía client dựa trên `/auth/me` | Cookie `access_token` chỉ sống 15 phút, `refresh_token` có path `/api/v1/auth` nên proxy không biết user còn phiên; FE không đọc JWT. Backend vẫn chặn mọi API |
| 2026-10-30 | Đăng nhập xong: có `next` → về đó; không thì có ≥1 permission admin → `/admin`, ngược lại `/` | Đặc tả `ui-design.md` §4.1; `next` chỉ nhận path tương đối (`safeNextPath`) |
| 2026-10-30 | Validation phía client lặp lại đúng rule DTO backend, thông báo tiếng Việt; lỗi `VALIDATION_FAILED` từ backend chỉ hiện "Giá trị không hợp lệ" theo field | Backend chưa trả mã lỗi theo field (backend context mục 7) |

## 6. Vấn đề mở / lưu ý
- **Figma MCP gói Starter hết lượt gọi** (2026-10-28; 2026-10-30 chỉ gọi được 1 ảnh Sign in rồi lại hết) → code theo `docs/ui-design.md`.
- Ảnh nền màn auth `public/images/auth-cover.webp` cắt từ ảnh chụp frame Sign in của Ticketor (560×854, hơi mờ trên màn lớn) –
  là ảnh stock trong file Community, **chưa rõ giấy phép**: thay bằng ảnh có quyền dùng, độ phân giải cao trước khi public.
- **Next.js 16.4.0 bị cảnh báo lỗ hổng bảo mật** khi `npm run build` / `npm run dev` (lần chạy đầu dừng lại, chạy lại thì qua) → cân nhắc nâng phiên bản.
- Hydration warning trên `<html>` / `<body>` khi test là do extension trình duyệt (Trancy, ColorZilla) chèn thuộc tính, không phải lỗi code.
- Skill UI `ui-ux-pro-max` đang nằm ở `.claude/skills/SKILL.md` (không có thư mục riêng) và **thiếu thư mục `scripts/` + data** →
  Claude Code không nạp được và lệnh `search.py` không chạy. Cần chuyển vào `.claude/skills/ui-ux-pro-max/` kèm đủ file của skill.
- Backend chưa có: danh sách user phân trang, tạo / sửa / xóa role, cập nhật hồ sơ (đã ghi vào backend "Bước tiếp theo").
  Màn Người dùng tạm thời chỉ tra theo id / email.

## 7. Nhật ký session (mới nhất trên cùng, giữ tối đa 10 dòng)
- **2026-10-30** – Nhánh `feature/auth-ui`: token Ticketor + Manrope + `components/ui`, api-client refresh single-flight, màn đăng nhập / đăng ký / kiểm tra email / xác thực / quên + đặt lại mật khẩu, trang trống `/` + `/admin` hiện role, `AdminGuard`. Lint / typecheck / build xanh; kiểm tra UI trên Chrome (backend không chạy).
- **2026-10-28** – Cài Figma MCP; đọc Figma Ticketor (khách hàng) + BankDash (admin); viết `docs/ui-design.md` (token, đặc tả màn, menu admin theo permission, màn quản lý role); sửa CLAUDE.md §8. Chưa code.
- **2026-10-13** – Thêm cơ chế project memory (file này + skill `/update-context`). Chưa thay đổi code frontend.
