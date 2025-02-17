import {
  AlarmClockIcon,
  SquareCheck,
  BookmarkIcon,
  ClockArrowUpIcon,
} from "lucide-react";

export default function Button({ label, isActive, onClick }) {
  // Fungsi untuk menampilkan ikon berdasarkan label
  const renderIcon = () => {
    switch (label) {
      case "New":
        return <ClockArrowUpIcon className="size-5 mr-4" />;
      case "All":
        return <BookmarkIcon className="size-5 mr-4" />;
      case "Active":
        return <AlarmClockIcon className="size-5 mr-4" />;
      case "Completed":
        return <SquareCheck className="size-5 mr-4" />;
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center px-4 py-3 rounded-full text-sm font-medium 
        ${isActive ? "bg-[#6BBF74] text-white" : "text-[#6BBF74] bg-white"} 
        focus:outline-none border 
        ${
          isActive
            ? "border-[#6BBF74]"
            : "border-[#6BBF74] hover:bg-[#6BBF74] hover:text-white"
        } 
        hover:border-[#58A663] focus:bg-[#58A663] active:bg-[#4F9A5F] 
        transition-all duration-200 shadow-sm hover:shadow-md`}
      value={label}
    >
      {renderIcon()}
      {label}
    </button>
  );
}
