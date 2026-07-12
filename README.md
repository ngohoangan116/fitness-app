# Sổ Tập — Web tập luyện cá nhân hóa

Landing page → quiz cá nhân hóa → thanh toán qua QR ngân hàng (VietQR) → dashboard tập luyện.

## 1. Chạy local

```bash
npm install
cp .env.example .env.local   # rồi điền các giá trị bên dưới
npm run dev
```

Mở http://localhost:3000

## 2. Cấu hình Supabase

1. Tạo project miễn phí tại https://supabase.com
2. Vào **SQL Editor** → dán toàn bộ nội dung file `supabase/schema.sql` → Run.
   File này tạo bảng `exercises`, `workout_plans`, `plan_exercises`, `orders`,
   `user_progress`, bật Row Level Security, và seed sẵn 1 gói demo
   (`hypertrophy-full-gym`) để bạn test ngay.
3. Vào **Project Settings → API**, copy `Project URL` và `anon public key`
   vào `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

⚠️ Quiz hiện tại tạo ra các `plan_id` dạng `<mục tiêu>-<dụng cụ>` (ví dụ
`fatloss-bodyweight`, `endurance-home-dumbbell`...) — xem đầy đủ các tổ hợp
trong `lib/planLogic.ts`. Bạn cần thêm dữ liệu bài tập cho từng `plan_id`
vào bảng `workout_plans` + `plan_exercises` (copy mẫu trong `schema.sql`),
nếu không dashboard sẽ trống với các gói chưa có dữ liệu.

## 3. Cấu hình QR ngân hàng (VietQR)

Không cần tài khoản merchant hay cổng thanh toán — QR được sinh động bằng
API ảnh miễn phí của vietqr.io, nhúng sẵn số tiền + nội dung chuyển khoản.

1. Tra mã BIN ngân hàng của bạn: https://api.vietqr.io/v2/banks
2. Điền vào `.env.local`:
   ```
   NEXT_PUBLIC_BANK_BIN=970436          # ví dụ: Vietcombank
   NEXT_PUBLIC_BANK_ACCOUNT_NO=0123456789
   NEXT_PUBLIC_BANK_ACCOUNT_NAME=NGUYEN VAN A   # không dấu, đúng tên chủ TK
   ```

## 4. Quy trình xác nhận thanh toán (thủ công)

Vì dùng QR chuyển khoản trực tiếp (không qua cổng thanh toán), **không có
cách nào để hệ thống tự động biết tiền đã về tài khoản**. Quy trình:

1. Khách quét QR, chuyển khoản với nội dung là mã đơn hàng (vd `DH123456AB`).
2. Khách bấm "Tôi đã chuyển khoản" → tạo 1 dòng trong bảng `orders` với
   `status = 'pending_verification'`.
3. **Bạn** kiểm tra sao kê ngân hàng, thấy đúng số tiền + đúng nội dung
   → vào Supabase **Table Editor → orders** → sửa `status` dòng đó thành
   `paid`.
4. Khách bấm "Kiểm tra lại" ở trang `/dashboard` → lộ trình được mở khóa.

Đây là cách đơn giản nhất để bắt đầu. Khi có nhiều đơn hơn, có thể nâng cấp
bằng cách tích hợp webhook đối soát tự động của một số ngân hàng/ví (Casso,
SePay...) để tự động set `status = 'paid'`.

## 5. Thiết kế

Bảng màu/typography lấy cảm hứng từ sổ tập gym / bảng thành tích: nền than
đậm (`ink`), chữ trắng ngà (`chalk`), điểm nhấn cam an toàn (`signal`) và
vàng băng keo (`tape`), số liệu dùng font mono như đồng hồ đếm reps. Xem
`tailwind.config.ts` và `app/globals.css`.

## 5b. Kho bài tập lớn (kèm GIF minh hoạ, không còn YouTube) + đổi lịch tập trả phí

`lib/planLogic.ts` sinh ra **96 tổ hợp `plan_id`** (4 mục tiêu × 3 dụng cụ ×
4 mức số buổi/tuần × 2 trình độ mới/nâng cao). `schema.sql` gốc chỉ seed
sẵn vài bài mẫu (kèm link YouTube demo) cho 1 gói — các gói còn lại sẽ
trống nếu không tự thêm dữ liệu.

**Bước 1 — chạy migration (chỉ cần 1 lần, an toàn chạy lại):**
Dán nội dung `supabase/expand-library-and-schedule-fee.sql` vào Supabase
SQL Editor → Run. File này thêm cột mô tả bài tập (dụng cụ, nhóm cơ,
hướng dẫn, ảnh...), cột `rest_seconds`/`role` cho `plan_exercises`, và các
cột phục vụ tính năng đổi lịch tập ở bước 3.

**Bước 2 — nạp kho bài tập (kèm GIF) & tự soạn lịch cho cả 96 gói:**
```bash
# Thêm vào .env.local (Project Settings → API → service_role — KHÔNG commit key này):
# SUPABASE_SERVICE_ROLE_KEY=...

node scripts/seed-exercise-library.mjs        # nạp ~1300 bài kèm GIF minh hoạ, nguồn omercotkd/exercises-gifs
node scripts/generate-plan-exercises.mjs      # tự soạn lịch riêng cho cả 96 plan_id
```
- `seed-exercise-library.mjs` lấy dữ liệu từ
  [omercotkd/exercises-gifs](https://github.com/omercotkd/exercises-gifs)
  (backup GIF public của bộ dữ liệu Kaggle "Fitness Exercises with
  Animations") — mỗi bài có ảnh GIF minh hoạ động thay vì link YouTube, và
  chủ động xoá sạch mọi `video_url` YouTube còn sót từ dữ liệu demo cũ.
  Script tự dò cột trong file CSV nguồn (không đoán cứng vị trí) và in ra
  "cách hiểu" + vài dòng mẫu ngay khi chạy — liếc qua để chắc nó đọc đúng
  cột trước khi để nó chạy hết.
- `generate-plan-exercises.mjs` chọn bài theo dụng cụ + trình độ được phép
  của từng gói, chia buổi theo đúng `splitLabel` (Full Body / Upper-Lower /
  Push-Pull-Legs), và xếp **thứ tự bài tập trong mỗi buổi theo nhóm cơ lớn
  trước — nhỏ sau** (chân/nhóm cơ lớn nhất → ngực/lưng (đều là bài chính,
  không xếp bên nào là "phụ") → cuối cùng mới đến bụng/core). Có thể chạy
  lại bất cứ lúc nào để "xáo" lại bộ bài — script sẽ xoá và tạo lại
  `plan_exercises` của các gói này (không đụng đơn hàng/tiến độ khách).
  Nên rà lại vài gói trong Supabase Table Editor trước khi cho khách dùng
  thật, vì đây là lựa chọn tự động theo nhóm cơ, không phải giáo án của PT.

**Bước 3 — đổi lịch tập mỗi 8 tuần, đổi sớm hơn thì tính phí:**
Đã có sẵn trong code (không cần cấu hình gì thêm ngoài migration ở Bước 1):
- Dashboard hiển thị thẻ "Đổi lịch tập". Nếu đã đủ 8 tuần kể từ lần bắt
  đầu / lần đổi gần nhất → khách làm lại bài test, bấm "Áp dụng lịch tập
  mới" là được đổi ngay, miễn phí (`app/api/schedule-change/route.ts`).
- Nếu chưa đủ 8 tuần → khách được chuyển sang `/checkout` với 1 đơn hàng
  phụ (`order_type = "schedule_change"`, mặc định 49.000đ, sửa hằng số
  `SCHEDULE_CHANGE_FEE_VND` trong `app/dashboard/page.tsx` và
  `FEE_VND` trong `app/api/schedule-change/route.ts` nếu muốn đổi mức phí).
  Sau khi bạn duyệt đơn này ở `/admin` như đơn thường, hệ thống tự áp
  plan mới vào đúng tài khoản khách (`app/api/admin/approve/route.ts`).

## 6. Việc còn cần làm trước khi lên production

- Thêm Supabase Auth thật (hiện đang dùng `order_code` lưu ở localStorage
  làm định danh tạm — đủ để demo, không đủ an toàn cho nhiều thiết bị/khách).
- Thêm dữ liệu bài tập đầy đủ cho tất cả `plan_id` trong `planLogic.ts`.
- Cân nhắc tự động đối soát chuyển khoản thay vì xác nhận tay.
- Thêm trang quản trị (admin) để duyệt đơn thay vì dùng Table Editor.

## 7. Đăng nhập lại trên thiết bị khác (mới thêm)

Trước đây hệ thống chỉ "nhớ" khách hàng qua `localStorage` của trình duyệt —
đổi máy hoặc xóa cache là mất quyền truy cập lộ trình. Giờ đã thêm:

- Thu thập **số điện thoại** ở bước thanh toán, lưu cùng đơn hàng
- Trang **`/login`**: khách nhập lại đúng số điện thoại → hệ thống tìm đơn
  hàng khớp số đó → tự động khôi phục lộ trình + tiến độ trên thiết bị mới
- Nếu 1 số điện thoại có nhiều đơn hàng (khách mua lại gói khác), trang
  login sẽ liệt kê để khách chọn đúng đơn

**Chạy migration:** dán nội dung `supabase/update-login-and-notes.sql` vào
SQL Editor, bấm Run.

⚠️ **Lưu ý về bảo mật:** đây là cơ chế "đăng nhập" đơn giản, dựa hoàn toàn
vào số điện thoại — không có mật khẩu hay OTP xác thực. Ai biết đúng số
điện thoại của khách đều xem được lộ trình/tiến độ tập của người đó (không
xem được thông tin thanh toán hay dữ liệu nhạy cảm khác). Phù hợp cho quy
mô nhỏ; nếu sau này cần chặt chẽ hơn, nên nâng cấp lên **Supabase Auth**
với xác thực email/SMS OTP thật (cần cấu hình thêm nhà cung cấp SMTP/SMS).

## 8. Ghi chú mức tạ theo từng khách hàng (mới thêm)

Mỗi bài tập trong `/dashboard` giờ có thêm 1 ô nhỏ để khách tự ghi mức tạ
đang dùng (vd "20kg", "2 x 15kg tay"). Dữ liệu lưu vào cột `weight_note`
trong bảng `user_progress`, gắn theo từng đơn hàng — khách đăng nhập lại
trên máy khác vẫn thấy đúng ghi chú của mình.

## 9. Duyệt thanh toán ngay trên web (mới thêm)

Trang `/admin` giờ có thêm mục **"Chờ duyệt"** — xem danh sách đơn hàng
`pending_verification` (kèm số tiền, số điện thoại, nội dung chuyển khoản)
và bấm **"Duyệt"** để chuyển sang `paid`, không cần vào Supabase Table
Editor nữa.

**Cách hoạt động (quan trọng để hiểu vì sao an toàn):** hành động duyệt đơn
chạy qua 1 API route phía server (`app/api/admin/approve`), server tự kiểm
tra mật khẩu và dùng **Service Role key** (bỏ qua Row Level Security) để
cập nhật — khác với trước đây dùng `NEXT_PUBLIC_ADMIN_PASSWORD` (lộ thẳng
trong code gửi cho trình duyệt, ai mở Console cũng đọc được và có thể tự ý
gọi thẳng Supabase để tự duyệt đơn của mình). Cách mới không có lỗ hổng đó.

**Cần thêm 2 biến môi trường server-only trong Vercel** (không thêm tiền tố
`NEXT_PUBLIC_`, để không bị lộ ra trình duyệt):

```
ADMIN_PASSWORD=<mật khẩu bạn tự đặt để vào trang /admin>
SUPABASE_SERVICE_ROLE_KEY=<Secret key từ Supabase>
```

Lấy `SUPABASE_SERVICE_ROLE_KEY`:
1. Supabase → **Project Settings → API Keys**
2. Mục **"Secret keys"** → bấm icon con mắt để hiện, copy giá trị dạng
   `sb_secret_...`

⚠️ **Cực kỳ nhạy cảm** — key này có toàn quyền đọc/ghi database, bỏ qua mọi
policy bảo mật. Chỉ dán vào ô Environment Variables trên Vercel, **không**
bao giờ đặt tên biến có tiền tố `NEXT_PUBLIC_`, không commit vào GitHub,
không chia sẻ cho ai.

Nếu trước đó bạn có set biến `NEXT_PUBLIC_ADMIN_PASSWORD` cho trang admin
cũ, có thể xóa — không còn được dùng nữa.

## 10. Cập nhật mới: ghi chú khởi động, streak, lịch .ics, nhật ký cân nặng, macro, chia sẻ

**Bắt buộc chạy trong Supabase SQL Editor** (theo đúng thứ tự nếu chưa chạy):
1. `supabase/add-body-logs.sql` — bảng nhật ký cân nặng (nếu chưa chạy trước đó)
2. `supabase/populate-coaching-notes.sql` — **sửa lỗi "ghi chú khởi động & tăng tải" bị trống**. Cột `coaching_notes` đã tồn tại từ trước nhưng chưa bao giờ được điền nội dung — file này điền đầy đủ nội dung khoa học (khởi động 5-8 phút + nguyên tắc tăng tải dần) riêng cho từng mục tiêu (tăng cơ/đốt mỡ/sức bền/duy trì). An toàn chạy lại nhiều lần.

**Tính năng mới trên `/dashboard`:**
- **🔥 Streak** — hiện số ngày tập liên tục ở đầu trang, tính từ dữ liệu đã có sẵn, không cần bảng mới.
- **📅 Thêm lịch tập vào Calendar** — tải file `.ics`, tự chia đều các buổi trong tuần (bắt đầu từ thứ Hai gần nhất), lặp lại 12 tuần. Vì hệ thống không biết khách rảnh thứ mấy, khách có thể tự kéo-thả đổi giờ trong app lịch sau khi import.
- **Nhật ký cân nặng** — khách ghi cân nặng mỗi ngày/tuần, từ 3 lần ghi trở lên tự hiện biểu đồ xu hướng.
- **Tính macro cá nhân hóa** — nhập tuổi/giới tính/cân nặng/chiều cao/số buổi tập, dùng công thức Mifflin-St Jeor (được ISSN/ACSM đánh giá chính xác nhất) ra lượng calo + đạm/tinh bột/chất béo mỗi ngày. Ghi rõ đây là ước tính tham khảo, không thay tư vấn dinh dưỡng chuyên sâu.
- **Hoàn thành cả buổi** — 1 nút tick hết các bài trong buổi đó.
- **Đếm ngược cam kết đổi gói** — hiện "còn X ngày" trong 7 ngày đầu sau khi mua (khác với cơ chế đổi lịch 8 tuần đã có — đây là cam kết hoàn tiền/đổi gói ngắn hạn ban đầu).
- **Chia sẻ thành tích** — tạo ảnh PNG (canvas, không cần thư viện ngoài) hiện % hoàn thành + streak, tải về để đăng story Zalo/Facebook.

**Về mục "video hướng dẫn chuẩn":** hệ thống hiện đã có sẵn cơ chế tốt hơn cả video — mỗi bài tập có thể có `image_url` (ảnh minh họa) và `instructions` (các bước thực hiện dạng danh sách), hiển thị qua nút "Xem hướng dẫn". Đây là cách an toàn hơn nhiều so với gắn link YouTube cụ thể (không ai xác minh được link đó có đúng/còn hoạt động không). Muốn bổ sung ảnh/hướng dẫn cho bài nào, dùng `scripts/seed-exercise-library.mjs` hoặc UPDATE trực tiếp bảng `exercises`. File `supabase/find-top-exercises.sql` giúp tìm ra các bài xuất hiện nhiều nhất để ưu tiên làm trước.
