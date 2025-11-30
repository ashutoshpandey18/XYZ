const Logo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <rect width="48" height="48" rx="12" fill="#2563EB" />
        <path
          d="M14 18L24 25L34 18M14 30H34V18H14V30Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default Logo;
