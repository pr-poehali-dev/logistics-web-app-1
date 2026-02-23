import { useAppStore } from '@/store/appStore';
import { USERS } from '@/data/mock';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  logist: 'Логист',
  manager: 'Менеджер',
  director: 'Директор',
};

const ROLE_COLORS: Record<string, string> = {
  logist: 'bg-blue-100 text-blue-700',
  manager: 'bg-violet-100 text-violet-700',
  director: 'bg-amber-100 text-amber-700',
};

const ACTION_ICONS: Record<string, string> = {
  'Изменён статус': 'RefreshCw',
  'Создан рейс': 'Train',
  'Обновлены документы': 'FileText',
  'Добавлено оборудование': 'Package',
  'Редактирование отправки': 'Edit3',
  'Редактирование оборудования': 'Wrench',
};

export default function Accounts() {
  const { logs, currentUser } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Пользователи системы</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {USERS.map(user => (
            <div key={user.id} className={cn(
              'bg-card rounded-xl border border-border p-4 transition-shadow hover:shadow-sm animate-fade-in',
              currentUser?.id === user.id && 'ring-2 ring-primary'
            )}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                  {user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[user.role])}>
                      {ROLE_LABELS[user.role]}
                    </span>
                    {currentUser?.id === user.id && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Вы
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Журнал действий</h2>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Нет записей</p>
          ) : (
            <div className="divide-y divide-border">
              {logs.slice(0, 50).map(log => (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name={ACTION_ICONS[log.action] ?? 'Activity'} size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{log.userName}</span>
                      <span className="text-sm text-muted-foreground">{log.action}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{log.entity} #{log.entityId}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
