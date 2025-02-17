import { AlarmClockIcon, SquareCheck, BookmarkIcon, ClockArrowUpIcon } from "lucide-react";

export default function Button({ label, isActive, onClick }) {

  const renderIcon = () => {
    switch (label) {
      case 'New':
        return <ClockArrowUpIcon className="size-5 mr-4" />;
      case 'All':
        return <BookmarkIcon className="size-5 mr-4" />;
      case 'Active':
        return <AlarmClockIcon className="size-5 mr-4" />;
      case 'Completed':
        return <SquareCheck className="size-5 mr-4" />;
      default:
        return null;
    }
  };
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center px-4 py-3 rounded-full text-sm font-medium 
        ${isActive ? 'bg-indigo-600 text-white' : 'text-indigo-600 bg-white'} 
        focus:outline-none m-1 hover:m-0 focus:m-0 border 
        ${isActive ? 'border-indigo-600' : 'border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800'} 
        focus:border-purple-200 active:border-gray-900 active:text-gray-900 
        transition-all duration-200`}
        value={label}
    >
      {renderIcon()}
      {label}
    </button>
  );
}