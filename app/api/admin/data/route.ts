import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Sai mật khẩu." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: allOrders, error } = await supabase
    .from("orders")
    .select("order_code, plan_id, plan_name, amount_vnd, phone, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = allOrders ?? [];
  const pending = orders.filter((o) => o.status === "pending_verification");
  const paidOrders = orders.filter((o) => o.status === "paid");

  let paidSummary: {
    order_code: string;
    plan_name: string;
    totalExercises: number;
    completedExercises: number;
    trainedToday: boolean;
    lastTrainedAt: string | null;
  }[] = [];

  if (paidOrders.length > 0) {
    const planIds = Array.from(new Set(paidOrders.map((o) => o.plan_id)));
    const orderCodes = paidOrders.map((o) => o.order_code);

    const { data: planExercises } = await supabase
      .from("plan_exercises")
      .select("id, plan_id")
      .in("plan_id", planIds);

    const { data: progressRows } = await supabase
      .from("user_progress")
      .select("order_code, completed, completed_at")
      .in("order_code", orderCodes);

    const totalByPlan: Record<string, number> = {};
    for (const pe of planExercises ?? []) {
      totalByPlan[pe.plan_id] = (totalByPlan[pe.plan_id] ?? 0) + 1;
    }

    const byOrder: Record<string, { completed: number; lastAt: string | null; today: boolean }> = {};
    for (const p of progressRows ?? []) {
      if (!p.completed) continue;
      const entry = byOrder[p.order_code] ?? { completed: 0, lastAt: null, today: false };
      entry.completed += 1;
      if (p.completed_at) {
        if (!entry.lastAt || new Date(p.completed_at) > new Date(entry.lastAt)) {
          entry.lastAt = p.completed_at;
        }
        if (isToday(p.completed_at)) entry.today = true;
      }
      byOrder[p.order_code] = entry;
    }

    paidSummary = paidOrders.map((o) => {
      const prog = byOrder[o.order_code];
      return {
        order_code: o.order_code,
        plan_name: o.plan_name,
        totalExercises: totalByPlan[o.plan_id] ?? 0,
        completedExercises: prog?.completed ?? 0,
        trainedToday: prog?.today ?? false,
        lastTrainedAt: prog?.lastAt ?? null,
      };
    });
  }

  return NextResponse.json({ pending, paidSummary });
}
