export default function InvoiceNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0b] px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />

      <div className="inline-block rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-6"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        404
      </div>
      <h1 className="text-[32px] font-medium tracking-[-0.02em] text-white mb-3"
        style={{ fontFamily: "'Playfair Display', serif" }}>
        Invoice not found
      </h1>
      <p className="text-[14px] text-white/40 max-w-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        This invoice may have been removed or the link is no longer valid.
      </p>
      <a href="/" className="mt-8 inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/70"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Go to Clinch
      </a>
    </div>
  );
}
