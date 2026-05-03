import { cva, type VariantProps } from "class-variance-authority";

const buttonStyles = cva(
  "inline-flex items-center justify-center py-2 px-4 gap-[4px] rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary hover:bg-accent text-bg hover:text-text",
        secondary: "bg-secondary hover:bg-primary",
        accent: "bg-accent hover:bg-primary",
        hollow: "bg-transparent hover:bg-primary border border-[2px] text-primary hover:text-text border-primary",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

interface IconButtonProps extends VariantProps<typeof buttonStyles> {
  onClick?: () => void;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  isIconRight?: boolean;
}

export default function IconButton({ onClick, children, icon, variant, isIconRight }: IconButtonProps) {
  return (
    <button className={buttonStyles({ variant })} onClick={onClick}>
      {isIconRight ? (
        <>
          {children}
          {icon}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
