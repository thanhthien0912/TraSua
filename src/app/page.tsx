export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-amber-50 px-5 py-12 sm:px-8 md:py-20">
      {/* Hero icon */}
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-100 text-5xl shadow-sm sm:h-28 sm:w-28 sm:text-6xl md:mb-8"
        aria-hidden="true"
      >
        🧋
      </div>

      {/* Heading */}
      <h1
        className="mb-4 text-center text-3xl font-bold tracking-tight text-amber-950 sm:text-4xl md:text-5xl"
        style={{ textWrap: "balance" }}
      >
        Chào mừng đến TraSua
      </h1>

      {/* Description */}
      <p
        className="mx-auto mb-8 max-w-md text-center text-base leading-relaxed text-amber-800/80 sm:text-lg md:mb-10 md:max-w-lg"
        style={{ textWrap: "pretty" }}
      >
        Hệ thống đặt món trà sữa dành cho quán — quản lý thực đơn, nhận đơn
        hàng và theo dõi doanh thu một cách dễ dàng.
      </p>

      {/* CTA placeholder */}
      <button
        type="button"
        className="inline-flex h-12 items-center justify-center rounded-xl bg-amber-900 px-7 text-sm font-semibold text-amber-50 transition-transform transition-colors duration-150 ease-out hover:bg-amber-800 active:scale-[0.96] sm:h-14 sm:px-9 sm:text-base"
      >
        Bắt đầu đặt món
      </button>

      {/* Feature hints */}
      <div className="mt-12 grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 md:mt-16">
        <FeatureCard emoji="📋" title="Thực đơn" desc="Quản lý món dễ dàng" />
        <FeatureCard emoji="🛒" title="Đặt hàng" desc="Nhận đơn nhanh chóng" />
        <FeatureCard
          emoji="📊"
          title="Thống kê"
          desc="Theo dõi doanh thu"
        />
      </div>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white/70 px-4 py-5 text-center shadow-sm backdrop-blur-sm sm:py-6">
      <span className="mb-2 text-2xl" aria-hidden="true">
        {emoji}
      </span>
      <h2 className="mb-1 text-sm font-semibold text-amber-950">{title}</h2>
      <p className="text-xs leading-relaxed text-amber-700/70">{desc}</p>
    </div>
  );
}
