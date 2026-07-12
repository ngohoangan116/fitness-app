-- ============================================================
-- SUA LOI: coaching_notes (ghi chu khoi dong & tang tai) dang trong
-- vi cot duoc them vao workout_plans nhung chua bao gio duoc dien noi dung.
-- File nay UPDATE noi dung khoa hoc, chia theo tung muc tieu (hypertrophy/
-- fatloss/endurance/maintenance), dung LIKE nen khong phu thuoc vao hau to
-- (so buoi/trinh do) trong plan_id.
-- An toan chay lai nhieu lan — luon ghi de bang noi dung moi nhat.
-- ============================================================

update workout_plans set coaching_notes =
'KHỞI ĐỘNG (5-8 phút, bắt buộc trước mọi buổi tập)
1. Vận động khớp toàn thân: xoay cổ tay, vai, hông, gối (mỗi khớp 10 vòng).
2. Kích hoạt tim mạch nhẹ 2-3 phút: đi bộ nhanh tại chỗ, jumping jack, hoặc đạp xe nhẹ.
3. Bài khởi động động (dynamic stretch) cho nhóm cơ sẽ tập hôm đó: squat không tạ, lunge tại chỗ, plank 20s.
4. 1 hiệp khởi động cho bài chính đầu tiên với mức tạ ~50% mức sẽ tập, KHÔNG tính vào số hiệp chính thức.

TĂNG TẢI DẦN (progressive overload) — nguyên tắc quan trọng nhất để cơ phát triển
• Khi hoàn thành đủ số lần lặp ở mức khó vừa phải (RPE 7-8, tức còn tập được 2-3 lần nữa) trong TẤT CẢ các hiệp của 1 bài, hãy tăng tải 2.5-5% ở buổi tập tiếp theo cho bài đó.
• Nếu không tăng được tạ, ưu tiên tăng thêm 1-2 lần lặp trước, rồi mới tăng tạ.
• Không tăng tải quá 10%/tuần cho cùng 1 bài — dễ chấn thương và mất form.
• Ghi lại mức tạ mỗi buổi (dùng ô "Mức tạ..." cạnh mỗi bài) để dễ theo dõi và biết khi nào nên tăng.
• Nếu 2 buổi liên tiếp không tăng được gì (tạ, số lần, hay cảm giác nặng hơn), đó là dấu hiệu cần nghỉ ngơi/ngủ đủ/ăn đủ hơn là ép tập nặng hơn.'
where id like 'hypertrophy-%';

update workout_plans set coaching_notes =
'KHỞI ĐỘNG (5-8 phút, bắt buộc trước mọi buổi tập)
1. Vận động khớp toàn thân: xoay cổ tay, vai, hông, gối (mỗi khớp 10 vòng).
2. Nâng nhịp tim 3-4 phút: nhảy dây, high knees, hoặc đạp xe nhẹ tăng dần cường độ.
3. Vài hiệp nhẹ bài đầu tiên với cường độ thấp để làm nóng đúng nhóm cơ sẽ dùng.

TĂNG TẢI DẦN (progressive overload) cho mục tiêu đốt mỡ
• Ưu tiên tăng MẬT ĐỘ trước: rút ngắn thời gian nghỉ giữa hiệp 5-10 giây mỗi 1-2 tuần (không rút xuống dưới 20s).
• Sau đó mới tăng số lần lặp hoặc thêm 1 hiệp cho bài đang thấy nhẹ.
• Với phần cardio cuối buổi: tăng dần thời lượng hoặc cường độ (đi nhanh hơn/dốc cao hơn) mỗi 1-2 tuần, không tăng đột ngột.
• Đốt mỡ hiệu quả đến từ TỔNG khối lượng vận động + duy trì thâm hụt calo hợp lý — không phải từ việc tập cực nặng. Ưu tiên hoàn thành đủ buổi hơn là tập kiệt sức.
• Ghi mức tạ/độ khó mỗi buổi để nhận ra khi nào cơ thể đã thích nghi và cần tăng độ khó.'
where id like 'fatloss-%';

update workout_plans set coaching_notes =
'KHỞI ĐỘNG (5-8 phút, bắt buộc trước mọi buổi tập)
1. Vận động khớp toàn thân, ưu tiên khớp sẽ chịu tải nhiều lần lặp (vai, hông, gối).
2. Nâng nhịp tim nhẹ nhàng 2-3 phút vì buổi tập sẽ có nhiều lần lặp liên tục.
3. Tập nhẹ bài đầu tiên với cường độ thấp trước khi vào hiệp thật.

TĂNG TẢI DẦN (progressive overload) cho mục tiêu sức bền
• Ưu tiên tăng SỐ LẦN LẶP hoặc THỜI GIAN thực hiện trước — ví dụ plank từ 30s lên 45s, rồi 60s — trước khi nghĩ đến tăng tạ.
• Khi đã đạt mức lặp/thời gian cao nhất được đề xuất một cách thoải mái (RPE ở dưới 6), có thể tăng nhẹ tải trọng và quay lại mức lặp thấp hơn trong khoảng đề xuất.
• Giữ đúng kỹ thuật là ưu tiên số 1 khi số lần lặp tăng cao — kỹ thuật sai lặp lại nhiều lần dễ gây chấn thương do mỏi cơ.
• Có thể giảm dần thời gian nghỉ giữa hiệp (không dưới 20s) để tăng độ khó mà không cần đổi bài.'
where id like 'endurance-%';

update workout_plans set coaching_notes =
'KHỞI ĐỘNG (5-8 phút, bắt buộc trước mọi buổi tập)
1. Vận động khớp toàn thân nhẹ nhàng: xoay cổ tay, vai, hông, gối.
2. Đi bộ tại chỗ hoặc đạp xe nhẹ 2-3 phút để làm nóng cơ thể.
3. Không cần khởi động chuyên sâu như các mục tiêu cường độ cao — trọng tâm là vào tập an toàn, thoải mái.

TĂNG TẢI DẦN (progressive overload) cho mục tiêu duy trì
• Không bắt buộc phải tăng tải liên tục — mục tiêu chính là DUY TRÌ đều đặn, không phải tối đa hóa tiến bộ.
• Nếu 1 bài tập cảm thấy quá nhẹ nhàng (RPE dưới 4) trong vài buổi liên tiếp, có thể tăng nhẹ tạ hoặc số lần lặp để duy trì hiệu quả.
• Ưu tiên số buổi tập đều đặn mỗi tuần hơn là cường độ từng buổi — 3 buổi nhẹ nhàng đều đặn tốt hơn 1 buổi rất nặng rồi nghỉ cả tuần.
• Có thể xen kẽ đổi bài tập trong cùng nhóm cơ (nếu có nhiều lựa chọn) để tránh nhàm chán và duy trì động lực lâu dài.'
where id like 'maintenance-%';
