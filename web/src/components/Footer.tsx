import { Link } from "@tanstack/react-router";

interface FooterItem {
  label: string;
  to: string;
  item: React.ReactNode;
}

interface FooterProps {
  items?: FooterItem[];
}

export default function Footer({ items }: FooterProps) {
  return (
    <footer className="top-4 inset-x-0 flex justify-center px-4">
      <div className="w-full max-w-[1200px] px-4 py-3 flex gap-4 justify-center items-center">
        {items?.map((item, index) => (
          <Link
            key={index}
            to={item.to}
            className="text-secondary hover:text-primary transition-colors border-r border-secondary last:border-0 pr-4"
          >
            {item.item}
          </Link>
        ))}
      </div>
    </footer>
  );
}
