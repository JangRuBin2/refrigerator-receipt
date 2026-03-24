'use client';

import { useState, useMemo } from 'react';
import { useDebugStore, type DebugLog } from '@/store/useDebugStore';

type TabType = 'logs' | 'renders' | 'state';

const TYPE_COLORS: Record<DebugLog['type'], string> = {
  error: 'text-red-400',
  warn: 'text-yellow-400',
  info: 'text-blue-400',
  render: 'text-green-400',
  state: 'text-purple-400',
};

const TYPE_BG: Record<DebugLog['type'], string> = {
  error: 'bg-red-900/30',
  warn: 'bg-yellow-900/30',
  info: 'bg-blue-900/30',
  render: 'bg-green-900/30',
  state: 'bg-purple-900/30',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
}

export function DebugOverlay() {
  const { isEnabled, isOverlayOpen, logs, renderCounts, toggleOverlay, clearLogs, disable } = useDebugStore();
  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [filterType, setFilterType] = useState<DebugLog['type'] | 'all'>('all');

  const filteredLogs = useMemo(() => {
    if (filterType === 'all') return logs;
    return logs.filter((l) => l.type === filterType);
  }, [logs, filterType]);

  const sortedRenders = useMemo(() => {
    return Object.entries(renderCounts)
      .sort(([, a], [, b]) => b - a);
  }, [renderCounts]);

  const errorCount = logs.filter((l) => l.type === 'error').length;

  if (!isEnabled) return null;

  return (
    <>
      {/* Floating debug button */}
      <button
        onClick={toggleOverlay}
        className="fixed left-3 bottom-20 z-[9999] flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white shadow-lg ring-2 ring-white/20"
        style={{ touchAction: 'manipulation' }}
      >
        {errorCount > 0 ? (
          <span className="text-red-400">{errorCount}</span>
        ) : (
          <span>D</span>
        )}
      </button>

      {/* Overlay panel */}
      {isOverlayOpen && (
        <div className="fixed inset-0 z-[10000] flex flex-col bg-gray-950/95 text-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
            <span className="text-sm font-bold">Debug Console</span>
            <div className="flex gap-2">
              <button
                onClick={clearLogs}
                className="rounded bg-gray-700 px-2 py-1 text-xs"
              >
                Clear
              </button>
              <button
                onClick={() => { disable(); }}
                className="rounded bg-red-800 px-2 py-1 text-xs"
              >
                Off
              </button>
              <button
                onClick={toggleOverlay}
                className="rounded bg-gray-700 px-2 py-1 text-xs"
              >
                X
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {(['logs', 'renders', 'state'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-medium ${
                  activeTab === tab ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400'
                }`}
              >
                {tab === 'logs' && `Logs (${logs.length})`}
                {tab === 'renders' && `Renders (${sortedRenders.length})`}
                {tab === 'state' && 'Store'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'logs' && (
              <>
                {/* Filter bar */}
                <div className="flex gap-1 border-b border-gray-800 px-2 py-1">
                  {(['all', 'error', 'warn', 'info', 'render'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`rounded px-2 py-0.5 text-xs ${
                        filterType === type
                          ? 'bg-gray-600 text-white'
                          : 'text-gray-500'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Log entries */}
                <div className="space-y-px p-1">
                  {filteredLogs.length === 0 && (
                    <p className="py-8 text-center text-xs text-gray-500">No logs yet</p>
                  )}
                  {[...filteredLogs].reverse().map((log) => (
                    <div
                      key={log.id}
                      className={`rounded px-2 py-1.5 text-xs ${TYPE_BG[log.type]}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono text-[10px]">
                          {formatTime(log.timestamp)}
                        </span>
                        <span className={`font-bold uppercase text-[10px] ${TYPE_COLORS[log.type]}`}>
                          {log.type}
                        </span>
                        <span className="text-gray-400 text-[10px]">[{log.source}]</span>
                      </div>
                      <p className="mt-0.5 break-all text-gray-200 font-mono text-[11px] leading-relaxed">
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'renders' && (
              <div className="p-2">
                <p className="mb-2 text-[10px] text-gray-500">
                  Sorted by render count (high = suspicious)
                </p>
                {sortedRenders.length === 0 && (
                  <p className="py-8 text-center text-xs text-gray-500">
                    Add useDebugRender() to components to track
                  </p>
                )}
                {sortedRenders.map(([name, count]) => (
                  <div
                    key={name}
                    className={`flex items-center justify-between rounded px-2 py-1.5 text-xs ${
                      count > 50 ? 'bg-red-900/30' : count > 20 ? 'bg-yellow-900/30' : 'bg-gray-800/50'
                    }`}
                  >
                    <span className="font-mono text-gray-200">{name}</span>
                    <span className={`font-bold ${
                      count > 50 ? 'text-red-400' : count > 20 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {count}x
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'state' && (
              <StoreViewer />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function StoreViewer() {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Import store state dynamically to avoid circular deps
  let storeState: Record<string, unknown> = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useStore } = require('@/store/useStore');
    const state = useStore.getState();
    storeState = {
      'ingredients.length': (state.ingredients as unknown[])?.length ?? 0,
      '_dbSyncEnabled': state._dbSyncEnabled,
      'favoriteRecipeIds': state.favoriteRecipeIds,
      'settings': state.settings,
    };
  } catch {
    storeState = { error: 'Failed to read store' };
  }

  return (
    <div className="p-2 space-y-1">
      {Object.entries(storeState).map(([key, value]) => {
        const strValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        const isLong = strValue.length > 50;

        return (
          <div key={key} className="rounded bg-gray-800/50 px-2 py-1.5">
            <button
              onClick={() => isLong && setExpanded(expanded === key ? null : key)}
              className="flex w-full items-center justify-between text-left text-xs"
            >
              <span className="font-mono text-purple-400">{key}</span>
              {!isLong && (
                <span className="font-mono text-gray-300 text-[11px]">{strValue}</span>
              )}
            </button>
            {isLong && expanded === key && (
              <pre className="mt-1 overflow-x-auto text-[10px] text-gray-300 font-mono whitespace-pre-wrap">
                {strValue}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
