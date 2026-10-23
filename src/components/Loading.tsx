export default function Loading({ text = 'جاري التحميل...' }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-2 border-[#333]"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#c99649] animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#c99649]/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        <p className="text-gray-400 text-sm">{text}</p>
      </div>
    </div>
  );
}
