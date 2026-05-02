import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Menu,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';

export interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

export interface MenuGroup {
  groupName: string;
  groupIcon?: React.ReactNode;
  items: MenuItem[];
}

export interface MenuLabel {
  labelName: string;
  items: MenuItem[];
}

export type SidebarEntry =
  | { type: 'single'; name: string; path: string; icon: React.ReactNode; children?: MenuItem[] }
  | { type: 'group'; group: MenuGroup }
  | { type: 'label'; label: MenuLabel };

export interface SidebarProps {
  entries: SidebarEntry[];
  roleTitle?: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  
  // User info
  userFullName?: string;
  userEmail?: string;
  userAvatarNode?: React.ReactNode;
  userBadgeNode?: React.ReactNode; // Badge vai trò hiển thị bên dưới email
  profileLink?: string;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  onThemeChange: () => void;
  
  // Actions
  onLogout?: () => void;

  logoSrc: string;
}

// Recursive Menu Item for nested subcategories
const RecursiveMenuItem: React.FC<{
  item: MenuItem;
  collapsed: boolean;
  currentPath: string;
  isTopLevel?: boolean;
}> = ({ item, collapsed, currentPath, isTopLevel = false }) => {
  const hasChildren = item.children && item.children.length > 0;
  
  const isDescendantActive = (m: MenuItem): boolean => {
    if (currentPath === m.path || currentPath.startsWith(m.path + '/')) return true;
    if (m.children) return m.children.some(isDescendantActive);
    return false;
  };
  
  const isActive = isDescendantActive(item);
  const [open, setOpen] = useState(false); // Default closed for cleaner look, or isActive if preferred

  const toggleOpen = (e: React.MouseEvent) => {
    if (hasChildren && !collapsed) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  };

  if (!hasChildren) {
    return (
      <NavLink
        to={item.path}
        className={({ isActive: linkActive }) =>
          `flex items-center ${isTopLevel ? 'gap-3 px-3 py-2.5 rounded-xl' : 'gap-2.5 px-3 py-2 rounded-lg'} text-sm transition-colors duration-150 relative ${
            linkActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-200'
          } ${collapsed ? 'justify-center' : ''}`
        }
      >
        {({ isActive: linkActive }) => (
          <>
            <span className={`shrink-0 ${linkActive && isTopLevel ? 'text-primary' : ''}`}>
              {item.icon}
            </span>
            {!collapsed && <span className="break-words line-clamp-2">{item.name}</span>}
            {linkActive && !collapsed && isTopLevel && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md shadow-[0_0_10px_theme('colors.primary.DEFAULT')]" />
            )}
          </>
        )}
      </NavLink>
    );
  }

  return (
    <div className="w-full relative">
      <div
        className={`w-full flex items-stretch ${isTopLevel ? 'rounded-xl' : 'rounded-lg'} transition-colors duration-150 ${
          isActive && collapsed
            ? 'bg-primary/10 text-primary'
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-200'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <NavLink
          to={item.path}
          title={collapsed ? item.name : ''}
          className={`flex flex-1 items-center ${isTopLevel ? 'gap-3 px-3 py-2.5' : 'gap-2.5 px-3 py-2'} text-sm relative`}
        >
          {({ isActive: linkActive }) => (
            <>
              <span className={`shrink-0 ${linkActive && isTopLevel ? 'text-primary' : ''}`}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className={`flex-1 text-left break-words line-clamp-2 ${isActive ? 'font-medium text-primary' : ''}`}>{item.name}</span>
              )}
              {linkActive && !collapsed && isTopLevel && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md shadow-[0_0_10px_theme('colors.primary.DEFAULT')]" />
              )}
            </>
          )}
        </NavLink>
        
        {!collapsed && (
          <button
            onClick={toggleOpen}
            className={`px-3 flex items-center justify-center hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 ${isTopLevel ? 'rounded-r-xl' : 'rounded-r-lg'} transition-colors border-l border-transparent hover:border-zinc-300 dark:hover:border-zinc-700`}
          >
            <span className="transition-transform duration-200">
              {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
          </button>
        )}
      </div>

      {!collapsed && open && (
        <div className="ml-4 mt-1 pl-3 border-l border-zinc-200 dark:border-zinc-800 space-y-1">
          {item.children!.map((child, idx) => (
            <RecursiveMenuItem
              key={child.path + idx}
              item={child}
              collapsed={collapsed}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Sub-component: Group Menu
const GroupMenu: React.FC<{
  group: MenuGroup;
  collapsed: boolean;
  currentPath: string;
}> = ({ group, collapsed, currentPath }) => {
  const isGroupActive = group.items.some((item) => currentPath.startsWith(item.path));
  const [open, setOpen] = useState(isGroupActive);

  const toggleOpen = () => {
    if (!collapsed) setOpen((prev) => !prev);
  };

  return (
    <div>
      {/* Group Header */}
      <button
        onClick={toggleOpen}
        title={collapsed ? group.groupName : ''}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 ${
          isGroupActive && collapsed
            ? 'bg-primary/10 text-primary'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <span className={`shrink-0 ${isGroupActive ? 'text-primary' : ''}`}>
          {group.groupIcon}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 text-left font-medium text-sm break-words line-clamp-2 pr-2">{group.groupName}</span>
            <span className="transition-transform duration-200">
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          </>
        )}
      </button>

      {/* Group Items */}
      {!collapsed && open && (
        <div className="ml-3 mt-1 pl-3 border-l border-zinc-200 dark:border-zinc-800 space-y-1">
          {group.items.map((item, idx) => (
            <RecursiveMenuItem
              key={item.path + idx}
              item={item}
              collapsed={collapsed}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  entries,
  roleTitle,
  collapsed,
  onToggleCollapsed,
  userFullName,
  userEmail,
  userAvatarNode,
  userBadgeNode,
  profileLink,
  theme,
  onThemeChange,
  onLogout,
  logoSrc
}) => {
  const location = useLocation();

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-5 h-5 shrink-0" />;
    if (theme === 'dark') return <Moon className="w-5 h-5 shrink-0" />;
    return <Monitor className="w-5 h-5 shrink-0" />;
  };

  return (
    <aside
      className={`${collapsed ? 'w-20' : 'w-72'} bg-white/80 dark:bg-zinc-950/50 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-800/60 flex flex-col fixed h-full z-20 transition-[width] duration-200 ease-out will-change-[width]`}
    >
      {/* Header Sidebar */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800/60 shrink-0">
        <div
          className={`flex items-center gap-3 text-primary overflow-hidden transition-[width,opacity] duration-200 ease-out ${collapsed ? 'opacity-0 w-0' : 'w-[calc(100%-3.5rem)] opacity-100'}`}
        >
          <div className="bg-primary/10 p-2 rounded-xl shrink-0">
            <img src={logoSrc} alt="SecureLearn logo" className="w-6 h-6 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white whitespace-nowrap">Secure Learn</h1>
            {roleTitle && <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{roleTitle}</p>}
          </div>
        </div>

        <button
          onClick={onToggleCollapsed}
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* User Info */}
      {profileLink ? (
        <>
          {!collapsed && (
            <NavLink
              to={profileLink}
              className={({ isActive }) =>
                `p-4 flex items-center gap-3 shrink-0 rounded-xl mx-3 mt-2 transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary/10 ring-1 ring-primary/20'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`
              }
              title="Quản lý tài khoản"
            >
              {userAvatarNode}
              <div className="flex flex-col overflow-hidden gap-0.5">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{userFullName}</span>
                <span className="text-xs text-zinc-500 truncate">{userEmail}</span>
                {userBadgeNode}
              </div>
            </NavLink>
          )}
          {collapsed && (
            <NavLink
              to={profileLink}
              title="Quản lý tài khoản"
              className="flex items-center justify-center p-3 mx-3 mt-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {userAvatarNode}
            </NavLink>
          )}
        </>
      ) : (
        <>
          {!collapsed && (
            <div className="p-4 flex items-center gap-3 shrink-0 rounded-xl mx-3 mt-2 transition-colors duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              {userAvatarNode}
              <div className="flex flex-col overflow-hidden gap-0.5">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{userFullName}</span>
                <span className="text-xs text-zinc-500 truncate">{userEmail}</span>
                {userBadgeNode}
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center p-3 mx-3 mt-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
              {userAvatarNode}
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar ${collapsed ? 'mt-4 space-y-2' : 'mt-2 space-y-1'}`}>
        {entries.map((entry, idx) => {
          if (entry.type === 'single') {
            return (
              <RecursiveMenuItem
                key={entry.path + idx}
                item={entry as MenuItem}
                collapsed={collapsed}
                currentPath={location.pathname}
                isTopLevel={true}
              />
            );
          } else if (entry.type === 'group') {
            return (
              <GroupMenu
                key={idx}
                group={entry.group}
                collapsed={collapsed}
                currentPath={location.pathname}
              />
            );
          } else if (entry.type === 'label') {
            return (
              <div key={idx} className={`${idx > 0 ? 'mt-4' : ''}`}>
                {/* Group Label */}
                {!collapsed && (
                  <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                    {entry.label.labelName}
                  </p>
                )}
                <div className="space-y-0.5">
                  {entry.label.items.map((item, idx) => (
                    <RecursiveMenuItem
                      key={item.path + idx}
                      item={item as MenuItem}
                      collapsed={collapsed}
                      currentPath={location.pathname}
                      isTopLevel={true}
                    />
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })}
      </nav>

      {/* Footer Area */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/60 shrink-0 space-y-2">
        <button
          onClick={onThemeChange}
          title={collapsed ? "Đổi giao diện" : ""}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group ${collapsed ? 'justify-center' : ''}`}
        >
          <div>{getThemeIcon()}</div>
          {!collapsed && <span className="font-medium whitespace-nowrap text-sm">
            {theme === 'light' ? 'Nền sáng' : theme === 'dark' ? 'Nền tối' : 'Mặc định HT'}
          </span>}
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            title={collapsed ? "Đăng xuất" : ""}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 transition-colors group ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="font-medium whitespace-nowrap text-sm">Đăng xuất</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
