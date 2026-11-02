import { Link, useOutletContext } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PostCard, ProjectCard, ServiceCard, TestimonialCard } from '../components/Cards.jsx';
import { ListSection } from '../components/States.jsx';
import { splitLines } from '../lib/format.js';
import { useFetch, usePageMeta } from '../lib/hooks.js';

function Section({ eyebrow, title, linkTo, linkText, children, background = 'bg-paper' }) {
  return (
    <section className={`${background} px-5 py-20 sm:px-8`}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-clay">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-black text-graphite sm:text-4xl">{title}</h2>
          </div>
          {linkTo ? (
            <Link to={linkTo} className="inline-flex items-center gap-2 font-bold text-blueprint underline">
              {linkText} <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

// Every figure here comes from the CMS. A figure with no data is left out, not made up.
function CompanyFacts({ profile, completedCount }) {
  const facts = [];
  if (profile?.years_in_operation) {
    facts.push([`${profile.years_in_operation}`, 'years in operation']);
  }
  if (completedCount > 0) {
    facts.push([`${completedCount}`, completedCount === 1 ? 'completed project' : 'completed projects']);
  }

  const certifications = splitLines(profile?.certifications);

  if (facts.length === 0 && certifications.length === 0) return null;

  return (
    <div className="mt-10 flex flex-wrap gap-4">
      {facts.map(([value, label]) => (
        <div key={label} className="min-w-40 rounded-md border border-white/30 bg-blueprint/80 px-5 py-4">
          <p className="text-3xl font-black text-caution">{value}</p>
          <p className="mt-1 text-sm text-white">{label}</p>
        </div>
      ))}
      {certifications.length > 0 ? (
        <div className="rounded-md border border-white/30 bg-blueprint/80 px-5 py-4">
          <p className="text-sm font-bold text-caution">Certifications</p>
          <ul className="mt-1 text-sm text-white">
            {certifications.map((certification) => <li key={certification}>{certification}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function Home() {
  const { profile, companyName } = useOutletContext();
  usePageMeta(companyName, profile?.tagline || profile?.about);

  const services = useFetch('/api/company/services/?page_size=4');
  const projects = useFetch('/api/projects/?page_size=3');
  const completedProjects = useFetch('/api/projects/?status=completed&page_size=1');
  const testimonials = useFetch('/api/company/testimonials/?page_size=2');
  const posts = useFetch('/api/blog/?page_size=3');

  return (
    <>
      <section className="blueprint-grid px-5 py-24 text-white sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <h1 className="max-w-4xl text-5xl font-black leading-tight sm:text-6xl">{companyName}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-100 sm:text-xl">
            {profile?.tagline || profile?.about || 'Engineering services, from first drawings to final handover.'}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-caution px-6 py-3.5 font-black text-graphite hover:bg-yellow-400"
            >
              Discuss a project <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link
              to="/projects"
              className="inline-flex items-center justify-center rounded-md border border-white/60 px-6 py-3.5 font-bold text-white hover:bg-white/10"
            >
              View projects
            </Link>
          </div>
          <CompanyFacts profile={profile} completedCount={completedProjects.data?.count || 0} />
        </div>
      </section>

      <Section eyebrow="Services" title="What we do" linkTo="/services" linkText="All services">
        <ListSection
          loading={services.loading}
          error={services.error}
          isEmpty={!services.data?.results?.length}
          emptyText="Services will be listed here soon."
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.data?.results?.map((service) => <ServiceCard key={service.id} service={service} />)}
          </div>
        </ListSection>
      </Section>

      <Section eyebrow="Projects" title="Selected work" linkTo="/projects" linkText="All projects" background="bg-white">
        <ListSection
          loading={projects.loading}
          error={projects.error}
          isEmpty={!projects.data?.results?.length}
          emptyText="Projects will be listed here soon."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {projects.data?.results?.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>
        </ListSection>
      </Section>

      {testimonials.data?.results?.length ? (
        <Section eyebrow="Clients" title="What clients say">
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.data.results.map((item) => <TestimonialCard key={item.id} testimonial={item} />)}
          </div>
        </Section>
      ) : null}

      {posts.data?.results?.length ? (
        <Section eyebrow="Blog" title="Latest articles" linkTo="/blog" linkText="All articles" background="bg-white">
          <div className="grid gap-6 lg:grid-cols-3">
            {posts.data.results.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </Section>
      ) : null}
    </>
  );
}
