import React from 'react';

interface NavLinkProps {
  href: string;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const NavLinkItem: React.FC<NavLinkProps> = ({ label, href, active, disabled, onClick }) => {
 const baseClass =
    'text-secondary font-just font-medium no-underline relative after:hidden transition-all duration-300 ease-in-out cursor-pointer';

  const homeStyle =
    "text-secondary font-just font-medium no-underline relative after:hidden transition-all duration-300 ease-in-out lg:[&.active]:after:block [&.active]:font-just [&.active]:font-bold [&.active]:text-primary [&.active]:after:content-[''] [&.active]:after:top-1/2 [&.active]:after:-translate-y-1/2 [&.active]:xl:after:-start-3 [&.active]:after:-start-2 [&.active]:after:end-0 [&.active]:after:absolute [&.active]:after:border-t-4 [&.active]:after:border-b-4 [&.active]:after:border-s-5 [&.active]:after:border-t-transparent [&.active]:after:border-b-transparent [&.active]:after:border-s-primary [&.active]:after:w-0 [&.active]:after:h-0 [&.active]:after:me-auto";

  const otherStyle =
    "text-secondary font-just font-medium no-underline relative transition-all duration-300 ease-in-out lg:[&.active]:after:block [&.active]:font-just [&.active]:font-bold [&.active]:text-primary [&.active]:after:content-[''] [&.active]:after:top-1/2 [&.active]:after:-translate-y-1/2 [&.active]:xl:after:-start-3 [&.active]:after:-start-2 [&.active]:after:end-0 [&.active]:after:absolute [&.active]:after:border-t-4 [&.active]:after:border-b-4 [&.active]:after:border-s-5 [&.active]:after:border-t-transparent [&.active]:after:border-b-transparent [&.active]:after:border-s-primary [&.active]:after:w-0 [&.active]:after:h-0 [&.active]:after:me-auto";

  const className = `${baseClass} ${active ? 'active' : ''} ${
    href === '/' ? homeStyle : otherStyle
  }`;

  return (
    <li className=" lg:mb-0 mb-3">
      <a className={`${className} ${disabled ? 'pointer-events-none opacity-50' : ''}`} onClick={disabled ? undefined : onClick}>
        {label}
      </a>
    </li>
  );
};

export default NavLinkItem;

// const NavLinkItem: React.FC<NavLinkProps> = ({ href, label, active, onClick }) => {
//   const baseClass =
//     'text-secondary [&.active]:text-primary [&.active]:font-just font-just no-underline relative transition-all duration-300 ease-in-out after:hidden hover:after:block lg:[&.active]:after:block';

//   const homeStyle =
//     "after:content-[''] after:top-0.5 after:translate-y-1/2 after:-start-17 after:end-0 after:absolute after:border-t-4 after:border-b-4 after:border-s-5 after:border-t-transparent after:border-b-transparent after:border-s-primary after:w-0 after:h-0 after:mx-auto";

//   const otherStyle =
//     "after:content-[''] after:-bottom-1.5 after:start-0 after:end-0 after:absolute after:w-[.31rem] after:h-[.31rem] after:rounded-full after:bg-primary after:mx-auto";

//   const className = `${baseClass} ${active ? 'active' : ''} ${
//     label === 'Home' ? homeStyle : otherStyle
//   }`;

//   return (
//     <li className="lg:mb-0 mb-3">
//       <a  className={className} onClick={onClick}>
//         {label}
//       </a>
//     </li>
//   );
// };
