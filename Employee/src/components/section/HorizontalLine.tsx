
// export default function HorizontalLine({ style: any }) {
//     return (
//         <div className="overflow-x-hidden xl:my-[100px] lg:my-20 my-10" [style] = "style" >
//         <div className="max-w-[1366px] w-full mx-auto md:px-7 px-4 relative">
//             <span className="block w-dvw h-0.5 rounded-full bg-primary opacity-20 absolute top-1/2 -translate-y-1/2 sm:inset-e-[60px] inset-e-10"></span>
//             <svg className="sm:w-[18px] w-3.5 ms-auto" width="18" height="23" viewBox="0 0 18 23" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path d="M2.052 21.6H0L5.652 4.86H7.722L2.052 21.6Z" fill="#161616" />
//                 <path d="M12.052 21.6H10L15.652 4.86H17.722L12.052 21.6Z" fill="#161616" />
//             </svg>
//         </div>
//         </div >
//     )
// }


import React from 'react';

interface HorizontalLineProps {
    style?: React.CSSProperties;   // Proper typing for style prop
    className?: string;            // Optional: allow extra classes
}

export default function HorizontalLine({ style, className = '' }: HorizontalLineProps) {
    return (
        <div
            className={`overflow-x-hidden xl:my-[100px] lg:my-20 my-10 ${className}`}
            style={style}   // ✅ Now properly accepts dynamic style
        >
            <div className="max-w-[1366px] w-full mx-auto md:px-7 px-4 relative">
                <span className="block w-dvw h-0.5 rounded-full bg-primary opacity-20 absolute top-1/2 -translate-y-1/2 sm:inset-e-[60px] inset-e-10"></span>
                <svg
                    className="sm:w-[18px] w-3.5 ms-auto"
                    width="18"
                    height="23"
                    viewBox="0 0 18 23"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M2.052 21.6H0L5.652 4.86H7.722L2.052 21.6Z" fill="#161616" />
                    <path d="M12.052 21.6H10L15.652 4.86H17.722L12.052 21.6Z" fill="#161616" />
                </svg>
            </div>
        </div>
    );
}