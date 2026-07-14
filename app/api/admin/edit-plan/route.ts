import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// API riêng cho admin sửa lịch tập của MỘT khách hàng cụ thể.
//
// Quan trọng: plan_id vốn dùng CHUNG cho mọi khách trả lời quiz giống
// nhau (vd "hypertrophy-bodyweight-3d-beginner"). Nếu sửa thẳng vào đó,
// TẤT CẢ khách đang dùng gói này cũng bị đổi theo — sai ý admin.
//
// Nên lần đầu admin sửa cho 1 đơn hàng, hệ thống tự "tách riêng"
// (fork): copy workout_plans + plan_exercises của gói đó thành 1 bản
// mới chỉ dành cho đơn này (plan_id dạng "custom-<order_code>"), rồi
// cập nhật orders.plan_id trỏ sang bản riêng đó. Từ lúc này, sửa gì
// cũng chỉ ảnh hưởng đúng 1 khách hàng — cấu trúc bảng, cách
// dashboard/checkout đọc dữ liệu hoàn toàn giữ nguyên như cũ (vẫn chỉ
// là "order có 1 plan_id, dashboard lấy plan_exercises theo plan_id").
//
// Khách hàng KHÔNG có quyền gọi API này — chỉ admin, qua mật khẩu
// ADMIN_PASSWORD giống các route admin khác.

function checkPassword(password?: string) {
  return !!password && password === process.env.ADMIN_PASSWORD;
}

async function ensureCustomPlan(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  orderCode: string
) {
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("order_code, plan_id, plan_name")
    .eq("order_code", orderCode)
    .maybeSingle();
  if (orderErr) throw orderErr;
  if (!order) throw new Error("Không tìm thấy đơn hàng.");

  if (order.plan_id.startsWith("custom-")) {
    return { planId: order.plan_id, planName: order.plan_name };
  }

  // Chưa tách riêng — copy toàn bộ gói gốc thành bản riêng cho đơn này.
  const { data: originalPlan, error: planErr } = await supabase
    .from("workout_plans")
    .select("name, description, coaching_notes")
    .eq("id", order.plan_id)
    .maybeSingle();
  if (planErr) throw planErr;

  const { data: originalRows, error: rowsErr } = await supabase
    .from("plan_exercises")
    .select("exercise_id, day_number, day_label, sets, reps, rest_seconds, role, order_index")
    .eq("plan_id", order.plan_id);
  if (rowsErr) throw rowsErr;

  const newPlanId = `custom-${order.order_code}`;
  const newPlanName = `${order.plan_name} (đã chỉnh riêng)`;

  const { error: insertPlanErr } = await supabase.from("workout_plans").upsert({
    id: newPlanId,
    name: newPlanName,
    description: originalPlan?.description ?? null,
    coaching_notes: originalPlan?.coaching_notes ?? null,
  });
  if (insertPlanErr) throw insertPlanErr;

  const newRows = (originalRows ?? []).map((r) => ({ ...r, plan_id: newPlanId }));
  let insertedRows: { id: string; day_number: number; order_index: number }[] = [];
  if (newRows.length > 0) {
    const { data: inserted, error: insertRowsErr } = await supabase
      .from("plan_exercises")
      .insert(newRows)
      .select("id, day_number, order_index");
    if (insertRowsErr) throw insertRowsErr;
    insertedRows = inserted ?? [];
  }

  // Giữ lại tiến độ (đã tập/chưa tập, ghi chú mức tạ) của khách — map
  // theo (day_number, order_index) vì đó là cặp giá trị không đổi giữa
  // bản gốc và bản copy.
  const { data: oldRowsWithId } = await supabase
    .from("plan_exercises")
    .select("id, day_number, order_index")
    .eq("plan_id", order.plan_id);
  const { data: oldProgress } = await supabase
    .from("user_progress")
    .select("plan_exercise_id, completed, completed_at, weight_note")
    .eq("order_code", orderCode);

  if (oldRowsWithId && oldProgress && oldProgress.length > 0) {
    const oldIdToKey = new Map(oldRowsWithId.map((r) => [r.id, `${r.day_number}-${r.order_index}`]));
    const keyToNewId = new Map(insertedRows.map((r) => [`${r.day_number}-${r.order_index}`, r.id]));
    const progressToCopy = oldProgress
      .map((p) => {
        const key = oldIdToKey.get(p.plan_exercise_id);
        const newId = key ? keyToNewId.get(key) : null;
        if (!newId) return null;
        return {
          order_code: orderCode,
          plan_exercise_id: newId,
          completed: p.completed,
          completed_at: p.completed_at,
          weight_note: p.weight_note,
        };
      })
      .filter(Boolean);
    if (progressToCopy.length > 0) {
      await supabase.from("user_progress").insert(progressToCopy as never[]);
    }
  }

  const { error: updateOrderErr } = await supabase
    .from("orders")
    .update({ plan_id: newPlanId, plan_name: newPlanName })
    .eq("order_code", orderCode);
  if (updateOrderErr) throw updateOrderErr;

  return { planId: newPlanId, planName: newPlanName };
}

export async function POST(request: Request) {
  let body: {
    password?: string;
    action?: string;
    order_code?: string;
    row_id?: string;
    sets?: number;
    reps?: string;
    rest_seconds?: number;
    day_number?: number;
    exercise_id?: string;
    role?: string;
    query?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }
  if (!checkPassword(body.password)) {
    return NextResponse.json({ error: "Sai mật khẩu." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  try {
    if (body.action === "search_exercises") {
      if (!body.query || body.query.trim().length < 2) {
        return NextResponse.json({ results: [] });
      }
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, primary_muscle, equipment, image_url")
        .ilike("name", `%${body.query.trim()}%`)
        .limit(20);
      if (error) throw error;
      return NextResponse.json({ results: data ?? [] });
    }

    if (!body.order_code) {
      return NextResponse.json({ error: "Thiếu order_code." }, { status: 400 });
    }

    if (body.action === "load") {
      const { planId, planName } = await ensureCustomPlan(supabase, body.order_code);
      const { data: rows, error } = await supabase
        .from("plan_exercises")
        .select(
          "id, day_number, day_label, sets, reps, rest_seconds, role, order_index, exercises(id, name, primary_muscle, equipment, image_url)"
        )
        .eq("plan_id", planId)
        .order("day_number", { ascending: true })
        .order("order_index", { ascending: true });
      if (error) throw error;
      return NextResponse.json({ plan_id: planId, plan_name: planName, rows: rows ?? [] });
    }

    if (body.action === "update_row") {
      if (!body.row_id) return NextResponse.json({ error: "Thiếu row_id." }, { status: 400 });
      const { planId } = await ensureCustomPlan(supabase, body.order_code);
      const { error } = await supabase
        .from("plan_exercises")
        .update({
          sets: body.sets,
          reps: body.reps,
          rest_seconds: body.rest_seconds,
        })
        .eq("id", body.row_id)
        .eq("plan_id", planId); // an toàn: chỉ sửa đúng bản riêng của đơn này
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.action === "delete_row") {
      if (!body.row_id) return NextResponse.json({ error: "Thiếu row_id." }, { status: 400 });
      const { planId } = await ensureCustomPlan(supabase, body.order_code);
      const { error } = await supabase
        .from("plan_exercises")
        .delete()
        .eq("id", body.row_id)
        .eq("plan_id", planId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.action === "add_row") {
      if (!body.exercise_id || !body.day_number) {
        return NextResponse.json({ error: "Thiếu exercise_id hoặc day_number." }, { status: 400 });
      }
      const { planId } = await ensureCustomPlan(supabase, body.order_code);
      const { data: existing } = await supabase
        .from("plan_exercises")
        .select("order_index")
        .eq("plan_id", planId)
        .eq("day_number", body.day_number)
        .order("order_index", { ascending: false })
        .limit(1);
      const nextOrderIndex = (existing?.[0]?.order_index ?? 0) + 1;

      const { error } = await supabase.from("plan_exercises").insert({
        plan_id: planId,
        exercise_id: body.exercise_id,
        day_number: body.day_number,
        sets: body.sets ?? 3,
        reps: body.reps ?? "10-12",
        rest_seconds: body.rest_seconds ?? 60,
        role: body.role ?? "accessory",
        order_index: nextOrderIndex,
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Có lỗi xảy ra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
