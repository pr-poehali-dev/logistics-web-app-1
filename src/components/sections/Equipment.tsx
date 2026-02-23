import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Equipment as Eq, EquipmentStatus, ContainerType, TERMINALS, EQUIPMENT_STATUS_LABEL } from '@/data/mock';
import { EquipmentBadge } from '@/components/StatusBadge';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const TYPE_LABELS: Record<ContainerType, string> = {
  container: 'Контейнер',
  dgk: 'ДГК / ЭГК',
  genset: 'Дженсет',
};

export default function EquipmentSection() {
  const { equipment, updateEquipment, addEquipment, deleteEquipment, currentUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ContainerType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | 'all'>('all');
  const [filterTerminal, setFilterTerminal] = useState('all');
  const [addModal, setAddModal] = useState(false);
  const [newEq, setNewEq] = useState({ number: '', type: 'container' as ContainerType, status: 'unchecked' as EquipmentStatus, location: 'ПИК', comment: '' });

  const filtered = equipment.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.number.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    const matchType = filterType === 'all' || e.type === filterType;
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchTerminal = filterTerminal === 'all' || e.location === filterTerminal;
    return matchSearch && matchType && matchStatus && matchTerminal;
  });

  const handleUpdate = (id: string, data: Partial<Eq>) => {
    if (!currentUser) return;
    updateEquipment(id, data, currentUser.id, currentUser.name);
  };

  const handleAdd = () => {
    if (!newEq.number) return;
    addEquipment({ id: `e${Date.now()}`, ...newEq, lastCheck: new Date().toISOString().slice(0, 10) });
    setAddModal(false);
    setNewEq({ number: '', type: 'container', status: 'unchecked', location: 'ПИК', comment: '' });
  };

  const grouped = ['container', 'dgk', 'genset'] as ContainerType[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по номеру..." className="pl-8 h-9 text-sm" />
        </div>
        <Select value={filterType} onValueChange={v => setFilterType(v as ContainerType | 'all')}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Тип" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {grouped.map(t => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as EquipmentStatus | 'all')}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(EQUIPMENT_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTerminal} onValueChange={setFilterTerminal}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Терминал" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все терминалы</SelectItem>
            {TERMINALS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-9" onClick={() => setAddModal(true)}>
          <Icon name="Plus" size={14} className="mr-1.5" /> Добавить
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Номер', 'Тип', 'Статус', 'Терминал', 'Последняя проверка', 'Комментарий', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Ничего не найдено</td></tr>
              )}
              {filtered.map(e => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">{e.number}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{TYPE_LABELS[e.type]}</td>
                  <td className="px-4 py-3">
                    <select
                      value={e.status}
                      onChange={ev => handleUpdate(e.id, { status: ev.target.value as EquipmentStatus })}
                      className={cn('text-xs rounded-full px-2 py-0.5 border-0 outline-none cursor-pointer font-medium',
                        e.status === 'checked' ? 'bg-emerald-100 text-emerald-700' :
                        e.status === 'unchecked' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      )}
                    >
                      {Object.entries(EQUIPMENT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={e.location}
                      onChange={ev => handleUpdate(e.id, { location: ev.target.value })}
                      className="text-sm bg-transparent outline-none cursor-pointer text-foreground"
                    >
                      {TERMINALS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.lastCheck}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs">
                    <input
                      defaultValue={e.comment}
                      onBlur={ev => handleUpdate(e.id, { comment: ev.target.value })}
                      placeholder="—"
                      className="bg-transparent outline-none w-full text-sm hover:border-b hover:border-muted-foreground/30 focus:border-b focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/30"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteEquipment(e.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground">Всего: {filtered.length} из {equipment.length} единиц</span>
        </div>
      </div>

      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Добавить оборудование</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1"><Label>Номер</Label><Input value={newEq.number} onChange={e => setNewEq({ ...newEq, number: e.target.value })} placeholder="TCKU1234567" /></div>
            <div className="space-y-1"><Label>Тип</Label>
              <Select value={newEq.type} onValueChange={v => setNewEq({ ...newEq, type: v as ContainerType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{grouped.map(t => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Терминал</Label>
              <Select value={newEq.location} onValueChange={v => setNewEq({ ...newEq, location: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TERMINALS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Комментарий</Label><Input value={newEq.comment} onChange={e => setNewEq({ ...newEq, comment: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddModal(false)}>Отмена</Button>
              <Button onClick={handleAdd}>Добавить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
