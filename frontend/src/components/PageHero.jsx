export default function PageHero({ eyebrow, title, children }) {
  return (
    <section className="blueprint-grid px-5 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-wide text-caution">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">{title}</h1>
        {children ? <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-100">{children}</p> : null}
      </div>
    </section>
  );
}
