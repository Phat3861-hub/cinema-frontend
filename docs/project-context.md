# Project context – cinema-frontend

> Bộ nhớ dự án giữa các session. Được import vào `CLAUDE.md` nên tự động nạp ở đầu mỗi session.
> Cập nhật theo skill `/update-context` (rule CLAUDE.md §0). Ghi **trạng thái hiện tại**, không chép lại code hay git log.
> Trạng thái backend / API đã sẵn sàng: `../cinema-backend/docs/project-context.md` (mục 4).
>
> **Cập nhật lần cuối:** 2026-11-01 (luồng đặt vé giữ ghế + bắp nước, vé của tôi, admin bắp nước; nhánh `feature/booking-ui`)

## 1. Trạng thái hiện tại
- `feature/auth-ui` (`00136e2`) và `feature/ui-modules` (`650fd0b`) đã commit. Nhánh **`feature/booking-ui`** (từ
  `feature/ui-modules`), **chưa commit**: UI cho booking PR 1 của backend (giữ ghế, bắp nước, lịch sử đặt vé, quản lý sản phẩm).
  Lint / typecheck / build xanh; đã test trên Chrome (mục 3).
- **Realtime ghế**: `@stomp/stompjs` 7.4.0 (pin cứng), hook `features/showtime/hooks/use-seat-updates.ts` – WebSocket thuần
  (`env.wsUrl` đổi `http`→`ws`, backend không dùng SockJS), tự kết nối lại 5 s và tải lại sơ đồ sau khi kết nối lại.
- **Theme**: token ngữ nghĩa trong `globals.css` (`:root` = light, `.dark` = dark; `bg-page/surface`, `text-fg/-muted`, `text-accent`…),
  `@custom-variant dark`. Cookie `theme` + `locale` + `admin_cinema` (`lib/preferences.ts`); script inline trong `<head>` đặt class `dark`
  và `lang` trước khi vẽ (không nháy). Mặc định **dark + vi**. Nút đổi ở header khách và topbar admin (`preference-controls.tsx`).
- **i18n** (`src/i18n`): `messages/vi.ts` (nguồn kiểu `Messages`), `en.ts` (typed `Messages` → thiếu key là lỗi typecheck);
  client `useT()` / `useLocale()` (useSyncExternalStore, server snapshot = vi), server component `<Msg id="a.b" />` (`MessageId`).
  Lỗi backend dịch theo `code` (`getErrorMessage(error, t)`), role / permission / thể loại theo `code` / `slug`.
- `components/ui`: button, field, text/select/textarea/password field, alert, badge, dialog (+ConfirmDialog, `<dialog>` native),
  states (skeleton/loading/empty/error), pagination, tabs/segmented, toast, card, checkbox, table, menu, drawer, cover-image.
  Hooks: `use-api` (giữ data cũ khi đổi key), `use-url-filters` (cần Suspense), `use-theme`, `use-now` (giờ hiện tại cho render).
- **Khách hàng**: trang chủ (hero phim nổi bật, đang/sắp chiếu, ưu đãi, FAQ), danh sách phim (lọc/tìm/sắp xếp/phân trang theo URL),
  chi tiết phim + lịch chiếu theo ngày/thành phố/định dạng, danh sách rạp (thành phố, gần tôi), chi tiết rạp + lịch,
  **đặt vé** `features/booking/components/booking-screen.tsx`: Ghế → Bắp nước → Thanh toán (→ Vé). Chọn ghế (tối đa 8,
  ghế đôi theo cặp) cập nhật trực tiếp; ghế đang chọn bị người khác lấy → bỏ khỏi lựa chọn + toast. "Tiếp tục" = `POST /bookings`
  (`Idempotency-Key` = UUID mỗi lần bấm; chưa đăng nhập → `/login?next=`), `SEAT_NOT_AVAILABLE` → bỏ đúng các ghế trong `data`.
  Đồng hồ giữ ghế tính theo `expiresAt - createdAt` của server (không lệ thuộc đồng hồ máy), hết giờ → hộp thoại chọn lại.
  Bắp nước: lưới theo loại + stepper (tối đa 20), "Bỏ qua", không có sản phẩm thì bỏ bước; lưu bằng `PUT /items` chỉ khi đổi.
  Thanh toán: bảng đơn + nút "Thanh toán" khóa (chờ PR 3 VNPay), "Hủy đặt vé" (xác nhận); "Đổi ghế" hủy đơn rồi quay lại sơ đồ.
  Tài khoản (thông tin, đổi mật khẩu, đăng xuất mọi thiết bị), **vé của tôi** (`GET /bookings/me?size=100`, tab Sắp tới / Đã xem /
  Đã hủy chia ở client, hủy đơn đang chờ).
- **Admin** (khung BankDash): sidebar nhóm menu lọc theo permission (`features/admin/menu.ts`), `PermissionGate` trong shell →
  mở URL không có quyền hiện "Không có quyền"; bộ chọn rạp ở topbar (`/cinemas/managed`); `CinemaScope` báo không có quyền
  nếu `cinemaId` trên URL không thuộc rạp được quản lý. Màn: tổng quan (thẻ số liệu, biểu đồ suất 7 ngày, suất sắp tới, lối tắt),
  phim (list + form), thể loại, rạp (list + form + vị trí hiện tại), phòng (tạo từ mẫu), **thiết kế sơ đồ ghế** (cọ vẽ / khóa ghế),
  loại ghế, suất chiếu (theo ngày, tạo 1 / hàng loạt, sửa, hủy, khóa ghế theo suất, hiển thị slot trùng), nhân sự rạp,
  người dùng (tra theo ID → khóa/mở, gán/gỡ role), **vai trò & quyền** (ma trận theo module, ADMIN chỉ xem, hộp xác nhận
  thêm/bỏ, chế độ so sánh), **bắp nước** (`/admin/products`, PRODUCT_MANAGE: lọc theo loại, thêm/sửa/ngừng bán, xóa bị chặn
  khi đã có trong đơn). Các mục chưa có API (POS, check-in, đơn đặt vé, hoàn tiền, banner, đánh giá, voucher, báo cáo,
  audit log) là trang "Sắp có".

## 2. Môi trường dev
- `npm run dev` → `http://localhost:3000`, backend `http://localhost:8080`, Mailpit `http://localhost:8025`.
- Backend chạy với `ADMIN_EMAIL` / `ADMIN_PASSWORD` (hướng dẫn: backend `docs/huong-dan-test-swagger.md`).
- Backend booking cần thêm **Redis** (container `cinema-redis`); không có Redis thì giữ ghế trả 503 `SEAT_HOLD_UNAVAILABLE`.
- Dữ liệu test: script seed của backend (`cinema-backend/seed/`, gitignore) – tài khoản, rạp, suất, sản phẩm, đơn mẫu ghi trong
  `cinema-backend/seed/TEST-DATA.md` (mật khẩu chung `Test12345`).

## 3. Màn hình / tính năng đã làm
| Nhóm | Route | Trạng thái |
|---|---|---|
| Auth | `/login`, `/register`, `/register/check-email`, `/verify-email`, `/forgot-password`, `/reset-password` | Xong, i18n |
| Khách hàng | `/`, `/movies`, `/movies/[slug]`, `/cinemas`, `/cinemas/[slug]`, `/booking/[showtimeId]`, `/account`, `/my-tickets` | Xong với API hiện có; booking dừng ở bước thanh toán (chờ VNPay) |
| Admin nội dung | `/admin/movies(/new,/[id])`, `/admin/genres` | Xong |
| Admin kinh doanh | `/admin/products` | Xong |
| Admin rạp | `/admin/cinemas(/new,/[id])`, `/admin/cinemas/[id]/rooms\|staff\|showtimes`, `/admin/rooms/[id]/layout`, `/admin/seat-types`; `/admin/rooms\|staff\|showtimes` chuyển tới rạp đang chọn | Xong |
| Admin hệ thống | `/admin/users`, `/admin/users/[id]`, `/admin/roles` | Xong (user chỉ tra theo ID) |

Đã test trên Chrome 2026-10-31: home / chi tiết phim / chọn ghế (light + dark, vi + en); admin với ADMIN, CINEMA_MANAGER,
TICKET_STAFF, CONTENT_MANAGER (menu đúng quyền, chặn URL không quyền, 403 rạp khác), tạo suất trùng giờ, lưu sơ đồ bị khóa
(`SEAT_LAYOUT_LOCKED`), khóa / mở ghế, hộp xác nhận quyền, gán role theo rạp, validation form phim.
Đã test trên Chrome 2026-11-01: giữ ghế → bắp nước → thanh toán → hủy; 2 tab cùng suất (ghế đổi trạng thái trực tiếp, ghế đang
chọn bị tab kia giữ → bỏ + toast); vé của tôi (đơn chờ thanh toán + hủy); admin bắp nước (CINEMA_MANAGER bị chặn, ADMIN sửa,
xóa sản phẩm đã có trong đơn → `PRODUCT_IN_USE`). Chưa test: hết giờ giữ ghế thật (10 phút), light theme / en của màn mới.
Chưa kiểm tra được giao diện mobile bằng Chrome (cửa sổ không resize).

## 4. Bước tiếp theo
1. Chủ dự án review + commit nhánh `feature/booking-ui` (lệnh PowerShell, không trailer Claude).
2. Backend PR 2 (`feature/booking-counter`): màn vé có QR (`/my-tickets/[bookingId]`), POS bán tại quầy, danh sách đơn theo rạp
   (`/admin/bookings`), tab Đặt vé trong chi tiết user.
3. Backend PR 3 (`feature/payment-vnpay`): bật nút Thanh toán, trang chờ kết quả + bước Vé, voucher.
4. Kiểm tra giao diện mobile (DevTools device mode) cho header/drawer, sidebar admin, bảng suất chiếu, trình thiết kế ghế, luồng đặt vé.
5. Khi backend có API: danh sách user phân trang (thay màn tra theo ID), voucher, báo cáo, banner, đánh giá, audit log.
6. Backend trả mô tả role bằng tiếng Anh (`description`) → cần dịch theo `code` hoặc backend thêm bản vi.

## 5. Quyết định thiết kế
| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-10-28 | Khách hàng theo Figma Ticketor, admin theo bố cục BankDash + token Ticketor | Chủ dự án chọn 2 mẫu Figma này |
| 2026-10-31 | **Mọi trang có light + dark** (mặc định dark), màu qua token ngữ nghĩa; thay quyết định 2026-10-28 "khách chỉ dark" | Chủ dự án yêu cầu light theme |
| 2026-10-31 | **i18n vi / en** tự viết (dictionary typed, không thư viện), ngôn ngữ trong cookie; `metadata` tĩnh giữ tiếng Việt | Chủ dự án yêu cầu; đủ nhỏ, an toàn kiểu, chạy được với Cache Components |
| 2026-10-28 | Bỏ các phần Figma không có nghiệp vụ / dữ liệu (loại vé Adult/Child, OTP, watchlist, ví…) | Bám đúng backend (`docs/ui-design.md` §4) |
| 2026-10-28 | Menu admin theo **permission**; trang theo rạp có `cinemaId` trong URL, chọn rạp ở topbar | Role mới tự khớp; deep-link được; backend vẫn chặn 403 |
| 2026-10-31 | Thêm `PermissionGate` (theo menu item) và `CinemaScope` chặn rạp ngoài phạm vi ở UI | Mở URL trực tiếp không còn ra màn đầy lỗi 403 |
| 2026-10-30 | Chặn `/admin` bằng `AdminGuard` client (dựa `/auth/me`), không dùng `proxy.ts` | FE không đọc được JWT HttpOnly; backend vẫn chặn mọi API |
| 2026-11-01 | "Đổi ghế" từ bước sau **hủy đơn đang giữ** rồi mới quay lại sơ đồ (giữ nguyên lựa chọn) | Ghế của mình đang HELD nên không chọn/bỏ được trên sơ đồ; hủy rõ ràng dễ hiểu hơn để backend tự thay đơn |
| 2026-11-01 | Lịch sử đặt vé tải 1 trang 100 đơn, chia tab ở client | `/bookings/me` chỉ lọc 1 trạng thái, tab "Sắp tới/Đã xem" phụ thuộc giờ chiếu; khách hiếm khi quá 100 đơn |
| 2026-10-30 | Validation client lặp lại rule DTO backend; `VALIDATION_FAILED` chỉ hiện "Giá trị không hợp lệ" theo field | Backend chưa trả mã lỗi theo field |

## 6. Vấn đề mở / lưu ý
- **Figma MCP gói Starter hết lượt gọi** → code theo `docs/ui-design.md`.
- Ảnh nền auth `public/images/auth-cover.webp` lấy từ file Community, **chưa rõ giấy phép** – thay trước khi public.
- Đã nâng **Next.js + eslint-config-next 16.4.0 → 16.4.3** (2026-11-01; 16.4.0 dính advisory critical: RCE Image Optimization với SVG,
  RCE `use cache`, DoS Server Actions). `npm audit` còn 16 cảnh báo moderate, chỉ ở dev (eslint / minimatch).
- Extension trình duyệt (ColorZilla `cz-shortcut-listen`) thêm thuộc tính vào `<body>` → `<body suppressHydrationWarning>` trong
  `app/layout.tsx` (chỉ bỏ qua thuộc tính của chính thẻ body, không ảnh hưởng con).
- Cache Components: hook đọc URL (`usePathname`, `useSearchParams`) phải nằm trong `<Suspense>`; `AdminGuard` dùng `window.location`
  trong effect để không chặn prerender. Không gọi `Date.now()` khi render (lint purity) → dùng `useNow()`.
- Ghi chú sơ đồ ghế "đã có suất tương lai thì khóa" luôn hiện vì API layout không cho biết trạng thái khóa; backend trả
  `SEAT_LAYOUT_LOCKED` khi lưu.
- Đơn bị hủy / hết hạn trả `seats` rỗng (backend nhả ghế) → tab "Đã hủy" không hiện ghế; `showtime` có thể `null` (rạp bị xóa
  mềm) → thẻ hiện "Suất chiếu không còn hiển thị".
- Thay đổi ghế xảy ra giữa lúc tải sơ đồ và lúc WebSocket kết nối lần đầu (~100 ms) có thể bị lỡ; bấm "Tiếp tục" vẫn an toàn vì
  backend kiểm tra lại.
- Skill `ui-ux-pro-max` ở `.claude/skills/SKILL.md` thiếu thư mục riêng + `scripts/` → không nạp được.

## 7. Nhật ký session (mới nhất trên cùng, giữ tối đa 10 dòng)
- **2026-11-01** – Nhánh `feature/booking-ui`: `@stomp/stompjs`, hook ghế realtime, luồng đặt vé (giữ ghế + đếm ngược, bắp nước, xem đơn, hủy), vé của tôi theo tab, admin bắp nước, i18n + mã lỗi booking. Test Chrome 2 tab. Nâng Next 16.4.3 (lỗ hổng), sửa hydration warning do extension.
- **2026-10-31** – Nhánh `feature/ui-modules`: token ngữ nghĩa light/dark, i18n vi/en, bộ `components/ui`, màn khách hàng (home, phim, rạp, chọn ghế, tài khoản) + toàn bộ admin theo permission (phim, thể loại, rạp, phòng, sơ đồ ghế, loại ghế, suất chiếu, nhân sự, user, role). Seed dữ liệu test, test Chrome 4 role.
- **2026-10-30** – Nhánh `feature/auth-ui`: token Ticketor + Manrope, api-client refresh single-flight, các màn auth, `AdminGuard`.
- **2026-10-28** – Cài Figma MCP; đọc Figma Ticketor + BankDash; viết `docs/ui-design.md`. Chưa code.
- **2026-10-13** – Thêm cơ chế project memory (file này + skill `/update-context`).
