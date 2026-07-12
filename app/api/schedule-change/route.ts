import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Đổi lịch tập:
//  - Nếu đã đủ 8 tuần (56 ngày) kể từ lần bắt đầu / lần đổi gần nhất →
//    áp dụng ngay, miễn phí.
//  - Nếu chưa đủ 8 tuần → KHÔNG áp dụng, trả về phí cần thanh toán để
//    client điều hướng sang /checkout (đơn order_type = "schedule_change").
// Dùng Service Role key ở server vì bảng `orders` không cho anon tự UPDATE.

const COOLDOWN_DAYS = 56;
const FEE_VND = 49000;

export async function POST(request: Request) {
  let body: { order_code?: string; new_plan_id?: string; new_plan_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  if (!body.order_code || !body.new_plan_id || !body.new_plan_name) {
    return NextResponse.json({ error: "Thiếu order_code hoặc plan mới." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("order_code, status, plan_id, created_at, plan_updated_at")
    .eq("order_code", body.order_code)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!order || order.status !== "paid") {
    return NextResponse.json(
      { error: "Không tìm thấy đơn đã thanh toán tương ứng." },
      { status: 400 }
    );
  }

  if (order.plan_id === body.new_plan_id) {
    return NextResponse.json({ ok: true, applied: false, unchanged: true });
  }

  const since = new Date(order.plan_updated_at ?? order.created_at).getTime();
  const daysSince = (Date.now() - since) / (1000 * 60 * 60 * 24);

  if (daysSince >= COOLDOWN_DAYS) {
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        plan_id: body.new_plan_id,
        plan_name: body.new_plan_name,
        plan_updated_at: new Date().toISOString(),
      })
      .eq("order_code", body.order_code);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, applied: true });
  }

  return NextResponse.json({
    ok: true,
    applied: false,
    requiresPayment: true,
    feeVnd: FEE_VND,
    daysRemaining: Math.ceil(COOLDOWN_DAYS - daysSince),
  });
}
