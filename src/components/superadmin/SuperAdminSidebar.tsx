/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  SUPER_ADMIN_SIDEBAR_CONFIG,
  SuperAdminTab,
  SidebarBadgeKey,
  SidebarNavItem,
  findNavItemByPath,
  findSectionIdByTab,
} from './sidebarNavConfig';

export type { SuperAdminTab };
export { SUPER_ADMIN_SIDEBAR_CONFIG };

interface SuperAdminSidebarProps {
  currentTab: SuperAdminTab;
  onSelectTab: (tab: SuperAdminTab) => void;
  pendingApprovalsCount?: number;
  openTicketsCount?: number;
  activeEmergenciesCount?: number;
  onCloseMobile?: () => void;
}

const SECTION_ACCENT_BAR: Record<string, string> = {
  core: 'bg-violet-400',
  ecosystem: 'bg-emerald-400',
  marketplace: 'bg-amber-400',
  billing: 'bg-cyan-400',
  'our-team': 'bg-sky-400',
  operations: 'bg-rose-400',
  intelligence: 'bg-indigo-400',
  'control-bar': 'bg-fuchsia-400',
  devops: 'bg-teal-400',
  'security-audit': 'bg-slate-400',
};

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingApprovalsCount = 0,
  openTicketsCount = 0,
  activeEmergenciesCount = 0,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathMatchedItem = findNavItemByPath(location.pathname);
  const activeTabId: SuperAdminTab = pathMatchedItem ? pathMatchedItem.id : currentTab;

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const section of SUPER_ADMIN_SIDEBAR_CONFIG) {
      initial[section.id] = section.defaultOpen ?? true;
    }
    return initial;
  });

  useEffect(() => {
    const activeSectionId = findSectionIdByTab(activeTabId);
    if (activeSectionId) {
      setExpandedSections((prev) =>
        prev[activeSectionId] ? prev : { ...prev, [activeSectionId]: true }
      );
    }
  }, [activeTabId, location.pathname]);

  const badgeCounts: Record<SidebarBadgeKey, number> = {
    pendingApprovalsCount,
    openTicketsCount,
    activeEmergenciesCount,
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleItemClick = (item: SidebarNavItem) => {
    onSelectTab(item.id);
    if (location.pathname !== item.path) {
      navigate(item.path);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside className="w-64 xl:w-72 shrink-0 bg-gradient-to-b from-[#13102B] via-[#18143A] to-[#100D24] border-r border-white/10 text-slate-100 flex flex-col h-full min-h-0 select-none">
      {/* Super Admin Identity Brand Header */}
      <div className="p-4 border-b border-white/10 bg-white/[0.03] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-950/50 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm text-white truncate block tracking-tight">
              Super Admin Console
            </span>
            <p className="text-[11px] text-indigo-200/80 truncate">
              Happiiz Gate Enterprise
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation Sections */}
      <nav
        aria-label="Super Admin Sidebar Navigation"
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 scrollbar-thin"
      >
        {SUPER_ADMIN_SIDEBAR_CONFIG.map((section) => {
          const isExpanded = expandedSections[section.id] ?? true;
          const sectionHasActive = section.items.some(
            (item) =>
              activeTabId === item.id ||
              location.pathname === item.path ||
              item.aliases?.includes(location.pathname)
          );

          const sectionBadgeTotal = section.items.reduce((sum, item) => {
            if (!item.badgeKey) return sum;
            return sum + (badgeCounts[item.badgeKey] || 0);
          }, 0);

          const accentColor = SECTION_ACCENT_BAR[section.id] || 'bg-indigo-400';

          return (
            <div key={section.id} className="space-y-1">
              {/* Collapsible Section Accordion Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isExpanded}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  sectionHasActive && !isExpanded
                    ? 'text-white bg-white/10'
                    : 'text-indigo-200/65 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${accentColor} shrink-0`} />
                  <span className="truncate">{section.title}</span>
                </span>

                <span className="flex items-center gap-1.5 shrink-0">
                  {!isExpanded && sectionBadgeTotal > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-slate-950 tabular-nums">
                      {sectionBadgeTotal}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-indigo-200/60" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-200/60" />
                  )}
                </span>
              </button>

              {/* Section Child Navigation Items */}
              {isExpanded && (
                <div className="space-y-0.5 pl-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      activeTabId === item.id ||
                      location.pathname === item.path ||
                      Boolean(item.aliases?.includes(location.pathname));
                    const badgeValue = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-md shadow-indigo-950/50'
                            : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-white' : 'text-indigo-300/75'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {badgeValue > 0 && (
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                                isActive
                                  ? 'bg-white text-indigo-700'
                                  : item.badgeColor || 'bg-rose-500 text-white'
                              }`}
                            >
                              {badgeValue}
                            </span>
                          )}
                          {isActive && (
                            <ChevronRight className="w-3.5 h-3.5 text-white/90 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Clean Security Footer */}
      <div className="p-3 border-t border-white/10 bg-black/20 text-[11px] text-indigo-200/75 flex items-center justify-between shrink-0">
        <span className="font-medium">Root Access Scope</span>
        <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5" />
          Protected
        </span>
      </div>
    </aside>
  );
};
