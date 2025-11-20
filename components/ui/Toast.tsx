import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type }) => {
  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center w-full max-w-xs p-4 text-white ${bgColor} rounded-lg shadow-lg transition-transform animate-fade-in-right`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-white/20">
        <Icon className="w-5 h-5" />
        <span className="sr-only">{isSuccess ? 'Success' : 'Error'} icon</span>
      </div>
      <div className="ml-3 text-sm font-medium">{message}</div>
    </div>
  );
};

// Simple animation definition in a style tag, as we can't add a CSS file.
const animationStyle = `
@keyframes fade-in-right {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-fade-in-right {
  animation: fade-in-right 0.3s ease-out forwards;
}
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = animationStyle;
document.head.appendChild(styleSheet);
