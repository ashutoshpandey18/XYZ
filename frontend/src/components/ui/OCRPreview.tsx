interface OCRPreviewProps {
  extractedName?: string;
  extractedRoll?: string;
  extractedCollegeId?: string;
  studentName: string;
  highlightMismatches?: boolean;
}

export default function OCRPreview({
  extractedName,
  extractedRoll,
  extractedCollegeId,
  studentName,
  highlightMismatches = false,
}: OCRPreviewProps) {
  const nameMatches = extractedName?.toLowerCase().includes(studentName.toLowerCase().split(' ')[0]);
  const hasRoll = extractedRoll && extractedRoll.length === 15;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        OCR Extracted Data
      </h4>

      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-600">Name:</span>
          <span
            className={`text-sm font-medium ${
              highlightMismatches && !nameMatches
                ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded'
                : 'text-gray-900'
            }`}
          >
            {extractedName || 'Not extracted'}
          </span>
        </div>

        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-600">Roll Number:</span>
          <span
            className={`text-sm font-medium ${
              highlightMismatches && !hasRoll
                ? 'text-orange-600 bg-orange-50 px-2 py-0.5 rounded'
                : 'text-gray-900'
            }`}
          >
            {extractedRoll || 'Not extracted'}
          </span>
        </div>

        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-600">College ID:</span>
          <span className="text-sm font-medium text-gray-900">
            {extractedCollegeId || 'Not extracted'}
          </span>
        </div>
      </div>

      {highlightMismatches && (!nameMatches || !hasRoll) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-start space-x-2">
            <svg
              className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-yellow-700">
              {!nameMatches && 'Name mismatch detected. '}
              {!hasRoll && 'Invalid roll number (must be 15 digits).'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
