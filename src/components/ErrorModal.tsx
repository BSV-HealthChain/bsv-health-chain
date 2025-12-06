interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center">
        <h3 className="text-xl font-bold text-red-600 mb-3">Error</h3>
        <p className="text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="mt-5 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}
