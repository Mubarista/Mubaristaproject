export function MastercardIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="32" rx="4" fill="#000000"/>
      <circle cx="18" cy="16" r="10" fill="#EB001B"/>
      <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
      <path
        d="M24 8.5C26.8 10.4 28.5 13.5 28.5 16.5C28.5 19.5 26.8 22.6 24 24.5C21.2 22.6 19.5 19.5 19.5 16.5C19.5 13.5 21.2 10.4 24 8.5Z"
        fill="#FF5F00"
      />
    </svg>
  );
}
