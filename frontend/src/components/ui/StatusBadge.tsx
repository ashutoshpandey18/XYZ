import { motion } from "framer-motion";

type Status = "PENDING" | "APPROVED" | "REJECTED";

interface StatusBadgeProps {
  status: Status;
}

const statusConfig = {
  PENDING: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Pending",
  },
  APPROVED: {
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Approved",
  },
  REJECTED: {
    color: "bg-red-100 text-red-800 border-red-200",
    label: "Rejected",
  },
};

function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </motion.span>
  );
}

export default StatusBadge;
