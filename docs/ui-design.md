# UI design – nguồn Figma, design system, đặc tả màn hình

> Tài liệu gốc cho **giao diện**: đọc trước khi code bất kỳ màn hình nào (CLAUDE.md §8).
> Figma chỉ là **tham khảo bố cục / phong cách**. Dữ liệu, trường, trạng thái và quyền theo backend (file này đã đối chiếu
> với code `cinema-backend` nhánh `feature/cinema-api`, 2026-10-28). Có chỗ nào khác Figma thì làm theo file này.
> Tiến độ màn hình: `docs/project-context.md` mục 3.

## 1. Nguồn thiết kế

| Phần | File Figma | fileKey | Dùng cho |
|---|---|---|---|
| Khách hàng | [Ticketor – cinema ticket booking (Community)](https://www.figma.com/design/RmCMCVxKPk9qXsUNZdBYMu/) | `RmCMCVxKPk9qXsUNZdBYMu` | Toàn bộ phong cách (màu, chữ, component) + màn khách hàng |
| Admin | [BankDash – Dashboard UI Kit (Community)](https://www.figma.com/design/2DEbEqGltv8XWHISuGuJA4/) | `2DEbEqGltv8XWHISuGuJA4` | **Chỉ bố cục** admin (sidebar, topbar, card, bảng, tab, form, phân trang, responsive) |

**Frame tham chiếu Ticketor** (trang `✒️ UI` = `1:12`; `⚙️ Foundation` = `1:5`; `✒️ Component` = `1:13`; `💎 Icons` = `1:14`):

| Màn | Node | Ghi chú |
|---|---|---|
| Sign in / lỗi email / lỗi mật khẩu | `4145:28541`, `4145:28605`, `4148:20952` | Form trái 362px, ảnh phải 816px |
| Sign up | `4145:28727` | |
| Verification (OTP) | `4145:28798`, `4159:22037` | **Không dùng OTP** – xem §4.1 |
| Forgot password (4 bước) | `4232:22156` → `4232:22211` | |
| Home | `4232:29286` | |
| Movie Details | `4235:22720` | |
| Time / Cinema selection | `4235:24272` | |
| Seat Selection | `4235:27274` | |
| Food & Drink | `4236:32292` | |
| Payment / Loading / Check out (thành công) | `4236:35621`, `4236:35870`, `4236:35940` | |
| Profile: Manage Tickets / Ticket / Watchlist / Dashboard | `4281:26337`, `4281:26485`, `4281:26384`, `4281:27425` | |
| Foundation: Color / Typography / Radius / Spacing / Grid | `1496:11890`, `1496:11925`, `1496:12412`, `1496:12654`, `1496:12120` | |

**Frame tham chiếu BankDash** (trang `😍 Design` = `0:1`): Dashboard `78:351`, Transaction (bảng + tab + phân trang) `105:0`,
Accounts `101:0`, Setting (form 2 cột + tab) `112:279` / `112:504` / `112:699`, Loans (bảng nhiều cột) `101:677`,
Services `112:941`; bản Tablet `147:4`… (1024px), Mobile `169:3352`… (375px).

Lấy chi tiết một frame: Figma MCP `get_design_context` / `get_screenshot` với `fileKey` + node ở trên.

## 2. Design tokens (theo Ticketor)

Đọc từ variables/styles của file Ticketor. Khi code: khai báo trong `src/app/globals.css` bằng `@theme` (Tailwind 4)
rồi dùng class (`bg-primary`, `text-neutral-300`…) – **không** viết hex trong component.

**Màu**
| Token | Hex | Dùng |
|---|---|---|
| `primary` | `#FCFC65` | Nút chính, mục đang chọn, ghế đang chọn, bước hiện tại. **Chữ trên nền primary luôn là `black`** |
| `primary-100` | `#FAFAE8` | Nền nhạt của primary (admin light) |
| `primary-900` | `#3A3A04` | Ghế đã bán / nền tối của primary; chữ nhấn trên nền sáng (thay vì vàng) |
| `secondary-600` | `#74CFCF` | Link phụ, địa chỉ rạp, câu cảm ơn (teal) |
| `black` | `#010108` | Nền trang khách hàng |
| `white` | `#FFFFFF` | Chữ chính trên nền tối |
| `neutral-50 / 100 / 200 / 300 / 400` | `#F1F1F3` `#E0E0E4` `#BCBCC6` `#9797AA` `#7C7C8D` | Chữ phụ, placeholder, viền sáng |
| `neutral` (500) | `#565669` | |
| `neutral-600 / 700 / 800 / 850` | `#454555` `#353541` `#25252C` `#1A1A1F` | Viền, input, card, ghế không bán |
| `danger` / `success` | tự chọn (đỏ / xanh, đạt tương phản 4.5:1 trên `black`) | Ticketor không định nghĩa – lỗi form, badge trạng thái |

**Chữ** – font **Manrope** (`next/font/google`, subset `latin` + `vietnamese`); Ticketor dùng Inter cho vài nút/body nhỏ → bỏ, dùng Manrope hết.
| Style | Size / weight / line-height |
|---|---|
| Header/4 | 32 / 700 / 1.4 – tiêu đề trang |
| Header/6 | 24 / 700 / 1.4 – tiêu đề section |
| Header/8 | 16 / 700 / 1.5 |
| Body/M | 16 / 400 / 1.4 – nội dung |
| Body/S | 14 / 500 / 1.37 |
| Body/Xs | 12 / 600 / 1.4 |
| Lable/L · Lable/M | 14 / 500 · 12 / 500 – nhãn form, chú thích |
| Button/L · Button/XL | 16 / 500 · 16 / 700 |
Các style còn lại (`Dispaly/*`, `Header/1-3,5,7`, `Body/XXL-L`…) xem frame Typography `1496:11925` khi cần.

**Hình khối** (đọc từ ảnh chụp, kiểm lại ở Foundation `1496:12412` / `1496:12654`): nút / input / ô giờ chiếu bo `4px`,
card bo `8px`, navbar dạng "viên thuốc" bo `8px`; container `1232px` (lề 104px ở 1440); khoảng cách bội số 4/8.

## 3. Nguyên tắc chung

- **Khách hàng: chỉ dark theme** (nền `black`, đúng Ticketor). **Admin: light mặc định + dark mode** (`dark:`), xem §5.1.
- Tên thương hiệu **PNT Cinema** (thay logo "Ticketor"; admin: "PNT Admin").
- Text tiếng Việt; tiền **VND** `90.000 ₫` (`Intl.NumberFormat('vi-VN')`, helper trong `lib/format.ts`), ngày `dd/MM/yyyy`,
  giờ 24h, khoảng cách **km** (Ticketor dùng Mi / $ / 12h → đổi hết).
- Backend trả tiếng Anh → dịch theo mã: lỗi theo `code`, thể loại theo `slug`, độ tuổi `P K T13 T16 T18`, trạng thái phim
  `NOW_SHOWING / COMING_SOON / ENDED`, loại phòng `2D 3D IMAX 4DX`, role / permission theo `code`.
- Badge độ tuổi: `P` xanh lá, `K` xanh dương, `T13` vàng, `T16` cam, `T18` đỏ (kèm chữ, không chỉ dùng màu).
- Điểm đánh giá: `avgRating` thang **1–5 sao** (Ticketor dùng thang 10 → đổi); `null` thì ẩn.
- Icon: một bộ SVG thống nhất (đề xuất `lucide-react`, nét 1.5–2px giống Ticketor), không dùng emoji.
- Ảnh: `posterUrl`, `imageUrl` dùng `next/image`; thiếu ảnh → placeholder `neutral-800` + icon.
- Mọi khối chờ dữ liệu có skeleton; danh sách rỗng có empty state; lỗi có retry.

## 4. Màn khách hàng – Figma → route → API → điều chỉnh

API: ✅ đã có · ⏳ backend chưa làm (dựng UI với dữ liệu giả / ẩn khối cho tới khi có).

### 4.1 Auth – route group `(auth)`, bố cục Sign in `4145:28541`
| Route | Figma | API | Điều chỉnh so với Figma |
|---|---|---|---|
| `/login` | Sign in | ✅ `POST /auth/login` | Bỏ "Remember me" (refresh token cookie đã 7 ngày). Ẩn "Continue with Google" tới khi có AUTH-03. Lỗi `INVALID_CREDENTIALS` hiện chung dưới form (không nói sai email hay mật khẩu – Figma có 2 màn lỗi riêng, gộp lại). Tài khoản `PENDING` → gợi ý gửi lại mail xác thực. Đăng nhập xong: có quyền admin → `/admin`, ngược lại về trang trước |
| `/register` | Sign up | ✅ `POST /auth/register` | Trường: **Họ tên**, Email, **Số điện thoại (không bắt buộc, số VN)**, Mật khẩu, Nhập lại mật khẩu. Gợi ý mật khẩu: 8–72 ký tự, có chữ thường + chữ hoa + số, không khoảng trắng |
| `/register/check-email` | thay màn Verification | ✅ `POST /auth/resend-verification` | **Backend xác thực bằng link, không có OTP** → bỏ ô nhập 4–6 số; thay bằng "Kiểm tra email của bạn" + nút gửi lại (đếm ngược 60s) |
| `/verify-email?token=` | (mới, dùng khung Verification) | ✅ `POST /auth/verify-email` | Trạng thái: đang xác thực / thành công → nút Đăng nhập / link hết hạn → gửi lại |
| `/forgot-password` | Forgot password bước 1–2 | ✅ `POST /auth/forgot-password` | Nhập email → luôn hiện "nếu email tồn tại, chúng tôi đã gửi link" (link hết hạn 15 phút) |
| `/reset-password?token=` | Forgot password bước 3–4 | ✅ `POST /auth/reset-password` | Mật khẩu mới + nhập lại → thành công → Đăng nhập |

### 4.2 Khung trang `(main)`
- **Navbar** (2 viên thuốc như Figma): logo · Phim · Rạp | tìm kiếm · Đăng nhập / Đăng ký **hoặc** avatar + tên → menu:
  Tài khoản, Vé của tôi, **Trang quản trị** (chỉ khi user có ít nhất 1 permission admin, xem §5.3), Đăng xuất.
  Mobile: hamburger → drawer.
- **Footer**: logo, mô tả ngắn, cột Phim (Đang chiếu, Sắp chiếu) / Rạp / Hỗ trợ (FAQ, Liên hệ); bỏ link "Get the App".

### 4.3 Trang khách hàng
| Route | Figma | API | Điều chỉnh |
|---|---|---|---|
| `/` | Home `4232:29286` | ✅ movies; ⏳ banners | Hero: banner tĩnh tới khi có PRO-03. **Bỏ** dải số liệu "500+ / 150+ / 1M+", logo đối tác, khối tải app, testimonials, newsletter (không có dữ liệu). **Giữ**: "Phim đang chiếu" (`status=NOW_SHOWING`), "Phim sắp chiếu" (`COMING_SOON`, hiện ngày khởi chiếu), "Ưu đãi" (2 card như "Horror Film Festival" – tĩnh, sau thay bằng banner/voucher), FAQ tĩnh. "Top 10 tuần này" → tạm thay bằng `sort=avgRating,desc` hoặc ẩn |
| `/movies` | (không có – ghép từ card Home + filter Time Selection) | ✅ `GET /movies` | Tab Đang chiếu / Sắp chiếu, lọc thể loại (slug), độ tuổi, ngôn ngữ, tìm kiếm (`keyword`, không dấu), sắp xếp, phân trang |
| Movie card (component) | card Home | – | poster 2:3, tên, thể loại, thời lượng, badge độ tuổi, sao (nếu có) |
| `/movies/[slug]` | Movie Details `4235:22720` | ✅ `/movies/slug/{slug}`; ⏳ showtimes | Hero: poster + **trailer** (`trailerUrl`, embed YouTube khi bấm play). Tóm tắt, Đạo diễn, **Diễn viên = chuỗi `castMembers` hiển thị dạng chip – bỏ lưới ảnh diễn viên**, thể loại, ngôn ngữ, quốc gia, thời lượng, ngày chiếu. Nút "Mua vé" → khối lịch chiếu (§ dưới). **Bỏ** "Add to Favorites" (không có watchlist). Khối "User Reviews" ẩn tới khi có MOV-05 (giai đoạn 2) – khi làm: thang 5 sao |
| Lịch chiếu (trong chi tiết phim) | Time/Cinema selection `4235:24272` | ✅ cities, cinemas; ⏳ showtimes (SHO-04) | Dải 7 ngày, chọn **thành phố** (`/cinemas/cities`), chọn rạp, nút **"Gần tôi"** (Geolocation → `lat,lng` → `distanceKm`), lọc định dạng 2D/3D/IMAX/4DX (theo `roomType`). Mỗi rạp: tên, địa chỉ (teal), khoảng cách km; các suất nhóm theo định dạng + phụ đề/lồng tiếng; suất đã qua giờ disable. Bấm suất → `/booking/[showtimeId]` (bỏ nút "Continue") |
| `/cinemas` | (không có – dùng card rạp ở Time Selection) | ✅ `/cinemas`, `/cinemas/cities` | Lọc thành phố, tìm kiếm, "Gần tôi"; card: ảnh, tên, địa chỉ, quận, SĐT, km. Không phân trang (backend trả hết) |
| `/cinemas/[slug]` | (mới) | ✅ `/cinemas/slug/{slug}`; ⏳ showtimes | Thông tin rạp + lịch chiếu theo ngày của rạp |
| `/booking/[showtimeId]` bước **Ghế** | Seat Selection `4235:27274` | ⏳ showtime seats + WebSocket | Thanh bước: **Ghế → Bắp nước → Thanh toán → Vé**. Lưới ghế dựng từ layout (hàng A..; `.` = lối đi; **ghế đôi chiếm 2 ô** và chọn cả cặp). **Bỏ Adult / Senior / Child** – backend không có loại vé; giá ghế = giá suất + phụ thu loại ghế. Chú thích: Trống · Đang chọn (`primary`) · Đã bán / đang giữ (`primary-900`) · Không bán (`neutral-600`); loại ghế Thường / VIP / Đôi phân biệt bằng viền màu `seatType.color` + chú thích. Cột phải: danh sách ghế đã chọn + giá từng ghế, tổng tiền VND, nút "Tiếp tục" → giữ ghế 10 phút (**đồng hồ đếm ngược** hiện ở mọi bước sau); lỗi `SEAT_NOT_AVAILABLE` → bỏ ghế đó + toast. Trạng thái ghế realtime qua STOMP (CLAUDE.md §5) |
| bước **Bắp nước** | Food & Drink `4236:32292` | ⏳ products (BOK-03) | Giữ bố cục lưới + stepper số lượng; nút "Bỏ qua". Không có sản phẩm → tự bỏ qua bước |
| bước **Thanh toán** | Payment `4236:35621`, Loading `4236:35870` | ⏳ payment | Phương thức VNPay / MoMo / Stripe (sandbox), ô voucher (1 voucher/đơn), tóm tắt đơn (ghế, bắp nước, giảm giá, tổng). Gửi `Idempotency-Key`; chuyển hướng sang cổng → trang chờ kết quả |
| bước **Vé** / `/booking/[id]/result` | Check out `4236:35940` | ⏳ booking | "Thanh toán thành công": mã đặt vé + **QR code** (thay barcode), phim, rạp, **phòng**, ngày giờ, ghế, bắp nước, tổng VND; thông tin khách lấy từ `/auth/me` (họ tên, email, SĐT). Nút "Tải vé" (PDF/ảnh), "Vé của tôi". Thất bại / hết hạn giữ ghế → màn lỗi + quay lại chọn ghế |
| `/my-tickets` | Profile/Manage Tickets `4281:26337` | ⏳ bookings | Sidebar tài khoản (dưới). "Sắp tới" / "Đã xem" (+ "Đã hủy / hoàn tiền"); dòng: poster, tên phim, ngày giờ, rạp, số vé + ghế, badge trạng thái, "Chi tiết" |
| `/my-tickets/[bookingId]` | Profile/Manage Tickets/Ticket `4281:26485` | ⏳ | Vé có QR, nút yêu cầu hoàn tiền (`REFUND_REQUEST`, theo điều kiện docs backend §5.4) |
| `/account` | Profile/Dashboard `4281:27425` + form Setting BankDash | ✅ `/auth/me`; ⏳ cập nhật hồ sơ (AUTH-07) | Thông tin tài khoản; tab **Đổi mật khẩu** (✅ `POST /auth/change-password`) và **Đăng xuất mọi thiết bị** (✅ `POST /auth/logout-all`) |

**Sidebar tài khoản** (Profile): Tài khoản · Vé của tôi · Điểm thưởng (⏳ PRO-02, ẩn tới khi có) · Đăng xuất.
**Bỏ** My Wallet, Payments, My Watchlist (không có trong nghiệp vụ).

## 5. Admin – bố cục BankDash, phong cách Ticketor

### 5.1 Khung (`src/app/admin/layout.tsx`)
- **Sidebar** 250px (BankDash `78:351`): nền `black`, logo "PNT Admin", menu nhóm theo §5.2, mục đang chọn: thanh dọc
  `primary` bên trái + chữ `primary`; mục khác `neutral-300`. Tablet (≥768 <1280): thu gọn còn icon; mobile: drawer.
- **Topbar** cao ~100px: tiêu đề trang (Header/4) · **bộ chọn rạp** (§5.3) · ô tìm kiếm (tùy trang) · avatar → menu
  (Về trang khách hàng, Đổi mật khẩu, Đăng xuất). Bỏ nút settings / chuông của BankDash tới khi có SYS-02.
- **Nội dung**: nền `neutral-50` (dark: `neutral-850`), card trắng (dark: `neutral-800`) bo **16px** (BankDash dùng 25px – giảm cho hợp Ticketor),
  không bóng đổ nặng. Nút chính: nền `primary` + chữ `black`; nút phụ: viền `neutral-700`/`black`; nút nguy hiểm: `danger`.
  **Không dùng chữ vàng trên nền sáng** (tương phản kém) – dùng `primary-900` hoặc `black`.
- Mẫu chung từ BankDash: tiêu đề section + link "Xem tất cả"; **bảng** có tab lọc phía trên + phân trang "Trước 1 2 3 Sau"
  (`105:0`); **form 2 cột** có tab (`112:279`); card thống kê + biểu đồ (`78:351`).
- Trạng thái chung: skeleton bảng; empty state có nút tạo mới; dialog xác nhận cho thao tác phá hủy (xóa, khóa user, gỡ role);
  toast thành công / lỗi (dịch theo `code`); **403** → trang "Bạn không có quyền với rạp / chức năng này".

### 5.2 Menu admin – route – quyền – API
Mục menu **chỉ hiện khi user có ít nhất một permission** trong cột Quyền (lấy `permissions` từ `/auth/me`).
Backend vẫn là nơi kiểm tra thật (CLAUDE.md §6). Mục ⏳ có thể dựng trước UI khung, hiển thị "Sắp có".

| Nhóm | Mục | Route | Quyền (một trong) | API |
|---|---|---|---|---|
| Tổng quan | Dashboard | `/admin` | `REPORT_VIEW_ALL`, `REPORT_VIEW_CINEMA` (không có → trang chào + lối tắt) | ⏳ SYS-03 |
| Quầy vé | Bán vé tại quầy (POS) | `/admin/pos` | `BOOKING_COUNTER_SELL` | ⏳ BOK-09 |
| | Check-in QR | `/admin/check-in` | `TICKET_CHECKIN` | ⏳ BOK-10 |
| | Đặt vé | `/admin/bookings` | `BOOKING_VIEW_CINEMA`, `BOOKING_VIEW_ALL` | ⏳ |
| | Hoàn tiền | `/admin/refunds` | `REFUND_APPROVE` | ⏳ PAY-03 |
| Nội dung | Phim | `/admin/movies`, `/new`, `/[movieId]` | `MOVIE_MANAGE` | ✅ |
| | Thể loại | `/admin/genres` | `GENRE_MANAGE` | ✅ |
| | Banner | `/admin/banners` | `BANNER_MANAGE` | ⏳ PRO-03 |
| | Đánh giá | `/admin/reviews` | `REVIEW_MODERATE` | ⏳ MOV-06 |
| Rạp & lịch chiếu | Cụm rạp | `/admin/cinemas`, `/new`, `/[cinemaId]` | `CINEMA_MANAGE` | ✅ |
| | Phòng chiếu | `/admin/cinemas/[cinemaId]/rooms` | `ROOM_MANAGE`, `SEAT_LAYOUT_MANAGE`, `SEAT_BLOCK` | ✅ |
| | Sơ đồ ghế | `/admin/rooms/[roomId]/layout` | sửa: `SEAT_LAYOUT_MANAGE`; khóa ghế: `SEAT_BLOCK` | ✅ |
| | Loại ghế & phụ thu | `/admin/seat-types` | `CINEMA_MANAGE` | ✅ |
| | Suất chiếu | `/admin/showtimes` | `SHOWTIME_MANAGE` (giá: `PRICE_MANAGE`) | ⏳ SHO-01..03 |
| | Nhân viên rạp | `/admin/cinemas/[cinemaId]/staff` | `STAFF_ASSIGN` | ✅ |
| Kinh doanh | Voucher | `/admin/vouchers` | `VOUCHER_MANAGE_GLOBAL`, `VOUCHER_MANAGE_CINEMA` | ⏳ PRO-01 |
| | Bắp nước | `/admin/products` | `PRODUCT_MANAGE` | ⏳ |
| | Báo cáo | `/admin/reports` | `REPORT_VIEW_ALL`, `REPORT_VIEW_CINEMA` | ⏳ |
| Hệ thống | Người dùng | `/admin/users`, `/[userId]` | `USER_MANAGE` | ✅ chi tiết / khóa / role; ⏳ **danh sách** |
| | Vai trò & quyền | `/admin/roles` | `ROLE_MANAGE` | ✅ (⏳ tạo / xóa role) |
| | Audit log | `/admin/audit-logs` | `AUDIT_LOG_VIEW` | ⏳ SYS-04 |

**Menu mà mỗi role seed (V2) nhìn thấy** – để kiểm tra khi test:
| Role | Phạm vi | Thấy |
|---|---|---|
| `CUSTOMER` | toàn hệ thống | không vào được `/admin` (proxy chuyển về `/`) |
| `TICKET_STAFF` | theo rạp | POS, Check-in, Đặt vé (rạp mình) |
| `CINEMA_MANAGER` | theo rạp | Dashboard (rạp), POS, Check-in, Đặt vé, Hoàn tiền, Phòng, Sơ đồ ghế, Suất chiếu, Nhân viên rạp, Voucher (rạp), Báo cáo (rạp) |
| `CONTENT_MANAGER` | toàn hệ thống | Phim, Thể loại, Banner, Đánh giá, Voucher (toàn hệ thống) |
| `ADMIN` | toàn hệ thống | tất cả trừ POS (không có `BOOKING_COUNTER_SELL`) |
User có nhiều role → hợp các menu. Role mới do admin tạo tự khớp vì menu dựa trên permission, không dựa trên tên role.

### 5.3 Bộ chọn rạp (topbar)
- Dữ liệu `GET /cinemas/managed`: global staff → mọi rạp (cả `INACTIVE`, gắn badge "Tạm đóng"); staff theo rạp → rạp của mình; 1 rạp → hiện tên, không dropdown.
- Rạp đang chọn nằm trong URL (`/admin/cinemas/[cinemaId]/...`) để deep-link được; nhớ lựa chọn gần nhất (cookie, không localStorage).
- Trang theo rạp: Phòng, Sơ đồ ghế, Nhân viên, (sau) Suất chiếu, Đặt vé, Hoàn tiền, POS, Check-in, Báo cáo rạp.
- `permissions` trong `/me` không biết rạp → vẫn có thể nhận **403** khi thao tác sai rạp; hiện trang 403 thân thiện.

### 5.4 Đặc tả màn admin đã có API
| Màn | Bố cục mẫu | Nội dung |
|---|---|---|
| **Phim – danh sách** | Bảng `105:0` | Tab trạng thái (Tất cả / Đang chiếu / Sắp chiếu / Đã kết thúc), tìm kiếm, lọc thể loại / độ tuổi. Cột: poster nhỏ + tên, thể loại, thời lượng, ngày khởi chiếu – kết thúc, độ tuổi, trạng thái (badge – **chỉ đọc**, backend tự suy ra từ ngày), thao tác (sửa, xóa → dialog). Phân trang `PageResponse` |
| **Phim – form** | Form 2 cột `112:279` | Trái: upload/nhập `posterUrl` + xem trước 2:3. Phải: tên*, mô tả, thời lượng (phút)*, ngày khởi chiếu*, ngày kết thúc, độ tuổi* (P/K/T13/T16/T18), ngôn ngữ, quốc gia, đạo diễn, diễn viên (chuỗi), trailer URL (xem trước), thể loại (multi-select). Slug hiển thị chỉ đọc sau khi tạo (không đổi khi sửa tên). Lỗi `VALIDATION_FAILED` gắn vào từng field |
| **Thể loại** | Bảng gọn + dialog | Tên, slug (chỉ đọc), số phim (nếu có); thêm / sửa tên trong dialog; xóa bị chặn `GENRE_IN_USE` → thông báo rõ |
| **Cụm rạp – danh sách** | Bảng | Tìm kiếm, lọc thành phố, trạng thái. Cột: ảnh, tên, thành phố / quận, địa chỉ, SĐT, trạng thái (Hoạt động / Tạm đóng), thao tác (sửa, phòng, nhân viên, xóa mềm → cảnh báo "gỡ mọi role gắn rạp") |
| **Cụm rạp – form** | Form 2 cột | tên*, địa chỉ*, thành phố*, quận, SĐT, vĩ độ / kinh độ (nhập cặp; nút "lấy từ bản đồ" – tùy chọn), ảnh, trạng thái |
| **Phòng chiếu** | Lưới card (Accounts `101:0`) | Mỗi phòng: tên, loại (2D/3D/IMAX/4DX), kích thước hàng × cột, số ghế bán được, trạng thái (Hoạt động / Bảo trì); nút Sơ đồ ghế, Sửa, Xóa. Tạo phòng: tên, loại + chọn mẫu lưới ban đầu |
| **Thiết kế sơ đồ ghế** | màn mới (mượn lưới ghế Seat Selection) | Thanh công cụ "cọ vẽ": Thường `S` · VIP `V` · Đôi `C` (luôn 2 ô liền) · Lối đi `.`; thêm / bớt hàng, cột; tô theo ô / kéo chọn vùng / cả hàng. Màn hình "MÀN HÌNH" phía trên, nhãn hàng A.. hai bên, số ghế bỏ qua lối đi. Panel phải: chú thích + phụ thu từng loại, tổng ghế theo loại, nút Lưu (`PUT /rooms/{id}/layout`, gửi `grid`). Chế độ **Khóa ghế** (`SEAT_BLOCK`): bấm ghế → bật / tắt `active` (ghế đôi khóa cả cặp), ghế khóa gạch chéo. Cảnh báo khi rời trang chưa lưu |
| **Loại ghế & phụ thu** | Bảng gọn | STANDARD / VIP / COUPLE (mã cố định): tên, phụ thu VND, màu (color picker hex); sửa inline |
| **Nhân viên rạp** | Bảng + dialog | Cột: họ tên, email, vai trò (Nhân viên quầy / Quản lý rạp), trạng thái tài khoản, ngày gán, thao tác gỡ. "Thêm nhân viên" → nhập email (user phải đã đăng ký) → gán `TICKET_STAFF`. Quản lý rạp do ADMIN gán ở màn Người dùng |
| **Người dùng – danh sách** | Bảng + tab | Tab trạng thái (Tất cả / Hoạt động / Chưa xác thực / Đã khóa), tìm theo email / tên, lọc role. Cột: họ tên + email, SĐT, vai trò (chips), trạng thái, lần đăng nhập cuối, ngày tạo. **Cần API danh sách** (backend chưa có) – trước mắt: ô tìm user theo id / email |
| **Người dùng – chi tiết** | Setting `112:279` (tab) | Header: tên, email, badge trạng thái, nút **Khóa / Mở khóa** (dialog: "thu hồi mọi phiên đăng nhập"; ẩn với chính mình). Tab **Vai trò**: bảng role (tên role dịch, phạm vi, rạp nếu CINEMA, ngày gán, Gỡ – không cho tự gỡ ADMIN của mình) + nút **Gán vai trò** → dialog: chọn role → nếu role phạm vi CINEMA thì **bắt buộc chọn rạp**, role GLOBAL ẩn ô rạp. Tab Đặt vé (⏳) |
| **Vai trò & quyền** | màn mới | Trái: danh sách role (tên dịch, mã, phạm vi Toàn hệ thống / Theo rạp, số permission, badge "Hệ thống"). Phải: **ma trận** permission nhóm theo `module` (MOVIE, CINEMA, SHOWTIME, BOOKING, PAYMENT, PROMOTION, REPORT, USER, SYSTEM), mỗi dòng: tên permission dịch + mã + checkbox; "chọn cả nhóm". Role **ADMIN khóa** (chỉ xem, backend trả 409). Lưu → dialog liệt kê thêm / bớt, ghi chú "có hiệu lực sau ≤ 15 phút (lần refresh token kế tiếp)" → `PUT /roles/{id}/permissions` (gửi toàn bộ danh sách). Chế độ xem phụ: bảng ma trận role × permission để so sánh |

## 6. Khoảng trống backend cần cho UI
(Đã ghi sang `cinema-backend/docs/project-context.md` – Bước tiếp theo.)
- `GET /api/v1/users` phân trang + lọc (keyword, status, roleCode) – màn Người dùng.
- `POST /api/v1/roles`, `PUT /api/v1/roles/{id}` (tên / mô tả), `DELETE /api/v1/roles/{id}` (chặn role hệ thống / đang dùng) – "admin tạo role mới không sửa code" (docs backend §3).
- Hồ sơ cá nhân AUTH-07 (`PUT /auth/me`, avatar) – màn Tài khoản.
- Thống kê dashboard (SYS-03), showtime, booking, payment, voucher, product, banner, review, audit log – theo lộ trình backend.

## 7. Figma – trạng thái và việc còn lại
- 2026-10-28: Figma MCP đã cài (user scope, `https://mcp.figma.com/mcp`) và đọc được 2 file. **Gói Starter hết lượt gọi
  MCP** ngay sau khi đọc → chưa sửa được file Figma. File này là bản đặc tả thay thế.
- Khi có lượt (nâng gói / sang tháng), việc sửa Figma (làm trên **bản duplicate** của Ticketor trong Drafts, không sửa trang gốc):
  1. Page `🛠 PNT Admin`: component Sidebar / Topbar / Bảng / Badge / Dialog theo §5.1, các màn §5.4.
  2. Page `🎬 PNT Khách hàng`: duplicate các frame §4 rồi sửa theo cột "Điều chỉnh" (VND, tiếng Việt, bỏ loại vé, OTP → link…).
- Không bắt buộc: có thể code thẳng theo file này rồi dùng `generate_figma_design` để đẩy giao diện đã code ngược vào Figma.
