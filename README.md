# 🎬 Cinema Ticket Booking – Frontend

Giao diện web cho hệ thống đặt vé xem phim: trang khách hàng (xem phim, chọn ghế realtime, thanh toán, vé QR) và trang quản trị (phim, suất chiếu, đặt vé, người dùng).

> Backend: repo [`cinema-backend`](../cinema-backend) (Spring Boot). Tài liệu nghiệp vụ và ERD nằm trong `cinema-backend/docs/`.

## Tech stack

| Mảng | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components), React 19 |
| Ngôn ngữ | TypeScript |
| Styling | Tailwind CSS 4 |
| Lint | ESLint 9 (`eslint-config-next`) |

## Cấu trúc dự án

```
cinema-frontend/
├── public/                        # Ảnh, icon tĩnh
├── .env.example                   # Mẫu biến môi trường
└── src/
    ├── app/                       # Routing (App Router)
    │   ├── layout.tsx             # Root layout: font, metadata
    │   ├── not-found.tsx
    │   ├── (main)/                # Trang khách hàng – có header/footer
    │   │   ├── page.tsx           #   /
    │   │   ├── movies/            #   /movies, /movies/[slug]
    │   │   ├── cinemas/           #   /cinemas
    │   │   ├── booking/[showtimeId]/  /booking/123 – chọn ghế, thanh toán
    │   │   └── my-tickets/        #   /my-tickets
    │   ├── (auth)/                # /login, /register – layout form căn giữa
    │   └── admin/                 # /admin/** – layout có sidebar
    ├── components/
    │   ├── layout/                # Header, footer, sidebar admin
    │   └── ui/                    # Component UI dùng chung (button, input, modal...)
    ├── features/                  # Code theo nghiệp vụ: api, component, hook, type riêng
    │   ├── auth/  movie/  cinema/  showtime/  booking/  payment/  admin/
    ├── hooks/                     # Custom hook dùng chung
    ├── lib/
    │   ├── api-client.ts          # apiFetch(): gọi backend, bóc ApiResponse, ném ApiError
    │   ├── env.ts                 # Đọc biến môi trường NEXT_PUBLIC_*
    │   └── format.ts              # Định dạng tiền VND, thời lượng phim
    ├── constants/routes.ts        # Toàn bộ đường dẫn của app
    └── types/api.ts               # ApiResponse, PageResponse (khớp với backend)
```

**Nguyên tắc tổ chức**
- `app/` chỉ chứa routing và layout. Logic nghiệp vụ nằm trong `features/<module>/`.
- Route group `(main)`, `(auth)` dùng để tách layout và **không** xuất hiện trên URL.
- Component chỉ dùng trong 1 feature thì đặt trong feature đó; dùng từ 2 nơi trở lên thì đưa vào `components/`.

## Chạy dự án

**Yêu cầu:** Node.js 20+. Backend chạy ở `http://localhost:8080`.

```bash
cp .env.example .env.local
npm install
npm run dev           # http://localhost:3000
```

| Script | Mô tả |
|---|---|
| `npm run dev` | Chạy môi trường dev |
| `npm run build` / `npm start` | Build và chạy production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Sinh type cho route rồi chạy `tsc --noEmit` |

## Biến môi trường

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | REST API backend |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:8080/ws` | WebSocket STOMP (trạng thái ghế realtime) |

## Quy ước Git

- Nhánh: `main` luôn chạy được; làm việc trên `feature/<tên>`, `fix/<tên>`, merge vào `main` qua Pull Request.
- Commit theo [Conventional Commits](https://www.conventionalcommits.org/): `feat(booking): sơ đồ chọn ghế`, `fix: ...`, `style: ...`, `chore: ...`.

## Lộ trình

- [x] Khởi tạo dự án, routing khung (khách hàng / auth / admin), API client
- [ ] Đăng nhập / đăng ký, lưu phiên, bảo vệ route `/admin`, `/my-tickets` bằng `proxy.ts`
- [ ] Danh sách & chi tiết phim, lịch chiếu theo rạp
- [ ] Sơ đồ chọn ghế realtime (WebSocket), đếm ngược 10 phút, chọn bắp nước
- [ ] Thanh toán VNPay, trang kết quả, vé QR
- [ ] Trang quản trị: phim, suất chiếu, sơ đồ ghế, đặt vé, hoàn tiền, POS, check-in QR
- [ ] Dashboard doanh thu
