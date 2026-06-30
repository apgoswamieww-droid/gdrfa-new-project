import { twMerge } from "tailwind-merge";

// Heading variant
const headingVariants = {
  h1: "2xl:text-2xl/tight xl:text-xl/tight text-lg/tight",
  h2: "2xl:text-xl/tight xl:text-lg/tight text-base/tight",
  h3: "2xl:text-lg/tight xl:text-base/tight text-sm/tight",
  h4: "2xl:text-base/tight xl:text-sm/tight text-xs/tight",
//   h5: "",
//   h6: "",
} as const;

type HeadingVariant = keyof typeof headingVariants;

// Text Variant 
const textVariants = {
  textXss: "text-[10px]/tight",
  textXs: "text-[11px]/tight",
  textSm: "text-xs/tight",
  textBase: "2xl:text-sm/tight text-[13px]/tight",
  textLg: "2xl:text-base/tight xl:text-sm/tight text-[13px]/tight",
} as const;

type TextVariant = keyof typeof textVariants;

type PolymorphicProps<T extends React.ElementType> = {
  as?: T;
  className?: string;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<T>;

// Heading component
type HeadingProps<T extends React.ElementType> = PolymorphicProps<T> & {
  variant: HeadingVariant;
};

export function Heading<T extends React.ElementType = "h2">({
  as,
  variant,
  className,
  children,
  ...props
}: HeadingProps<T>) {
  const Component = as || variant;

  return (
    <Component
      className={twMerge(headingVariants[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
}

// Text component
type TextProps<T extends React.ElementType> = PolymorphicProps<T> & {
  variant?: TextVariant;
};

export function Text<T extends React.ElementType = "p">({
  as,
  variant = "textLg",
  className,
  children,
  ...props
}: TextProps<T>) {
  const Component = as || "p";

  return (
    <Component
      className={twMerge(textVariants[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
