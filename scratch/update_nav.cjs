const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/layout/Navbar.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const startIndex = content.indexOf('<nav className="sticky top-0');
const endIndex = content.indexOf('      </nav>') + 12;

if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find <nav> block");
    process.exit(1);
}

const navBlock = content.substring(startIndex, endIndex);

// Mobile Menu
const mobileMenuStr = `<button \n            className="md:hidden p-2 hover:text-primary transition-colors"\n            onClick={() => setIsMobileMenuOpen(true)}\n          >\n            <Menu className="h-6 w-6" />\n          </button>`;

// Actions Section which includes the desktop links
const desktopLinksSec = content.substring(
    content.indexOf('{/* Desktop Links */}'),
    content.indexOf('{/* Actions */}')
);

// Actions which handles user, cart, theme
const actionsStart = content.indexOf('<div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">');
const actionEndIndex = navBlock.lastIndexOf('</div>\n        </div>');
const actionSec = navBlock.substring(actionsStart, actionEndIndex);

// Logo
const logoMatch = `<Link to="/" className="flex items-center shrink-0">\n            <span className="font-extrabold text-2xl tracking-tight text-foreground transition-opacity hover:opacity-80">\n              SecureLearn\n            </span>\n          </Link>`;
const newLogo = `<Link to="/" className="flex items-center">\n              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent transform hover:scale-105 duration-300">\n                SecureLearn\n              </span>\n            </Link>`;

// Explore
const exploreSec = navBlock.substring(
    navBlock.indexOf('{/* Giao diện Danh mục trên Desktop */}'),
    navBlock.indexOf('{/* Search Bar - Flexible width */}')
);

// Search
const searchSec = navBlock.substring(
    navBlock.indexOf('{/* Search Bar - Flexible width */}'),
    navBlock.indexOf('{/* Desktop Links */}')
);
const newSearchSec = searchSec.replace('hidden md:flex flex-1 max-w-4xl items-center relative group', 'hidden md:flex w-full xl:max-w-xs items-center relative group justify-end');

let modActionSec = actionSec.replace('absolute top-full right-0 mt-2', 'absolute top-full left-0 mt-2');
modActionSec = modActionSec.replace('<div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">', '<div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto md:ml-0">');

// Reconstruct
const newNavBlock = `<nav className="sticky top-0 z-50 w-full bg-background border-b border-border shadow-sm">
        <div className="px-4 sm:px-6 flex h-[72px] items-center justify-between relative">
          
          {/* LEFT: Phần còn lại */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-start">
            ${mobileMenuStr}

            <div className="flex items-center gap-3">
              ${desktopLinksSec}
              ${modActionSec}
            </div>
          </div>

          {/* CENTER: Logo giữa có chất riêng */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center shrink-0 pointer-events-none z-20">
            <div className="pointer-events-auto">
              ${newLogo}
            </div>
          </div>

          {/* RIGHT: Khám phá và Tìm kiếm */}
          <div className="flex items-center gap-3 flex-1 justify-end z-10">
            ${exploreSec}
            ${newSearchSec}
          </div>

        </div>
        
        {/* Mobile Search Bar Dropdown */}
        {isMobileSearchOpen && (
          <div className="md:hidden px-4 pb-4 pt-2 bg-background border-b border-border">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-5 w-5 text-muted-foreground z-10" />
              <Input 
                type="text" 
                placeholder="Tìm kiếm khóa học..." 
                className="w-full h-12 pl-10 pr-4 bg-secondary/60 border-transparent rounded-full"
              />
            </div>
          </div>
        )}
      </nav>`;

content = content.replace(navBlock, newNavBlock);
fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully rebuilt the Navbar.");
