import { useNavigate } from "@tanstack/react-router";
import { IoIosAddCircle } from "react-icons/io";
import IconButton from "./IconButton";

export default function NavBar() {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
      <div className="w-full max-w-[1200px] px-4 py-3 flex justify-between items-center bg-bg/80 backdrop-blur-md">
        <h1
          className="text-primary font-heading text-2xl font-bold hover:cursor-pointer select-none"
          onClick={() => navigate({ to: "/" })}
        >
          Chronically Onleet
        </h1>
        <div className="flex items-center space-x-4">
          <IconButton
            icon={<IoIosAddCircle size={22} />}
            variant={"hollow"}
            onClick={() =>
              window.open(
                "https://discord.com/oauth2/authorize?client_id=1434137504142987295",
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            Invite
          </IconButton>
        </div>
      </div>
    </nav>
  );
}
