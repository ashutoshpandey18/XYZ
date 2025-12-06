import { motion } from 'framer-motion';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  status: 'completed' | 'current' | 'pending';
  icon?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 ? (
                <span
                  className={`absolute left-4 top-4 -ml-px h-full w-0.5 ${
                    event.status === 'completed' ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: eventIdx * 0.1 }}
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      event.status === 'completed'
                        ? 'bg-green-500'
                        : event.status === 'current'
                        ? 'bg-blue-500 animate-pulse'
                        : 'bg-gray-300'
                    }`}
                  >
                    {event.icon ? (
                      <span className="text-white text-sm">{event.icon}</span>
                    ) : (
                      <svg
                        className="h-5 w-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </motion.span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        event.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      {event.title}
                    </p>
                    {event.description && (
                      <p className="mt-0.5 text-sm text-gray-500">{event.description}</p>
                    )}
                  </div>
                  {event.timestamp && (
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <time dateTime={event.timestamp}>
                        {new Date(event.timestamp).toLocaleString()}
                      </time>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
