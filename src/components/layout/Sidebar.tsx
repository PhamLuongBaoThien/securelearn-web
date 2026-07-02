import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
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
import { sidebarSubMenuVariants, sidebarTextVariants } from '@/components/animations/sidebar';

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
  userBadgeNode?: React.ReactNode;
  profileLink?: string;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  onThemeChange: () => void;
  
  // Actions
  onLogout?: () => void;

  logoSrc: string;

  // Custom animations configuration
  subMenuVariants?: Variants;
  textVariants?: Variants;
}

// Sidebar Animation Context to prevent prop drilling down to recursive sub-menus
interface SidebarAnimationContextType {
  subMenuVariants: Variants;
  textVariants: Variants;
}

const SidebarAnimationContext = createContext<SidebarAnimationContextType>({
  subMenuVariants: sidebarSubMenuVariants,
  textVariants: sidebarTextVariants,
});

// Recursive Menu Item for nested subcategories
const RecursiveMenuItem: React.FC<{
  item: MenuItem;
  collapsed: boolean;
  currentPath: string;
  isTopLevel?: boolean;
}> = ({ item, collapsed, currentPath, isTopLevel = false }) => {
  const { subMenuVariants, textVariants } = useContext(SidebarAnimationContext);
  const hasChildren = item.children && item.children.length > 0;
  
  const isDescendantActive = (m: MenuItem): boolean => {
    if (currentPath === m.path || currentPath.startsWith(m.path + '/')) return true;
    if (m.children) return m.children.some(isDescendantActive);
    return false;
  };
  
  const isActive = isDescendantActive(item);
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setOpen(true);
    }
  }, [isActive]);

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
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="break-words line-clamp-2 truncate whitespace-nowrap overflow-hidden"
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>
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
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className={`flex-1 text-left break-words line-clamp-2 truncate whitespace-nowrap overflow-hidden ${isActive ? 'font-medium text-primary' : ''}`}
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
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

      <AnimatePresence initial={false}>
        {!collapsed && open && (
          <motion.div
            variants={subMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="ml-4 mt-1 pl-3 border-l border-zinc-200 dark:border-zinc-800 space-y-1 overflow-hidden"
          >
            {item.children!.map((child, idx) => (
              <RecursiveMenuItem
                key={child.path + idx}
                item={child}
                collapsed={collapsed}
                currentPath={currentPath}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-component: Group Menu
const GroupMenu: React.FC<{
  group: MenuGroup;
  collapsed: boolean;
  currentPath: string;
}> = ({ group, collapsed, currentPath }) => {
  const { subMenuVariants, textVariants } = useContext(SidebarAnimationContext);
  const isGroupActive = group.items.some((item) => currentPath.startsWith(item.path));
  const [open, setOpen] = useState(isGroupActive);

  useEffect(() => {
    if (isGroupActive) {
      setOpen(true);
    }
  }, [isGroupActive]);

  const toggleOpen = () => {
    if (!collapsed) setOpen((prev) => !prev);
  };

  return (
    <div className="w-full">
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
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
            >
              <span className="flex-1 text-left font-medium text-sm truncate pr-2">{group.groupName}</span>
              <span className="transition-transform duration-200 shrink-0">
                {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Group Items */}
      <AnimatePresence initial={false}>
        {!collapsed && open && (
          <motion.div
            variants={subMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="ml-3 mt-1 pl-3 border-l border-zinc-200 dark:border-zinc-800 space-y-1 overflow-hidden"
          >
            {group.items.map((item, idx) => (
              <RecursiveMenuItem
                key={item.path + idx}
                item={item}
                collapsed={collapsed}
                currentPath={currentPath}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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
  logoSrc,
  subMenuVariants = sidebarSubMenuVariants,
  textVariants = sidebarTextVariants,
}) => {
  const location = useLocation();
  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (navRef.current) {
        const activeLink = navRef.current.querySelector('.bg-primary\\/10');
        if (activeLink) {
          activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [location.pathname, collapsed]);

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-5 h-5 shrink-0" />;
    if (theme === 'dark') return <Moon className="w-5 h-5 shrink-0" />;
    return <Monitor className="w-5 h-5 shrink-0" />;
  };

  return (
    <SidebarAnimationContext.Provider value={{ subMenuVariants, textVariants }}>
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
          <NavLink
            to={profileLink}
            className={({ isActive }) =>
              `p-4 flex items-center gap-3 shrink-0 rounded-xl mx-3 mt-2 transition-colors duration-150 ${
                isActive
                  ? 'bg-primary/10 ring-1 ring-primary/20'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title="Quản lý tài khoản"
          >
            {userAvatarNode}
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="flex flex-col overflow-hidden gap-0.5 whitespace-nowrap"
                >
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{userFullName}</span>
                  <span className="text-xs text-zinc-500 truncate">{userEmail}</span>
                  {userBadgeNode}
                </motion.div>
              )}
            </AnimatePresence>
          </NavLink>
        ) : (
          <div className={`p-4 flex items-center gap-3 shrink-0 rounded-xl mx-3 mt-2 transition-colors duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-900 ${collapsed ? 'justify-center' : ''}`}>
            {userAvatarNode}
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="flex flex-col overflow-hidden gap-0.5 whitespace-nowrap"
                >
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{userFullName}</span>
                  <span className="text-xs text-zinc-500 truncate">{userEmail}</span>
                  {userBadgeNode}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Navigation */}
        <nav ref={navRef} className={`flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar ${collapsed ? 'mt-4 space-y-2' : 'mt-2 space-y-1'}`}>
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
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.p
                        variants={textVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 truncate"
                      >
                        {entry.label.labelName}
                      </motion.p>
                    )}
                  </AnimatePresence>
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
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="font-medium whitespace-nowrap text-sm truncate"
                >
                  {theme === 'light' ? 'Nền sáng' : theme === 'dark' ? 'Nền tối' : 'Mặc định HT'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              title={collapsed ? "Đăng xuất" : ""}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 transition-colors group ${collapsed ? 'justify-center' : ''}`}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="font-medium whitespace-nowrap text-sm truncate"
                  >
                    Đăng xuất
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}
        </div>
      </aside>
    </SidebarAnimationContext.Provider>
  );
};
