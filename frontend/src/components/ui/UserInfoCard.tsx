interface UserInfoCardProps {
  name: string;
  email: string;
  collegeEmail?: string;
  role?: string;
  avatarUrl?: string;
}

export default function UserInfoCard({
  name,
  email,
  collegeEmail,
  role,
  avatarUrl,
}: UserInfoCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              className="h-12 w-12 rounded-full object-cover"
              src={avatarUrl}
              alt={name}
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">{initials}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-500 truncate">{email}</p>
          {collegeEmail && (
            <p className="text-sm text-blue-600 truncate mt-1">
              <span className="inline-flex items-center">
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {collegeEmail}
              </span>
            </p>
          )}
          {role && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-2">
              {role}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
