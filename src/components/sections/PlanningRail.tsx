import { useState, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { Shipment, ShipmentStatus, TERMINALS, STATUSES_LABEL } from '@/data/mock';
import { ShipmentBadge } from '@/components/StatusBadge';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const COLS: { key: keyof Shipment; label: string; width: string }[] = [
  { key: 'number', label: '№', width: 'w-12' },
  { key: 'request', label: 'Заявка', width: 'w-32' },
  { key: 'client', label: 'Клиент', width: 'w-40' },
  { key: 'containerNumber', label: 'Контейнер', width: 'w-36' },
  { key: 'footage', label: 'Футы', width: 'w-16' },
  { key: 'deliveryDate', label: 'Дата завоза', width: 'w-28' },
  { key: 'docsDate', label: 'Дата документов', width: 'w-32' },
  { key: 'cargo', label: 'Груз', width: 'w-40' },
  { key: 'tempMode', label: 'Т°', width: 'w-16' },
  { key: 'weight', label: 'Вес, кг', width: 'w-24' },
  { key: 'status', label: 'Статус', width: 'w-36' },
  { key: 'terminal', label: 'Терминал', width: 'w-28' },
  { key: 'destination', label: 'Станция назначения', width: 'w-44' },
  { key: 'comment', label: 'Комментарий', width: 'w-44' },
];

function EditableCell({ value, onChange, type = 'text' }: { value: string; onChange: (v: string) => void; type?: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  if (editing) {
    return (
      <input
        ref={ref}
        autoFocus
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { onChange(val); setEditing(false); }}
        onKeyDown={e => { if (e.key === 'Enter') { onChange(val); setEditing(false); } if (e.key === 'Escape') { setVal(value); setEditing(false); } }}
        className="w-full bg-transparent border-b border-primary outline-none text-xs py-0.5 text-foreground"
      />
    );
  }
  return (
    <span
      onClick={() => { setEditing(true); setVal(value); }}
      className="block cursor-text hover:text-primary transition-colors truncate max-w-full"
      title={value}
    >
      {value || <span className="text-muted-foreground/40">—</span>}
    </span>
  );
}

function StatusCell({ value, onChange }: { value: ShipmentStatus; onChange: (v: ShipmentStatus) => void }) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <select
        autoFocus
        value={value}
        onChange={e => { onChange(e.target.value as ShipmentStatus); setOpen(false); }}
        onBlur={() => setOpen(false)}
        className="text-xs bg-card border border-border rounded px-1 py-0.5 outline-none text-foreground"
      >
        {Object.entries(STATUSES_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    );
  }
  return <span onClick={() => setOpen(true)} className="cursor-pointer"><ShipmentBadge status={value} /></span>;
}

function FlightCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addFlight, flights } = useAppStore();
  const [form, setForm] = useState({ number: '', direction: 'moscow', planDate: '', factDate: '' });

  const handleCreate = () => {
    if (!form.number || !form.direction || !form.planDate) return;
    addFlight({ id: `f${Date.now()}`, number: form.number, direction: form.direction as never, planDate: form.planDate, factDate: form.factDate, status: 'planned' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создать рейс</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Номер рейса</Label>
            <Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="МСК-2026-005" />
          </div>
          <div className="space-y-1">
            <Label>Направление</Label>
            <Select value={form.direction} onValueChange={v => setForm({ ...form, direction: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="moscow">Москва</SelectItem>
                <SelectItem value="spb">Санкт-Петербург</SelectItem>
                <SelectItem value="novosibirsk">Новосибирск</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Дата плана</Label>
              <Input type="date" value={form.planDate} onChange={e => setForm({ ...form, planDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Дата факт</Label>
              <Input type="date" value={form.factDate} onChange={e => setForm({ ...form, factDate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleCreate}>Создать</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PlanningRail() {
  const { shipments, flights, updateShipment, currentUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFlight, setFilterFlight] = useState('all');
  const [createFlight, setCreateFlight] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || Object.values(s).some(v => String(v).toLowerCase().includes(q));
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchFlight = filterFlight === 'all' || s.flightId === filterFlight;
    return matchSearch && matchStatus && matchFlight;
  });

  const handleEdit = (id: string, key: keyof Shipment, val: string) => {
    if (!currentUser) return;
    updateShipment(id, { [key]: val } as Partial<Shipment>, currentUser.id, currentUser.name);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleDrop = (flightId: string) => {
    if (!dragId || !currentUser) return;
    updateShipment(dragId, { flightId }, currentUser.id, currentUser.name);
    setDragId(null);
  };

  const exportCSV = () => {
    const rows = [COLS.map(c => c.label).join(';')];
    filtered.forEach(s => rows.push(COLS.map(c => String(s[c.key] ?? '')).join(';')));
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'planning.csv'; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по всем полям..." className="pl-8 h-9 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(STATUSES_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterFlight} onValueChange={setFilterFlight}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="Рейс" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все рейсы</SelectItem>
            {flights.map(f => <SelectItem key={f.id} value={f.id}>{f.number}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCSV} className="h-9">
          <Icon name="Download" size={14} className="mr-1.5" /> Экспорт CSV
        </Button>
        <Button size="sm" className="h-9" onClick={() => setCreateFlight(true)}>
          <Icon name="Plus" size={14} className="mr-1.5" /> Создать рейс
        </Button>
      </div>

      {flights.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground self-center">Перетащить в рейс:</p>
          {flights.map(f => (
            <div
              key={f.id}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(f.id)}
              className="px-3 py-1.5 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-default"
            >
              {f.number}
            </div>
          ))}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-8 px-3 py-2.5 text-left">
                  <input type="checkbox" className="rounded" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(s => s.id)) : new Set())} />
                </th>
                {COLS.map(col => (
                  <th key={col.key} className={cn('px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap', col.width)}>
                    {col.label}
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={COLS.length + 2} className="text-center py-10 text-muted-foreground">Ничего не найдено</td></tr>
              )}
              {filtered.map(s => {
                const flight = flights.find(f => f.id === s.flightId);
                return (
                  <tr
                    key={s.id}
                    draggable
                    onDragStart={() => setDragId(s.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      'border-b border-border transition-colors group',
                      selected.has(s.id) ? 'bg-accent/50' : 'hover:bg-muted/40',
                      dragId === s.id && 'opacity-50',
                    )}
                  >
                    <td className="px-3 py-2">
                      <input type="checkbox" className="rounded" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                    </td>
                    {COLS.map(col => (
                      <td key={col.key} className={cn('px-3 py-2 text-foreground', col.width)}>
                        {col.key === 'status' ? (
                          <StatusCell value={s.status} onChange={v => handleEdit(s.id, 'status', v)} />
                        ) : col.key === 'terminal' ? (
                          <select
                            value={s.terminal}
                            onChange={e => handleEdit(s.id, 'terminal', e.target.value)}
                            className="text-xs bg-transparent outline-none cursor-pointer text-foreground w-full"
                          >
                            {TERMINALS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          <EditableCell value={String(s[col.key] ?? '')} onChange={v => handleEdit(s.id, col.key, v)} type={col.key.includes('Date') ? 'date' : 'text'} />
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      {flight && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{flight.number}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {selected.size > 0 ? `Выбрано: ${selected.size} из ${filtered.length}` : `Всего: ${filtered.length} записей`}
          </span>
          {selected.size > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
                Снять выделение
              </Button>
            </div>
          )}
        </div>
      </div>

      <FlightCreateModal open={createFlight} onClose={() => setCreateFlight(false)} />
    </div>
  );
}