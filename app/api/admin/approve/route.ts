import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  let body: { password?: string; order_code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Sai mật khẩu." }, { status: 401 });
  }
  if (!body.order_code) {
    return NextResponse.json({ error: "Thiếu order_code." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Đơn đang được duyệt — cần biết order_type để xử lý đúng nhánh.
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("order_code, order_type, target_order_code, new_plan_id, new_plan_name, status")
    .eq("order_code", body.order_code)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!order || order.status !== "pending_verification") {
    return NextResponse.json({ error: "Đơn không tồn tại hoặc đã xử lý." }, { status: 400 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("order_code", body.order_code)
    .eq("status", "pending_verification"); // không cho duyệt lại đơn đã xử lý

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Đơn "đổi lịch tập" trả phí: sau khi ghi nhận thanh toán, áp plan mới
  // vào đúng đơn gốc (target_order_code) và reset mốc 8 tuần.
  if (order.order_type === "schedule_change" && order.target_order_code && order.new_plan_id) {
    const { error: applyError } = await supabase
      .from("orders")
      .update({
        plan_id: order.new_plan_id,
        plan_name: order.new_plan_name ?? order.new_plan_id,
        plan_updated_at: new Date().toISOString(),
      })
      .eq("order_code", order.target_order_code);

    if (applyError) {
      return NextResponse.json({ error: applyError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
