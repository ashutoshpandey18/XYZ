import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

const Card = ({ children, className = "", hoverable = false }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        bg-white
        rounded-2xl
        shadow-sm
        border border-gray-100
        ${hoverable ? "hover:shadow-md transition-shadow duration-300" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default Card;
