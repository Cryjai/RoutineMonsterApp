import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const STORE_KEY = "routine-monsters-native-store-v1";
const PROMO_CODE = "AcryStrongestPrettiestGirl";

type AnyRecord = Record<string, any>;

type NativeStore = {
  nextId: number;
  profiles: AnyRecord[];
  routines: AnyRecord[];
  tasks: AnyRecord[];
  runs: AnyRecord[];
  rewards: AnyRecord[];
  appState: AnyRecord;
};

export function isNativeApiEnabled() {
  return Capacitor.isNativePlatform();
}

function nextId(store: NativeStore) {
  const id = store.nextId;
  store.nextId += 1;
  return id;
}

const templates = [
  {
    key: "morning",
    name: "Morning Boot-up",
    emoji: "🌞",
    color: "#FFD166",
    startMinute: 420,
    notes: "起身唔係靠意志，係靠流程。唔好同張床談戀愛。",
    tasks: [
      { name: "企起身 + 開窗", icon: "🪟", durationMin: 3 },
      { name: "刷牙洗面", icon: "🪥", durationMin: 5 },
      { name: "飲水", icon: "💧", durationMin: 2, isBreak: true },
      { name: "換衫", icon: "👕", durationMin: 7 },
      { name: "出門 check", icon: "🎒", durationMin: 5, notes: "電話、銀包、鎖匙，唔好出到樓下先扮偵探。" },
    ],
  },
  {
    key: "study",
    name: "Study Block",
    emoji: "📚",
    color: "#A78BFA",
    notes: "專治開書後忽然想研究世界和平。",
    tasks: [
      { name: "Set ONE goal", icon: "🎯", durationMin: 3 },
      { name: "Quick scan", icon: "🔍", durationMin: 7 },
      { name: "Focus block", icon: "🧠", durationMin: 25 },
      { name: "Break + 飲水", icon: "🫧", durationMin: 5, isBreak: true },
      { name: "Recap 3 points", icon: "🗒️", durationMin: 5 },
    ],
  },
  {
    key: "bedtime",
    name: "Bedtime Wind-down",
    emoji: "🌙",
    color: "#7DD3FC",
    startMinute: 1380,
    notes: "瞓覺都係 productivity，唔好再 doom-scroll。",
    tasks: [
      { name: "電話放遠", icon: "📵", durationMin: 1 },
      { name: "沖涼", icon: "🚿", durationMin: 12 },
      { name: "Skincare + 拉筋", icon: "🧴", durationMin: 8 },
      { name: "讀兩頁書", icon: "📖", durationMin: 8, isBreak: true },
      { name: "熄燈", icon: "💤", durationMin: 1 },
    ],
  },
  {
    key: "creator",
    name: "Creator Sprint",
    emoji: "🎬",
    color: "#FB7185",
    notes: "由 idea 到 upload，唔好剪片剪到變考古。",
    tasks: [
      { name: "Hook brainstorm", icon: "💡", durationMin: 8 },
      { name: "Outline 5 點", icon: "📋", durationMin: 10 },
      { name: "Shoot raw clips", icon: "🎥", durationMin: 25 },
      { name: "Coffee break", icon: "☕", durationMin: 8, isBreak: true },
      { name: "Rough edit", icon: "✂️", durationMin: 30 },
      { name: "Caption + post", icon: "🚀", durationMin: 9 },
    ],
  },
  {
    key: "chores",
    name: "Chore Sprint",
    emoji: "🧹",
    color: "#34D399",
    notes: "10 分鐘可以執到一個世界，唔好望住地板沉思人生。",
    tasks: [
      { name: "Trash sweep", icon: "🗑️", durationMin: 5 },
      { name: "Visible mess", icon: "🧺", durationMin: 8 },
      { name: "Wipe surfaces", icon: "🧼", durationMin: 6 },
      { name: "Mini reward", icon: "🍫", durationMin: 5, isBreak: true },
    ],
  },
];

function seedStore(): NativeStore {
  const store: NativeStore = {
    nextId: 1,
    profiles: [],
    routines: [],
    tasks: [],
    runs: [],
    rewards: [],
    appState: { id: 1, loggedInEmail: null, tier: "free", promoUnlocked: 0 },
  };
  const duo = { id: nextId(store), name: "Perplexity Duo", emoji: "🦉", color: "#A78BFA", isActive: 1, stars: 2, streak: 1 };
  const acry = { id: nextId(store), name: "Acry", emoji: "👑", color: "#FF8A65", isActive: 0, stars: 88, streak: 3 };
  store.profiles.push(duo, acry);
  installTemplate(store, "morning", duo.id);
  installTemplate(store, "study", duo.id);
  store.rewards.push(
    { id: nextId(store), profileId: duo.id, name: "Binge 一集劇", emoji: "📺", cost: 100, unlocked: 0 },
    { id: nextId(store), profileId: duo.id, name: "買杯好飲嘅", emoji: "🧋", cost: 60, unlocked: 0 },
    { id: nextId(store), profileId: duo.id, name: "無罪惡感休息 30 分鐘", emoji: "🫠", cost: 40, unlocked: 0 },
  );
  return store;
}

async function loadStore(): Promise<NativeStore> {
  const existing = await Preferences.get({ key: STORE_KEY });
  if (existing.value) return JSON.parse(existing.value);
  const seeded = seedStore();
  await saveStore(seeded);
  return seeded;
}

async function saveStore(store: NativeStore) {
  await Preferences.set({ key: STORE_KEY, value: JSON.stringify(store) });
}

function activeProfile(store: NativeStore) {
  return store.profiles.find((p) => p.isActive) ?? store.profiles[0];
}

function listRoutines(store: NativeStore, profileId: number) {
  return store.routines
    .filter((r) => r.profileId === profileId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => ({ ...r, tasks: store.tasks.filter((t) => t.routineId === r.id).sort((a, b) => a.sortOrder - b.sortOrder) }));
}

function installTemplate(store: NativeStore, key: string, profileId: number) {
  const tpl = templates.find((t) => t.key === key);
  if (!tpl) return null;
  const routine = {
    id: nextId(store),
    profileId,
    name: tpl.name,
    emoji: tpl.emoji,
    color: tpl.color,
    startMinute: tpl.startMinute ?? null,
    endMinute: null,
    weekdays: "[0,1,2,3,4,5,6]",
    reminderEnabled: 0,
    reminderMinute: null,
    notes: tpl.notes,
    templateKey: tpl.key,
    sortOrder: store.routines.filter((r) => r.profileId === profileId).length,
  };
  store.routines.push(routine);
  tpl.tasks.forEach((task, sortOrder) => {
    store.tasks.push({
      id: nextId(store),
      routineId: routine.id,
      name: task.name,
      icon: task.icon,
      durationMin: task.durationMin,
      notes: task.notes ?? "",
      isBreak: task.isBreak ? 1 : 0,
      sortOrder,
    });
  });
  return { routine, tasks: store.tasks.filter((t) => t.routineId === routine.id) };
}

function breakdown(goal: string, minutes: number) {
  const safeMinutes = Math.max(5, Math.min(180, Number(minutes) || 30));
  const blocks = [
    { name: `Define done: ${goal}`, icon: "🎯", durationMin: 3, notes: "1 句講完乜叫 done" },
    { name: "Set up 工具", icon: "🧰", durationMin: 4 },
    { name: "Focus block 1", icon: "🧠", durationMin: Math.max(10, Math.round(safeMinutes * 0.45)) },
    { name: "Chill break", icon: "🫧", durationMin: 5, isBreak: true },
    { name: "Focus block 2", icon: "🧠", durationMin: Math.max(5, Math.round(safeMinutes * 0.25)) },
    { name: "Wrap + log 進度", icon: "🗒️", durationMin: 3 },
  ];
  return {
    goal,
    minutes: safeMinutes,
    blocks,
    transitions: ["好，下一步啦，唔好停。", "做完一條 = 多一粒星，繼續！", "5 秒倒數，開始！"],
    motivation: "唔好扮忙，開始啦。",
  };
}

function ok(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export async function nativeApiRequest(method: string, rawUrl: string, data?: unknown): Promise<Response> {
  const store = await loadStore();
  const url = new URL(rawUrl, "https://native.routinemonsters");
  const path = url.pathname;
  const body = (data ?? {}) as AnyRecord;

  try {
    if (method === "GET" && path === "/api/profiles") return ok(store.profiles);
    if (method === "GET" && path === "/api/profiles/active") return ok(activeProfile(store));
    if (method === "POST" && path === "/api/profiles") {
      const created = { id: nextId(store), stars: 0, streak: 0, isActive: 0, ...body };
      store.profiles.push(created);
      await saveStore(store);
      return ok(created);
    }
    const activate = path.match(/^\/api\/profiles\/(\d+)\/activate$/);
    if (method === "POST" && activate) {
      const id = Number(activate[1]);
      store.profiles.forEach((p) => (p.isActive = p.id === id ? 1 : 0));
      await saveStore(store);
      return ok(activeProfile(store));
    }
    const stars = path.match(/^\/api\/profiles\/(\d+)\/stars$/);
    if (method === "POST" && stars) {
      const profile = store.profiles.find((p) => p.id === Number(stars[1]));
      if (profile) profile.stars = Math.max(0, (profile.stars ?? 0) + (Number(body.delta) || 0));
      await saveStore(store);
      return ok({ ok: true });
    }

    if (method === "GET" && path === "/api/templates") return ok(templates);
    const install = path.match(/^\/api\/templates\/([^/]+)\/install$/);
    if (method === "POST" && install) {
      const installed = installTemplate(store, install[1], Number(body.profileId));
      if (!installed) return ok({ message: "Template not found" }, 404);
      await saveStore(store);
      return ok(installed);
    }

    if (method === "GET" && path === "/api/routines") return ok(listRoutines(store, Number(url.searchParams.get("profileId"))));
    const routineById = path.match(/^\/api\/routines\/(\d+)$/);
    if (method === "GET" && routineById) {
      const routine = listRoutines(store, Number(activeProfile(store)?.id)).find((r) => r.id === Number(routineById[1])) ??
        store.routines.find((r) => r.id === Number(routineById[1]));
      if (!routine) return ok({ message: "Not found" }, 404);
      return ok({ ...routine, tasks: store.tasks.filter((t) => t.routineId === routine.id).sort((a, b) => a.sortOrder - b.sortOrder) });
    }
    if (method === "POST" && path === "/api/routines") {
      const created = { id: nextId(store), ...body };
      store.routines.push(created);
      await saveStore(store);
      return ok(created);
    }
    if (method === "PATCH" && routineById) {
      const routine = store.routines.find((r) => r.id === Number(routineById[1]));
      Object.assign(routine ?? {}, body);
      await saveStore(store);
      return ok(routine);
    }
    if (method === "DELETE" && routineById) {
      const id = Number(routineById[1]);
      store.routines = store.routines.filter((r) => r.id !== id);
      store.tasks = store.tasks.filter((t) => t.routineId !== id);
      await saveStore(store);
      return ok({ ok: true });
    }

    const taskById = path.match(/^\/api\/tasks\/(\d+)$/);
    if (method === "POST" && path === "/api/tasks") {
      const created = { id: nextId(store), ...body };
      store.tasks.push(created);
      await saveStore(store);
      return ok(created);
    }
    if (method === "PATCH" && taskById) {
      const task = store.tasks.find((t) => t.id === Number(taskById[1]));
      Object.assign(task ?? {}, body);
      await saveStore(store);
      return ok(task);
    }
    if (method === "DELETE" && taskById) {
      store.tasks = store.tasks.filter((t) => t.id !== Number(taskById[1]));
      await saveStore(store);
      return ok({ ok: true });
    }

    if (method === "GET" && path === "/api/runs") return ok(store.runs.filter((r) => r.profileId === Number(url.searchParams.get("profileId"))).reverse());
    const runById = path.match(/^\/api\/runs\/(\d+)$/);
    if (method === "POST" && path === "/api/runs") {
      const created = { id: nextId(store), ...body };
      store.runs.push(created);
      await saveStore(store);
      return ok(created);
    }
    if (method === "PATCH" && runById) {
      const run = store.runs.find((r) => r.id === Number(runById[1]));
      Object.assign(run ?? {}, body);
      await saveStore(store);
      return ok(run);
    }

    if (method === "GET" && path === "/api/rewards") return ok(store.rewards.filter((r) => r.profileId === Number(url.searchParams.get("profileId"))));
    const rewardById = path.match(/^\/api\/rewards\/(\d+)$/);
    if (method === "POST" && path === "/api/rewards") {
      const created = { id: nextId(store), unlocked: 0, ...body };
      store.rewards.push(created);
      await saveStore(store);
      return ok(created);
    }
    if (method === "POST" && rewardById && path.endsWith("/unlock")) return ok({ message: "Not found" }, 404);
    const unlock = path.match(/^\/api\/rewards\/(\d+)\/unlock$/);
    if (method === "POST" && unlock) {
      const reward = store.rewards.find((r) => r.id === Number(unlock[1]));
      const profile = store.profiles.find((p) => p.id === reward?.profileId);
      if (!reward || !profile) return ok({ message: "Not found" }, 404);
      if (profile.stars < reward.cost) return ok({ message: "唔夠 stars" }, 400);
      profile.stars -= reward.cost;
      reward.unlocked = 1;
      await saveStore(store);
      return ok(reward);
    }
    if (method === "DELETE" && rewardById) {
      store.rewards = store.rewards.filter((r) => r.id !== Number(rewardById[1]));
      await saveStore(store);
      return ok({ ok: true });
    }

    if (method === "GET" && path === "/api/app-state") return ok(store.appState);
    if (method === "POST" && path === "/api/login") {
      store.appState.loggedInEmail = String(body.email || "").trim();
      await saveStore(store);
      return ok(store.appState);
    }
    if (method === "POST" && path === "/api/logout") {
      store.appState.loggedInEmail = null;
      await saveStore(store);
      return ok(store.appState);
    }
    if (method === "POST" && path === "/api/subscription/upgrade") {
      store.appState.tier = "pro";
      await saveStore(store);
      return ok(store.appState);
    }
    if (method === "POST" && path === "/api/subscription/downgrade") {
      store.appState.tier = "free";
      store.appState.promoUnlocked = 0;
      await saveStore(store);
      return ok(store.appState);
    }
    if (method === "POST" && path === "/api/subscription/promo") {
      if (String(body.code || "") !== PROMO_CODE) return ok({ ok: false, message: "Promo code 唔啱" }, 400);
      store.appState.tier = "pro";
      store.appState.promoUnlocked = 1;
      await saveStore(store);
      return ok({ ok: true, state: store.appState });
    }
    if (method === "POST" && path === "/api/coach/breakdown") return ok(breakdown(String(body.goal || ""), Number(body.minutes)));

    return ok({ message: `Native route not implemented: ${method} ${path}` }, 404);
  } catch (error) {
    return ok({ message: error instanceof Error ? error.message : "Native API error" }, 500);
  }
}
