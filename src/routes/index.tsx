import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Hammer, Boxes, ReceiptText, ClipboardList, PiggyBank, Plus, Trash2,
  Image as ImageIcon, Camera, GripVertical, CalendarClock, AlertTriangle,
  CircleDollarSign, TrendingUp, Wallet, CheckCircle2, Clock, Pencil, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ebanistería Gregorio · Taller" },
      { name: "description", content: "Inventario, presupuestos, inversión y tareas del taller — pensado para tablet." },
    ],
  }),
  component: App,
});

/* ---------------- storage ---------------- */
function useLocal<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; }
    catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
  }, [key, val]);
  return [val, setVal] as const;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 });

async function fileToDataURL(file: File, maxSide = 1200): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally { URL.revokeObjectURL(url); }
}

/* ---------------- types ---------------- */
type Investment = { id: string; amount: number; notes: string; date: string };
type InventoryItem = { id: string; name: string; category: string; qty: number; cost: number; image?: string };
type Budget = { id: string; client: string; project: string; investment: number; amount: number; delivery: string; notes: string; image?: string; status: "Pendiente" | "Entregado" };
type Priority = "Alta" | "Media" | "Baja";
type Status = "Pendiente" | "En progreso" | "Completado";
type Task = { id: string; title: string; project: string; assignee: string; priority: Priority; status: Status; due: string; notes: string; order: number };

/* ---------------- date helpers ---------------- */
function dueState(due: string): "overdue" | "today" | "soon" | "ok" {
  if (!due) return "ok";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(due + "T00:00:00");
  const diff = (d.getTime() - today.getTime()) / 86400000;
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 3) return "soon";
  return "ok";
}
const niceDate = (s: string) => s ? new Date(s + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/* ---------------- Image picker ---------------- */
function ImagePicker({ value, onChange, label = "Toca o arrastra una foto" }: { value?: string; onChange: (v?: string) => void; label?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const handleFiles = async (files: FileList | null) => {
    const f = files?.[0]; if (!f) return;
    const data = await fileToDataURL(f);
    onChange(data);
  };
  return (
    <div
      className={cn(
        "relative flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/40 p-4 text-center transition-colors",
        drag ? "border-accent bg-accent/10" : "border-border",
      )}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
    >
      {value ? (
        <div className="relative w-full">
          <img src={value} alt="" className="mx-auto max-h-48 rounded-lg object-cover shadow" />
          <button type="button" onClick={() => onChange(undefined)} className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow hover:bg-background">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">{label}</div>
        </>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="mr-1 h-4 w-4" /> Galería
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => camRef.current?.click()}>
          <Camera className="mr-1 h-4 w-4" /> Cámara
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

/* ---------------- App ---------------- */
function App() {
  const [tab, setTab] = useState("resumen");
  const [investments, setInvestments] = useLocal<Investment[]>("eg.invest", []);
  const [inventory, setInventory] = useLocal<InventoryItem[]>("eg.inv", []);
  const [budgets, setBudgets] = useLocal<Budget[]>("eg.bud", []);
  const [tasks, setTasks] = useLocal<Task[]>("eg.tasks", []);

  const totalInvest = investments.reduce((a, b) => a + b.amount, 0);
  const totalInventoryValue = inventory.reduce((a, b) => a + b.qty * b.cost, 0);
  const totalBudgeted = budgets.reduce((a, b) => a + b.amount, 0);
  const totalDelivered = budgets.filter(b => b.status === "Entregado").reduce((a, b) => a + b.amount, 0);
  const openTasks = tasks.filter(t => t.status !== "Completado").length;
  const overdueTasks = tasks.filter(t => t.status !== "Completado" && dueState(t.due) === "overdue").length;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.4_0.08_45)] to-[oklch(0.25_0.05_35)] text-amber shadow-[var(--shadow-lift)]">
              <Hammer className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">Ebanistería Gregorio</h1>
              <p className="truncate text-xs text-muted-foreground">Taller · gestión de proyectos y materiales</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <KPI icon={<Wallet className="h-4 w-4" />} label="Inversión" value={fmt(totalInvest)} />
            <KPI icon={<CircleDollarSign className="h-4 w-4" />} label="Entregado" value={fmt(totalDelivered)} accent />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-card p-1.5 shadow-[var(--shadow-soft)] md:grid-cols-5">
            <BigTab value="resumen" icon={<TrendingUp className="h-5 w-5" />} label="Resumen" />
            <BigTab value="inversion" icon={<PiggyBank className="h-5 w-5" />} label="Inversión" />
            <BigTab value="inventario" icon={<Boxes className="h-5 w-5" />} label="Inventario" badge={inventory.length} />
            <BigTab value="presupuestos" icon={<ReceiptText className="h-5 w-5" />} label="Presupuestos" badge={budgets.length} />
            <BigTab value="tareas" icon={<ClipboardList className="h-5 w-5" />} label="Tareas" badge={openTasks} alert={overdueTasks > 0} />
          </TabsList>

          <TabsContent value="resumen" className="mt-6">
            <Resumen
              totalInvest={totalInvest}
              totalInventoryValue={totalInventoryValue}
              totalBudgeted={totalBudgeted}
              totalDelivered={totalDelivered}
              openTasks={openTasks}
              overdueTasks={overdueTasks}
              tasks={tasks}
              budgets={budgets}
              onJump={setTab}
            />
          </TabsContent>
          <TabsContent value="inversion" className="mt-6">
            <InversionView items={investments} setItems={setInvestments} />
          </TabsContent>
          <TabsContent value="inventario" className="mt-6">
            <InventarioView items={inventory} setItems={setInventory} />
          </TabsContent>
          <TabsContent value="presupuestos" className="mt-6">
            <PresupuestosView items={budgets} setItems={setBudgets} />
          </TabsContent>
          <TabsContent value="tareas" className="mt-6">
            <TareasView items={tasks} setItems={setTasks} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom tab bar for tablet portrait / mobile */}
      <nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-[var(--shadow-lift)] backdrop-blur md:hidden">
        {[
          ["resumen", TrendingUp],
          ["inversion", PiggyBank],
          ["inventario", Boxes],
          ["presupuestos", ReceiptText],
          ["tareas", ClipboardList],
        ].map(([k, I]) => {
          const Icon = I as typeof TrendingUp;
          const active = tab === k;
          return (
            <button key={k as string} onClick={() => setTab(k as string)}
              className={cn("grid h-12 w-12 place-items-center rounded-full transition-colors", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function KPI({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", accent ? "border-accent/30 bg-accent/10" : "border-border bg-card")}>
      <div className={cn("grid h-7 w-7 place-items-center rounded-lg", accent ? "bg-accent/20 text-accent-foreground" : "bg-muted text-foreground")}>{icon}</div>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

function BigTab({ value, icon, label, badge, alert }: { value: string; icon: React.ReactNode; label: string; badge?: number; alert?: boolean }) {
  return (
    <TabsTrigger
      value={value}
      className="group relative h-14 gap-2 rounded-xl text-sm font-semibold text-muted-foreground transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[var(--shadow-soft)]"
    >
      {icon}<span>{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className={cn("chip ml-1", alert ? "bg-danger text-danger-foreground" : "bg-muted text-foreground group-data-[state=active]:bg-amber group-data-[state=active]:text-amber-foreground")}>
          {badge}
        </span>
      )}
    </TabsTrigger>
  );
}

/* ---------------- Resumen ---------------- */
function Resumen(props: {
  totalInvest: number; totalInventoryValue: number; totalBudgeted: number; totalDelivered: number;
  openTasks: number; overdueTasks: number; tasks: Task[]; budgets: Budget[]; onJump: (k: string) => void;
}) {
  const upcoming = useMemo(() => [...props.tasks]
    .filter(t => t.status !== "Completado")
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))
    .slice(0, 5), [props.tasks]);

  const balance = props.totalDelivered - props.totalInvest;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <BigStat title="Capital invertido" value={fmt(props.totalInvest)} icon={<Wallet />} hint="Total acumulado" />
      <BigStat title="Valor de inventario" value={fmt(props.totalInventoryValue)} icon={<Boxes />} hint="Materiales y piezas en stock" />
      <BigStat title="Cobrado entregado" value={fmt(props.totalDelivered)} icon={<CircleDollarSign />} hint="Proyectos entregados" accent />
      <BigStat title="Presupuestado" value={fmt(props.totalBudgeted)} icon={<ReceiptText />} hint="Suma de presupuestos abiertos" />
      <BigStat title="Balance" value={fmt(balance)} icon={<TrendingUp />} hint="Entregado − Inversión" positive={balance >= 0} />
      <BigStat title="Tareas pendientes" value={`${props.openTasks}`} icon={<ClipboardList />} hint={props.overdueTasks ? `${props.overdueTasks} vencidas` : "Todo al día"} alert={props.overdueTasks > 0} />

      <section className="card-soft md:col-span-2 p-5">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Próximas entregas</h2>
          <Button variant="ghost" size="sm" onClick={() => props.onJump("tareas")}>Ver tareas</Button>
        </header>
        {upcoming.length === 0 ? (
          <EmptyHint text="Aún no hay tareas registradas. Agrega una desde la pestaña Tareas." />
        ) : (
          <ul className="divide-y divide-border">
            {upcoming.map(t => {
              const st = dueState(t.due);
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <PriorityDot p={t.priority} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{t.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{t.project || "Sin proyecto"} · {t.assignee}</div>
                  </div>
                  <DueBadge due={t.due} state={st} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card-soft p-5">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Presupuestos recientes</h2>
          <Button variant="ghost" size="sm" onClick={() => props.onJump("presupuestos")}>Ver todos</Button>
        </header>
        {props.budgets.length === 0 ? (
          <EmptyHint text="Crea tu primer presupuesto." />
        ) : (
          <ul className="space-y-3">
            {props.budgets.slice(-4).reverse().map(b => (
              <li key={b.id} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {b.image ? <img src={b.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{b.project}</div>
                  <div className="truncate text-xs text-muted-foreground">{b.client}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{fmt(b.amount)}</div>
                  <div className="text-[10px] text-muted-foreground">{niceDate(b.delivery)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BigStat({ title, value, icon, hint, accent, positive, alert }: { title: string; value: string; icon: React.ReactNode; hint?: string; accent?: boolean; positive?: boolean; alert?: boolean }) {
  return (
    <div className={cn("card-soft p-5", accent && "bg-gradient-to-br from-[oklch(0.78_0.16_70)] to-[oklch(0.7_0.15_50)] text-amber-foreground")}>
      <div className="flex items-start justify-between">
        <div>
          <div className={cn("text-xs font-medium uppercase tracking-wider", accent ? "text-amber-foreground/80" : "text-muted-foreground")}>{title}</div>
          <div className="mt-1 font-display text-3xl font-semibold">{value}</div>
          {hint && (
            <div className={cn("mt-1 text-xs", alert ? "text-danger" : accent ? "text-amber-foreground/80" : positive === false ? "text-danger" : "text-muted-foreground")}>
              {alert && <AlertTriangle className="mr-1 inline h-3 w-3" />}
              {hint}
            </div>
          )}
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", accent ? "bg-white/25" : "bg-muted text-foreground")}>{icon}</div>
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

/* ---------------- Inversión ---------------- */
function InversionView({ items, setItems }: { items: Investment[]; setItems: (v: Investment[]) => void }) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const total = items.reduce((a, b) => a + b.amount, 0);

  const add = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    setItems([{ id: uid(), amount: n, notes, date: new Date().toISOString() }, ...items]);
    setAmount(""); setNotes("");
  };

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
      <section className="card-soft p-5">
        <h2 className="text-lg font-semibold">Registrar inversión</h2>
        <p className="mb-4 text-sm text-muted-foreground">Aporte de capital, compra de materiales mayoristas, herramientas…</p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="amt">Monto</Label>
            <Input id="amt" type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="touch-input mt-1" />
          </div>
          <div>
            <Label htmlFor="ntes">Notas</Label>
            <Textarea id="ntes" rows={3} placeholder="Proveedor, fecha, destino…" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={add} className="h-12 w-full text-base"><Plus className="mr-1 h-5 w-5" /> Guardar inversión</Button>
        </div>
      </section>

      <section className="card-soft p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Historial</h2>
          <div className="rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">{fmt(total)}</div>
        </div>
        {items.length === 0 ? (
          <EmptyHint text="Sin movimientos. Registra tu primer aporte." />
        ) : (
          <ul className="divide-y divide-border">
            {items.map(it => (
              <li key={it.id} className="flex items-start gap-3 py-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber/30 text-amber-foreground">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{fmt(it.amount)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(it.date).toLocaleString("es-MX")}</div>
                  {it.notes && <div className="mt-1 text-sm">{it.notes}</div>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setItems(items.filter(x => x.id !== it.id))}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------------- Inventario ---------------- */
function InventarioView({ items, setItems }: { items: InventoryItem[]; setItems: (v: InventoryItem[]) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<InventoryItem>({ id: "", name: "", category: "", qty: 1, cost: 0 });
  const [query, setQuery] = useState("");

  const startNew = () => { setDraft({ id: "", name: "", category: "", qty: 1, cost: 0 }); setOpen(true); };
  const startEdit = (it: InventoryItem) => { setDraft(it); setOpen(true); };
  const save = () => {
    if (!draft.name.trim()) return;
    if (draft.id) setItems(items.map(x => x.id === draft.id ? draft : x));
    else setItems([{ ...draft, id: uid() }, ...items]);
    setOpen(false);
  };

  const filtered = items.filter(i => `${i.name} ${i.category}`.toLowerCase().includes(query.toLowerCase()));
  const totalValue = items.reduce((a, b) => a + b.qty * b.cost, 0);

  return (
    <section className="card-soft p-5">
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">Inventario del taller</h2>
          <p className="text-xs text-muted-foreground">Valor total en stock: <span className="font-semibold text-foreground">{fmt(totalValue)}</span></p>
        </div>
        <Button onClick={startNew} className="h-12 shrink-0 px-4 text-base"><Plus className="mr-1 h-5 w-5" /> Agregar</Button>
      </header>

      <Input placeholder="Buscar por nombre o categoría…" value={query} onChange={(e) => setQuery(e.target.value)} className="touch-input mb-4" />

      {filtered.length === 0 ? (
        <EmptyHint text="No hay materiales. Toca “Agregar” para empezar." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(it => (
            <article key={it.id} className="group flex gap-3 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-[var(--shadow-soft)]">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                {it.image ? <img src={it.image} alt={it.name} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-muted-foreground"><ImageIcon className="h-7 w-7" /></div>}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="truncate font-semibold">{it.name}</div>
                <div className="truncate text-xs text-muted-foreground">{it.category || "Sin categoría"}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="chip bg-muted text-foreground">x{it.qty}</span>
                  <span className="chip bg-secondary text-secondary-foreground">{fmt(it.cost)}</span>
                  <span className="chip bg-amber/30 text-amber-foreground">{fmt(it.qty * it.cost)}</span>
                </div>
                <div className="mt-auto flex justify-end gap-1 pt-2">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(it)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setItems(items.filter(x => x.id !== it.id))}><Trash2 className="h-4 w-4 text-danger" /></Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{draft.id ? "Editar material" : "Nuevo material"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nombre</Label>
              <Input className="touch-input mt-1" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ej: Tablero de pino" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoría</Label>
                <Input className="touch-input mt-1" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Madera, herraje…" />
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input type="number" min={0} className="touch-input mt-1" value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Costo unitario</Label>
              <Input type="number" min={0} step="0.01" className="touch-input mt-1" value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Foto</Label>
              <div className="mt-1"><ImagePicker value={draft.image} onChange={(v) => setDraft({ ...draft, image: v })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* ---------------- Presupuestos ---------------- */
function PresupuestosView({ items, setItems }: { items: Budget[]; setItems: (v: Budget[]) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Budget>({ id: "", client: "", project: "", investment: 0, amount: 0, delivery: "", notes: "", status: "Pendiente" });

  const startNew = () => { setDraft({ id: "", client: "", project: "", investment: 0, amount: 0, delivery: "", notes: "", status: "Pendiente" }); setOpen(true); };
  const startEdit = (b: Budget) => { setDraft(b); setOpen(true); };
  const save = () => {
    if (!draft.client || !draft.project) return;
    if (draft.id) setItems(items.map(x => x.id === draft.id ? draft : x));
    else setItems([{ ...draft, id: uid() }, ...items]);
    setOpen(false);
  };
  const toggleStatus = (b: Budget) => setItems(items.map(x => x.id === b.id ? { ...x, status: x.status === "Entregado" ? "Pendiente" : "Entregado" } : x));

  return (
    <section className="card-soft p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Presupuestos y entregas</h2>
          <p className="text-xs text-muted-foreground">{items.length} proyecto(s) registrado(s)</p>
        </div>
        <Button onClick={startNew} className="h-12 px-4 text-base"><Plus className="mr-1 h-5 w-5" /> Nuevo</Button>
      </header>

      {items.length === 0 ? (
        <EmptyHint text="Crea tu primer presupuesto para llevar control de cada proyecto." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(b => {
            const st = dueState(b.delivery);
            const margin = b.amount - b.investment;
            return (
              <article key={b.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
                <div className="relative h-40 w-full bg-muted">
                  {b.image ? (
                    <img src={b.image} alt={b.project} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
                  )}
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span className={cn("chip", b.status === "Entregado" ? "bg-success text-success-foreground" : "bg-background/90 text-foreground")}>
                      {b.status === "Entregado" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {b.status}
                    </span>
                  </div>
                  <div className="absolute right-3 top-3"><DueBadge due={b.delivery} state={st} compact /></div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-display text-lg font-semibold">{b.project}</div>
                      <div className="truncate text-xs text-muted-foreground">Cliente: {b.client}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{fmt(b.amount)}</div>
                      <div className={cn("text-xs", margin >= 0 ? "text-success" : "text-danger")}>Margen {fmt(margin)}</div>
                    </div>
                  </div>
                  {b.notes && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{b.notes}</p>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <span className="chip bg-muted text-foreground">Inversión {fmt(b.investment)}</span>
                      <span className="chip bg-secondary text-secondary-foreground"><CalendarClock className="h-3 w-3" /> {niceDate(b.delivery)}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="secondary" size="sm" onClick={() => toggleStatus(b)}>
                        {b.status === "Entregado" ? "Reabrir" : "Marcar entregado"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => startEdit(b)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setItems(items.filter(x => x.id !== b.id))}><Trash2 className="h-4 w-4 text-danger" /></Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{draft.id ? "Editar presupuesto" : "Nuevo presupuesto"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Cliente</Label>
              <Input className="touch-input mt-1" value={draft.client} onChange={(e) => setDraft({ ...draft, client: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Proyecto</Label>
              <Input className="touch-input mt-1" value={draft.project} onChange={(e) => setDraft({ ...draft, project: e.target.value })} />
            </div>
            <div>
              <Label>Inversión estimada</Label>
              <Input type="number" min={0} step="0.01" className="touch-input mt-1" value={draft.investment} onChange={(e) => setDraft({ ...draft, investment: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Monto a cobrar</Label>
              <Input type="number" min={0} step="0.01" className="touch-input mt-1" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Fecha de entrega</Label>
              <Input type="date" className="touch-input mt-1" value={draft.delivery} onChange={(e) => setDraft({ ...draft, delivery: e.target.value })} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Budget["status"] })}>
                <SelectTrigger className="touch-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Entregado">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={2} className="mt-1" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Imagen del entregable / referencia</Label>
              <div className="mt-1"><ImagePicker value={draft.image} onChange={(v) => setDraft({ ...draft, image: v })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* ---------------- Tareas ---------------- */
const priorityRank: Record<Priority, number> = { Alta: 0, Media: 1, Baja: 2 };

function TareasView({ items, setItems }: { items: Task[]; setItems: (v: Task[]) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Task>({ id: "", title: "", project: "", assignee: "", priority: "Media", status: "Pendiente", due: "", notes: "", order: 0 });
  const [sortMode, setSortMode] = useState<"smart" | "manual">("smart");

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sortMode === "manual") return arr.sort((a, b) => a.order - b.order);
    return arr.sort((a, b) => {
      const da = dueState(a.due), db = dueState(b.due);
      const weight = (s: string) => s === "overdue" ? 0 : s === "today" ? 1 : s === "soon" ? 2 : 3;
      if (weight(da) !== weight(db)) return weight(da) - weight(db);
      if (priorityRank[a.priority] !== priorityRank[b.priority]) return priorityRank[a.priority] - priorityRank[b.priority];
      return (a.due || "9999").localeCompare(b.due || "9999");
    });
  }, [items, sortMode]);

  const startNew = () => { setDraft({ id: "", title: "", project: "", assignee: "", priority: "Media", status: "Pendiente", due: "", notes: "", order: items.length }); setOpen(true); };
  const startEdit = (t: Task) => { setDraft(t); setOpen(true); };
  const save = () => {
    if (!draft.title.trim()) return;
    if (draft.id) setItems(items.map(x => x.id === draft.id ? draft : x));
    else setItems([...items, { ...draft, id: uid() }]);
    setOpen(false);
  };
  const cycleStatus = (t: Task) => {
    const next: Status = t.status === "Pendiente" ? "En progreso" : t.status === "En progreso" ? "Completado" : "Pendiente";
    setItems(items.map(x => x.id === t.id ? { ...x, status: next } : x));
  };

  // Drag and drop reorder (manual mode)
  const dragId = useRef<string | null>(null);
  const onDragStart = (id: string) => () => { dragId.current = id; setSortMode("manual"); };
  const onDropOn = (overId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragId.current; if (!from || from === overId) return;
    const ordered = [...sorted];
    const fromIdx = ordered.findIndex(t => t.id === from);
    const toIdx = ordered.findIndex(t => t.id === overId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);
    const reIndexed = ordered.map((t, i) => ({ ...t, order: i }));
    setItems(reIndexed);
    dragId.current = null;
  };

  return (
    <section className="card-soft p-5">
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">Tareas y prioridades</h2>
          <p className="text-xs text-muted-foreground">
            Orden inteligente por vencimiento + prioridad. Arrastra ☰ para reordenar manualmente.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden rounded-full border border-border bg-muted p-1 text-xs sm:flex">
            <button onClick={() => setSortMode("smart")} className={cn("rounded-full px-3 py-1", sortMode === "smart" && "bg-primary text-primary-foreground")}>Auto</button>
            <button onClick={() => setSortMode("manual")} className={cn("rounded-full px-3 py-1", sortMode === "manual" && "bg-primary text-primary-foreground")}>Manual</button>
          </div>
          <Button onClick={startNew} className="h-12 px-4 text-base"><Plus className="mr-1 h-5 w-5" /> Tarea</Button>
        </div>
      </header>

      {sorted.length === 0 ? (
        <EmptyHint text="Agrega tu primera tarea. Verás vencimientos en amarillo el día y en rojo si pasan." />
      ) : (
        <ul className="space-y-2">
          {sorted.map((t) => {
            const st = dueState(t.due);
            const done = t.status === "Completado";
            return (
              <li
                key={t.id}
                draggable
                onDragStart={onDragStart(t.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropOn(t.id)}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border bg-card p-3 transition-shadow hover:shadow-[var(--shadow-soft)]",
                  st === "overdue" && !done && "border-danger/40 bg-danger/5",
                  st === "today" && !done && "border-warning/60 bg-warning/15",
                  done && "opacity-60",
                )}
              >
                <button className="grid h-10 w-6 cursor-grab place-items-center text-muted-foreground active:cursor-grabbing" title="Arrastrar">
                  <GripVertical className="h-5 w-5" />
                </button>
                <button onClick={() => cycleStatus(t)} className="mt-1" title={`Estado: ${t.status}`}>
                  <StatusDot s={t.status} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("font-semibold", done && "line-through")}>{t.title}</span>
                    <PriorityChip p={t.priority} />
                    <span className="chip bg-muted text-foreground">{t.status}</span>
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {t.project ? `${t.project} · ` : ""}Responsable: {t.assignee || "—"}
                  </div>
                  {t.notes && <p className="mt-1 text-sm">{t.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <DueBadge due={t.due} state={st} />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setItems(items.filter(x => x.id !== t.id))}><Trash2 className="h-4 w-4 text-danger" /></Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{draft.id ? "Editar tarea" : "Nueva tarea"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Tarea</Label>
              <Input className="touch-input mt-1" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ej: Lijar puertas del armario" />
            </div>
            <div>
              <Label>Proyecto</Label>
              <Input className="touch-input mt-1" value={draft.project} onChange={(e) => setDraft({ ...draft, project: e.target.value })} />
            </div>
            <div>
              <Label>Responsable</Label>
              <Input className="touch-input mt-1" value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })} />
            </div>
            <div>
              <Label>Prioridad</Label>
              <Select value={draft.priority} onValueChange={(v) => setDraft({ ...draft, priority: v as Priority })}>
                <SelectTrigger className="touch-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Status })}>
                <SelectTrigger className="touch-input mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En progreso">En progreso</SelectItem>
                  <SelectItem value="Completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Fecha límite</Label>
              <Input type="date" className="touch-input mt-1" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={2} className="mt-1" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function PriorityChip({ p }: { p: Priority }) {
  const map: Record<Priority, string> = {
    Alta: "bg-danger text-danger-foreground",
    Media: "bg-amber text-amber-foreground",
    Baja: "bg-muted text-foreground",
  };
  return <span className={cn("chip", map[p])}>{p}</span>;
}
function PriorityDot({ p }: { p: Priority }) {
  const map: Record<Priority, string> = { Alta: "bg-danger", Media: "bg-amber", Baja: "bg-muted-foreground/50" };
  return <span className={cn("h-2.5 w-2.5 rounded-full", map[p])} />;
}
function StatusDot({ s }: { s: Status }) {
  const map: Record<Status, string> = {
    Pendiente: "border-muted-foreground/60 bg-transparent",
    "En progreso": "border-amber bg-amber/40",
    Completado: "border-success bg-success",
  };
  return <span className={cn("block h-5 w-5 rounded-full border-2", map[s])} />;
}

function DueBadge({ due, state, compact }: { due: string; state: ReturnType<typeof dueState>; compact?: boolean }) {
  if (!due) return <span className="text-xs text-muted-foreground">Sin fecha</span>;
  const cls =
    state === "overdue" ? "bg-danger text-danger-foreground" :
    state === "today" ? "bg-warning text-warning-foreground" :
    state === "soon" ? "bg-amber/40 text-amber-foreground" :
    "bg-muted text-foreground";
  const label =
    state === "overdue" ? "Vencido" :
    state === "today" ? "Hoy" :
    state === "soon" ? "Pronto" : "Programado";
  return (
    <span className={cn("chip", cls)} title={niceDate(due)}>
      <CalendarClock className="h-3 w-3" />
      {compact ? niceDate(due) : `${label} · ${niceDate(due)}`}
    </span>
  );
}
