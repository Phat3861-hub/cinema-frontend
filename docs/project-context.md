# Project context – cinema-frontend

> Bộ nhớ dự án giữa các session. Được import vào `CLAUDE.md` nên tự động nạp ở đầu mỗi session.
> Cập nhật theo skill `/update-context` (rule CLAUDE.md §0). Ghi **trạng thái hiện tại**, không chép lại code hay git log.
> Trạng thái backend / API đã sẵn sàng: `../cinema-backend/docs/project-context.md` (mục 4).
>
> **Cập nhật lần cuối:** 2026-11-04 (dashboard + báo cáo doanh thu; nhánh `feature/report-ui`)

## 1. Trạng thái hiện tại
- `feature/auth-ui`, `feature/ui-modules` (PR #2), `feature/booking-ui` (PR #3) đã merge. `feature/booking-counter-ui` (POS, đơn đặt vé
  theo rạp, vé QR) đã commit, chờ PR; `feature/voucher-ui`, `feature/banner-offers-ui`, `feature/review-ui` đã commit + push. Nhánh **`feature/report-ui`**
  (tách từ `feature/review-ui`), **chưa commit**: dashboard + báo cáo doanh thu (backend `feature/report`). Lint / typecheck / build xanh.
- **Báo cáo** (`features/report`): `/admin/reports` một bộ lọc cho cả trang (Hôm nay / 7 / 30 ngày / Tháng này / Tùy chọn ≤ 92 ngày, chọn rạp): 4 thẻ số có % so kỳ trước, 5 tab
  Tổng quan (cột chồng vé + bắp nước, bảng theo ngày có dòng tổng) · Theo phim (≤ 50) · Theo rạp (chỉ `REPORT_VIEW_ALL` và đang xem tất cả rạp) · Bắp nước (thanh tỷ trọng theo nhóm + bảng món) ·
  Kênh bán. Mỗi tab có **Xuất CSV** phía client (`csv.ts`: BOM cho Excel, chặn công thức `= + - @`). Không có `REPORT_VIEW_ALL` ⇒ không có "Tất cả rạp", 1 rạp thì ẩn bộ chọn. `/admin` hiện khối
  `ReportOverview` (hôm nay, 7 ngày, biểu đồ, top 5 phim) khi có quyền báo cáo. Biểu đồ tự vẽ (`report-widgets.tsx`): hover / chạm / phím ← → hiện tooltip, màu `chart-1..4` trong `globals.css`
  theo thực thể (vé = 1, bắp nước = 2; POPCORN / DRINK / SNACK / COMBO = 1–4), đã chạy validator light + dark.
- **Đánh giá phim** (`features/movie/components/movie-reviews.tsx`, khối `#reviews` dưới lịch chiếu ở trang phim): thẻ tổng quan (điểm lớn
  theo locale "4,3", sao tô một phần, số đánh giá, thanh phân bố 5 → 1 là **nút lọc** `aria-pressed`); thẻ "Đánh giá của bạn" theo trạng thái
  (đang tải / chưa đăng nhập → link `/login?next=/movies/{slug}#reviews` / không có `REVIEW_CREATE` → ẩn / `NOT_WATCHED` / form viết /
  đã đánh giá → Sửa · Xóa (xác nhận) / bị ẩn → Alert lý do + ghi chú, chỉ Xóa); chọn sao = **radio native** vẽ thành sao (phím mũi tên,
  hover xem trước, nhãn Rất tệ → Tuyệt vời), nhận xét ≤ 1000 + bộ đếm; danh sách mới nhất trước + "Xem thêm" (cộng dồn trang theo bộ lọc).
  Sau khi ghi: tải lại summary rồi `setData` vào phim ⇒ hero "4.0 · 1 đánh giá" (`Rating` có `count`, link `#reviews`) đổi ngay. Vào trang bằng
  `#reviews` ⇒ tự cuộn tới khối sau khi summary tải (khối vẽ sau khi phim tải nên trình duyệt không tự nhảy). "Vé của tôi" tab Đã xem có
  nút **Đánh giá phim**. Admin `/admin/reviews` (`admin-reviews-screen.tsx`, `REVIEW_MODERATE`): lọc trạng thái / phim / số sao / từ khóa,
  phân trang 20, ẩn (hộp chọn lý do bắt buộc + ghi chú ≤ 255) / hiện lại, cột trạng thái hiện lý do, ghi chú, "Ẩn bởi … · giờ".
- **Banner** (`features/promotion/components/admin-banners-screen.tsx`, `/admin/banners`, `BANNER_MANAGE`): bảng thumbnail 8:3, lọc trạng
  thái, tìm; **↑/↓** gửi `PUT /banners/order` với đủ mọi id (chỉ hiện khi "Tất cả" + không có từ khóa), ẩn / hiện, xóa (xác nhận);
  hộp thêm/sửa: ảnh URL https + xem trước 8:3 có chữ, liên kết Không / Trang phim / Đường dẫn, thời gian giờ VN, bật hiển thị.
  Trang chủ: `BannerCarousel` (tự chuyển 6 s; dừng khi hover / focus / nút tạm dừng / `prefers-reduced-motion`; nút ←/→ + chấm có nhãn;
  slide ẩn dùng `inert`; h1 ẩn `sr-only`); không có banner hoặc lỗi ⇒ hero phim nổi bật như cũ.
- **Ưu đãi**: `OfferCard` (thẻ dạng vé: mức giảm, tối thiểu / trần, rạp, phim, hạn; Sao chép mã → toast; Đặt vé → trang phim hoặc `/movies`),
  trang `/offers` (`offers-screen.tsx`) + khu "Ưu đãi" trang chủ (≤ 4 voucher + "Xem tất cả", không có ⇒ 2 card tĩnh); link ở header + footer.
  Hộp voucher admin có ô "Hiển thị ở trang Ưu đãi" (`publicOffer`), danh sách có badge "Công khai".
- **Voucher** (`features/promotion/`): `/admin/vouchers` (`VOUCHER_MANAGE_GLOBAL` / `_CINEMA`) – lọc trạng thái (Segmented), phạm vi
  (người global: tất cả / toàn hệ thống / rạp đang chọn; người theo rạp: rạp ở topbar), tìm mã/tên; bảng có thanh lượt dùng, tạm dừng /
  bật lại, xóa chỉ khi chưa dùng; hộp thêm/sửa (loại % / số tiền, trần, tối thiểu, lượt, rạp, phim, thời gian giờ VN, dòng xem trước;
  đã dùng ⇒ khóa các trường điều khoản). `discountOf` (`promotion/discount.ts`) **lặp đúng công thức backend** (% làm tròn xuống, trần,
  ≤ subtotal; dưới tối thiểu ⇒ null). Online: `VoucherBox` ở bước Thanh toán (áp / gỡ, lỗi `VOUCHER_*` hiện dưới ô); đổi bắp nước làm
  backend tự gỡ mã ⇒ toast. POS: "Thêm voucher" → quote (không giữ lượt) → tính lại tại chỗ khi giỏ đổi, dưới tối thiểu ⇒ cảnh báo +
  khóa nút thu tiền; bán bị từ chối vì voucher ⇒ toast + bỏ mã. Dòng giảm giá hiện ở vé in, màn kết quả POS, vé điện tử, chi tiết đơn admin.
- **POS** `/admin/pos` (`features/booking/components/pos/`, `BOOKING_COUNTER_SELL`): giao diện cảm ứng nút lớn cho rạp đang chọn ở
  topbar – chọn suất (dải 7 ngày, giờ chiếu nhóm theo phim) → sơ đồ ghế cỡ lớn (`SeatMap size="lg"`, realtime, tối đa 8) + tab bắp
  nước (chạm = +1) + giỏ bên phải (bỏ ghế, stepper, thông tin khách tùy chọn) → hộp **thu tiền mặt** (bàn phím số, nút tiền gợi ý
  làm tròn lên mệnh giá, tiền thối) → màn kết quả (tiền thối, in vé, "Khách tiếp theo" giữ nguyên suất). `Idempotency-Key` sinh
  mỗi lần mở hộp thu tiền. Chỉ tiền mặt (VNPay làm sau).
- **Đơn đặt vé** `/admin/bookings` (`admin-bookings-screen.tsx`): rạp đang chọn, lọc ngày chiếu từ–đến (≤ 31), trạng thái, kênh,
  tìm khách; tra mã đơn riêng; bấm dòng → hộp chi tiết (vé, bắp nước, người bán) + **in lại vé**.
- **Vé điện tử** `/my-tickets/[bookingId]` (`booking-tickets.tsx`): `TicketCard` có QR (`qrcode.react` 4.2.0, nền trắng) từ
  `qr_token`; vé không VALID làm mờ. In vé: `PrintPortal` (`components/ui/print-portal.tsx`) gắn vào `body` + `@media print`
  trong `globals.css` ẩn mọi thứ khác → in đen trắng (`PrintableTickets`, 1 vé / trang + biên nhận).
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
- **Khách hàng**: trang chủ (carousel banner / hero phim nổi bật, đang/sắp chiếu, ưu đãi, FAQ), trang Ưu đãi, danh sách phim (lọc/tìm/sắp xếp/phân trang theo URL),
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
  khi đã có trong đơn), POS, đơn đặt vé, **voucher**, **banner**, **đánh giá**, **báo cáo**. Các mục chưa có API (check-in, hoàn tiền,
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
| Khách hàng | `/`, `/offers`, `/movies`, `/movies/[slug]`, `/cinemas`, `/cinemas/[slug]`, `/booking/[showtimeId]`, `/account`, `/my-tickets`, `/my-tickets/[bookingId]` | Xong với API hiện có; booking dừng ở bước thanh toán (chờ VNPay) |
| Admin nội dung | `/admin/movies(/new,/[id])`, `/admin/genres`, `/admin/banners`, `/admin/reviews` | Xong |
| Admin quầy vé | `/admin/pos`, `/admin/bookings` | Xong (chỉ tiền mặt) |
| Admin kinh doanh | `/admin/products`, `/admin/vouchers`, `/admin/reports` | Xong |
| Admin rạp | `/admin/cinemas(/new,/[id])`, `/admin/cinemas/[id]/rooms\|staff\|showtimes`, `/admin/rooms/[id]/layout`, `/admin/seat-types`; `/admin/rooms\|staff\|showtimes` chuyển tới rạp đang chọn | Xong |
| Admin hệ thống | `/admin/users`, `/admin/users/[id]`, `/admin/roles` | Xong (user chỉ tra theo ID) |

Đã test trên Chrome 2026-10-31: home / chi tiết phim / chọn ghế (light + dark, vi + en); admin với ADMIN, CINEMA_MANAGER,
TICKET_STAFF, CONTENT_MANAGER (menu đúng quyền, chặn URL không quyền, 403 rạp khác), tạo suất trùng giờ, lưu sơ đồ bị khóa
(`SEAT_LAYOUT_LOCKED`), khóa / mở ghế, hộp xác nhận quyền, gán role theo rạp, validation form phim.
Đã test trên Chrome 2026-11-01: giữ ghế → bắp nước → thanh toán → hủy; 2 tab cùng suất (ghế đổi trạng thái trực tiếp, ghế đang
chọn bị tab kia giữ → bỏ + toast); vé của tôi (đơn chờ thanh toán + hủy); admin bắp nước (CINEMA_MANAGER bị chặn, ADMIN sửa,
xóa sản phẩm đã có trong đơn → `PRODUCT_IN_USE`). Chưa test: hết giờ giữ ghế thật (10 phút), light theme / en của màn mới.
Đã test trên Chrome 2026-11-02: ADMIN mở `/admin/pos` → "Không có quyền", xem đơn của rạp + tra mã + chi tiết; staff2 (Hà Đông)
bán quầy 4 ghế (VIP + đôi) + bắp nước, thu tiền / tiền thối, "Khách tiếp theo"; 2 tab POS cùng suất (ghế bán ở tab kia đổi trạng thái
ngay, ghế đang chọn bị bán → bỏ + **1** toast); customer3 xem vé QR. Chưa test: in thật ra máy in, light theme / en của màn mới.
Đã test trên Chrome 2026-11-02 (voucher): CONTENT_MANAGER tạo voucher % (toàn hệ thống) + số tiền (rạp Hà Đông); manager2 chỉ thấy voucher
rạp mình; customer1 áp mã sai (lỗi dưới ô) → áp MIN300 → bớt bắp nước ⇒ tự gỡ + toast → áp GIAM20 → hủy đơn ⇒ trả lượt; staff2 POS áp
HADONG30, thu tiền 190.000 (đã trừ), biên nhận + chi tiết đơn admin có dòng voucher. Chưa test: light/dark + en của màn voucher, voucher theo phim.
Đã test trên Chrome 2026-11-02 (banner + ưu đãi): staff2 mở `/admin/banners` → "Không có quyền"; CONTENT_MANAGER tạo banner (lỗi URL http,
thiếu tiêu đề, thiếu phim) → xem trước → lưu, ↑/↓ đổi thứ tự, lọc "Sắp hiển thị", ẩn ⇒ trang chủ bớt banner; bật "Hiển thị ở trang Ưu đãi"
cho GIAM20; trang chủ carousel 2 banner (banner sắp hiển thị không hiện), khu Ưu đãi + `/offers`, Sao chép mã, light/dark, vi/en.
Sửa sau test: nút ← đè chữ banner, số tiền "30.000 ₫" bị bẻ dòng trong thẻ ưu đãi. Chưa test: link ngoài (tab mới), giảm chuyển động.
Đã test trên Chrome 2026-11-03 (đánh giá): khách chưa đăng nhập → nút Đăng nhập quay lại `#reviews`; customer1 gửi thiếu sao (lỗi) → chọn sao
bằng chuột + phím → → gửi ⇒ summary / danh sách / hero đổi ngay → sửa 4 → 5 sao; "Vé của tôi" → Đánh giá phim (cuộn tới khối); CONTENT_MANAGER
ẩn đánh giá (thiếu lý do → lỗi) → lọc "Đã ẩn", en + dark; customer1 thấy Alert lý do + ghi chú, chỉ còn Xóa → xóa ⇒ form hiện lại.
Sửa sau test: không tự cuộn tới `#reviews`, gợi ý "chưa có đánh giá" lặp 2 lần, nhãn "đã sửa" sai (ẩn / hiện cũng đổi `updatedAt` ⇒ bỏ nhãn).
Chưa test: "Xem thêm" (> 10 đánh giá), lọc theo số sao ở trang phim.
Đã test trên Chrome 2026-11-04 (báo cáo): ADMIN dashboard + 5 tab, đối chiếu tooltip và tổng kênh với DB, lọc rạp (tab Theo rạp tự ẩn), khoảng 92 ngày tự kẹp, CSV (tên file, BOM);
`manager2` chỉ thấy rạp mình, không có bộ chọn rạp; en + dark; màn 390px bằng iframe (không tràn ngang). Sửa sau test: tiêu đề lặp, số trong bảng chưa phân cách hàng nghìn,
en trùng nhãn `tickets` / `ticketRevenue` (lỗi trùng React key), "so với hôm qua" đổi thành "cả ngày hôm qua". Chưa test: phím ← → trên biểu đồ, tooltip khi chạm trên máy thật, file CSV mở bằng Excel.
Cửa sổ Chrome không resize được; muốn xem màn hẹp thì nhúng trang vào iframe 390px.

## 4. Bước tiếp theo
1. Chủ dự án review + commit nhánh `feature/report-ui` (lệnh PowerShell, không trailer Claude); thứ tự PR:
   `feature/booking-counter-ui` → `feature/voucher-ui` → `feature/banner-offers-ui` → `feature/review-ui` → `feature/report-ui`.
2. Upload ảnh banner khi backend có S3/MinIO (AUTH-07); hiện nhập URL https.
3. **(Tạm hoãn)** Backend PR 3 (`feature/payment-vnpay`): bật nút Thanh toán, trang chờ kết quả + bước Vé (dùng `TicketCard`), POS thêm
   VNPay QR. Sau đó check-in QR (`/admin/check-in`), hoàn tiền.
4. Tab Đặt vé trong chi tiết user (`/admin/users/[id]`, đang "Sắp có") – cần backend API booking theo user.
5. Kiểm tra giao diện mobile (DevTools device mode) cho header/drawer, sidebar admin, bảng suất chiếu, trình thiết kế ghế, luồng đặt vé.
6. Khi backend có API: danh sách user phân trang (thay màn tra theo ID), audit log.
7. Backend trả mô tả role bằng tiếng Anh (`description`) → cần dịch theo `code` hoặc backend thêm bản vi.

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
| 2026-11-02 | POS / đơn đặt vé dùng **rạp chọn ở topbar**, không có `cinemaId` trong URL (khác các trang theo rạp) | Màn làm việc cố định 1 rạp, không cần deep-link; cookie `admin_cinema` giữ rạp khi tải lại |
| 2026-11-02 | POS chỉ thu tiền mặt, máy tính tiền thối ở client (không gửi số tiền khách đưa lên backend) | Chủ dự án: VNPay làm sau; backend chưa có `payments` |
| 2026-11-02 | In vé bằng portal dưới `body` + `@media print`, không mở cửa sổ mới | Không bị chặn popup, in được cả từ trong `<dialog>`; dùng chung cho POS, đơn đặt vé, vé của khách |
| 2026-11-02 | POS dùng endpoint **voucher-quote** rồi tự tính giảm giá ở client khi giỏ đổi; bán gửi `voucherCode` để backend kiểm tra lại | Thu ngân thấy số phải thu trước khi nhận tiền mặt, không giữ lượt của mã khi khách đổi ý |
| 2026-11-02 | Carousel banner tự chuyển nhưng có nút tạm dừng, dừng khi hover / focus và tắt hẳn với `prefers-reduced-motion` | WCAG 2.2.2 (nội dung tự chuyển > 5 s phải dừng được) |
| 2026-11-02 | Khu "Ưu đãi" trang chủ: không có voucher công khai ⇒ giữ 2 card tĩnh; banner lỗi / trống ⇒ hero phim nổi bật | Trang chủ không bao giờ trống khi chưa có nội dung |
| 2026-11-04 | Biểu đồ báo cáo tự vẽ bằng HTML / CSS, không thêm thư viện; CSV xuất phía client | Chủ dự án chốt; chỉ cần cột chồng và thanh, backend không phải thêm endpoint |
| 2026-11-04 | Cột chồng là tiền **trước giảm giá**; tổng sau giảm nằm ở tooltip + bảng | Voucher áp cả đơn nên không chia được vào hai phần của cột; phụ đề biểu đồ ghi rõ |
| 2026-11-03 | Chọn sao bằng 5 `input type="radio"` native (ẩn `sr-only`) vẽ thành icon sao | Bàn phím (mũi tên) + trình đọc màn hình đúng sẵn, không phải tự viết radiogroup ARIA |
| 2026-11-03 | Không hiện "đã sửa" cho đánh giá | `updatedAt` cũng đổi khi kiểm duyệt ẩn / hiện ⇒ không phân biệt được khách sửa; cần cột `edited_at` ở backend nếu muốn |
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
- Dev overlay của Next báo "Could not validate … instant navigation" ở **mọi** trang admin (trang client-only sau `AdminGuard`) –
  chỉ là cảnh báo dev, không ảnh hưởng build.
- Bán quầy broadcast HELD rồi BOOKED liền nhau ⇒ `dropSeats` đọc lựa chọn qua ref (`selectedRef`) để không toast 2 lần (áp dụng cả
  `booking-screen.tsx`).
- Bấm nút ngay khi trang vừa tải (trước hydrate) không có tác dụng – bình thường với dev server.
- `Dialog` (`components/ui/dialog.tsx`) gọi `showModal()` trong effect ⇒ trình duyệt focus phần tử đầu tiên (nút đóng), nên `autoFocus` của ô
  trong mọi dialog (bắp nước, thể loại, nhân sự, voucher) không có tác dụng. Sửa: sau `showModal()` focus phần tử `[data-autofocus]` / ô đầu tiên.
- Skill `ui-ux-pro-max` ở `.claude/skills/SKILL.md` thiếu thư mục riêng + `scripts/` → không nạp được.

## 7. Nhật ký session (mới nhất trên cùng, giữ tối đa 10 dòng)
- **2026-11-04** – Đánh giá đã commit + push; nhánh `feature/report-ui`: `features/report`, khối doanh thu ở `/admin`, màn `/admin/reports` 5 tab + xuất CSV; test Chrome ADMIN + manager2, sửa 4 lỗi.
- **2026-11-03** – Banner + ưu đãi UI đã commit + push; nhánh `feature/review-ui`: khối đánh giá ở trang phim (tổng quan + lọc sao, viết / sửa / xóa, trạng thái bị ẩn), nút Đánh giá phim ở vé đã xem, màn admin kiểm duyệt; test Chrome customer1 + CONTENT_MANAGER, sửa 3 lỗi.
- **2026-11-02** – Voucher UI đã commit + push; nhánh `feature/banner-offers-ui`: màn admin Banner (lọc, ↑/↓, ẩn/hiện, xem trước), carousel banner trang chủ, trang `/offers` + khu Ưu đãi trang chủ, ô `publicOffer` ở voucher; test Chrome CONTENT_MANAGER, sửa 2 lỗi giao diện.
- **2026-11-02** – Nhánh `feature/voucher-ui`: màn quản lý voucher (lọc, thêm/sửa, tạm dừng, xóa), áp mã ở bước Thanh toán, voucher ở POS (quote + tính lại tại chỗ), dòng giảm giá ở vé / biên nhận / chi tiết đơn; i18n mã lỗi `VOUCHER_*`.
- **2026-11-02** – Nhánh `feature/booking-counter-ui`: POS cảm ứng (chọn suất, ghế lớn realtime, bắp nước, thu tiền mặt, in vé), đơn đặt vé theo rạp (lọc, tra mã, chi tiết, in lại), vé điện tử QR (`qrcode.react`), `PrintPortal`; sửa toast ghế bị lấy hiện 2 lần. Test Chrome ADMIN / staff2 / customer3, 2 tab POS.
- **2026-11-01** – Nhánh `feature/booking-ui`: `@stomp/stompjs`, hook ghế realtime, luồng đặt vé (giữ ghế + đếm ngược, bắp nước, xem đơn, hủy), vé của tôi theo tab, admin bắp nước, i18n + mã lỗi booking. Test Chrome 2 tab. Nâng Next 16.4.3 (lỗ hổng), sửa hydration warning do extension.
- **2026-10-31** – Nhánh `feature/ui-modules`: token ngữ nghĩa light/dark, i18n vi/en, bộ `components/ui`, màn khách hàng (home, phim, rạp, chọn ghế, tài khoản) + toàn bộ admin theo permission (phim, thể loại, rạp, phòng, sơ đồ ghế, loại ghế, suất chiếu, nhân sự, user, role). Seed dữ liệu test, test Chrome 4 role.
- **2026-10-30** – Nhánh `feature/auth-ui`: token Ticketor + Manrope, api-client refresh single-flight, các màn auth, `AdminGuard`.
- **2026-10-28** – Cài Figma MCP; đọc Figma Ticketor + BankDash; viết `docs/ui-design.md`. Chưa code.
- **2026-10-13** – Thêm cơ chế project memory (file này + skill `/update-context`).
