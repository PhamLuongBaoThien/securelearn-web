import { NavLink } from 'react-router-dom';
import { profileTabs } from './profile.utils';

export const ProfileTabNav = () => (
  <nav aria-label="Cài đặt tài khoản" className="flex gap-1 overflow-x-auto pb-3 md:flex-col md:overflow-visible md:pb-0 w-full">
    {profileTabs.map((tab) => {
      const Icon = tab.icon;
      return (
        <NavLink
          key={tab.id}
          to={`/account/settings/${tab.id}`}
          className={({ isActive }) => `flex min-w-max items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Icon size={17} className="shrink-0" />
          <span>{tab.label}</span>
        </NavLink>
      );
    })}
  </nav>
);