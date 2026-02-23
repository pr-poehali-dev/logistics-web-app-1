import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { DIRECTIONS_LABEL } from '@/data/mock';
import { FlightBadge, ShipmentBadge } from '@/components/StatusBadge';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export default function FlightsRail() {
  const { flights, shipments } = useAppStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {flights.map(flight => {
        const flightShipments = shipments.filter(s => s.flightId === flight.id);
        const ready = flightShipments.filter(s => s.status === 'ready').length;
        const isOpen = expanded === flight.id;

        return (
          <div key={flight.id} className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
            <button
              onClick={() => setExpanded(isOpen ? null : flight.id)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon name="Train" size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{flight.number}</span>
                  <FlightBadge status={flight.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {DIRECTIONS_LABEL[flight.direction]} · план {flight.planDate}
                  {flight.factDate && ` · факт ${flight.factDate}`}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center hidden sm:block">
                  <p className="text-lg font-bold text-foreground">{flightShipments.length}</p>
                  <p className="text-[10px] text-muted-foreground">контейнеров</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-lg font-bold text-emerald-600">{ready}</p>
                  <p className="text-[10px] text-muted-foreground">готово</p>
                </div>
                <div className="w-20 hidden md:block">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: flightShipments.length ? `${Math.round(ready / flightShipments.length * 100)}%` : '0%' }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                    {flightShipments.length ? Math.round(ready / flightShipments.length * 100) : 0}%
                  </p>
                </div>
                <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground" />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border">
                {flightShipments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Нет контейнеров в рейсе</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-max w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {['Контейнер', 'Клиент', 'Груз', 'Т°', 'Вес, кг', 'Терминал', 'Статус', 'Комментарий'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {flightShipments.map(s => (
                          <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-xs font-medium text-foreground">{s.containerNumber}</td>
                            <td className="px-4 py-2.5 text-foreground">{s.client}</td>
                            <td className="px-4 py-2.5 text-foreground">{s.cargo}</td>
                            <td className="px-4 py-2.5 text-foreground font-medium">{s.tempMode}°C</td>
                            <td className="px-4 py-2.5 text-foreground">{s.weight.toLocaleString('ru')}</td>
                            <td className="px-4 py-2.5 text-foreground">{s.terminal}</td>
                            <td className="px-4 py-2.5"><ShipmentBadge status={s.status} /></td>
                            <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">{s.comment || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
