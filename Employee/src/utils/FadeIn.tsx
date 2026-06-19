// import { useEffect, useRef, useState } from "react";

// export const Section = ({ id, children }: any) => {
//   const ref = useRef<HTMLDivElement>(null);
//   const [visible, setVisible] = useState(false);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) setVisible(true);
//       },
//       { threshold: 0.2 }
//     );

//     if (ref.current) observer.observe(ref.current);

//     return () => {
//       if (ref.current) observer.unobserve(ref.current);
//     };
//   }, []);

//   return (
//     <section
//       id={id}
//       ref={ref}
//       className={` transition-opacity duration-1000 ease-in-out ${
//         visible ? "opacity-100" : "opacity-0"
//       }`}
//     >
//       {children}
//     </section>
//   );
// };
