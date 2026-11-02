import { useOutletContext } from 'react-router-dom';
import { TeamCard, TestimonialCard } from '../components/Cards.jsx';
import PageHero from '../components/PageHero.jsx';
import { ListSection } from '../components/States.jsx';
import { useFetch, usePageMeta } from '../lib/hooks.js';

export default function Team() {
  const { companyName } = useOutletContext();
  usePageMeta(`Team | ${companyName}`, `Meet the engineers and managers at ${companyName}.`);

  const team = useFetch('/api/company/team/?page_size=100');
  const testimonials = useFetch('/api/company/testimonials/?page_size=100');
  const members = team.data?.results || [];
  const clientQuotes = testimonials.data?.results || [];

  return (
    <>
      <PageHero eyebrow="Team" title="The people behind the work">
        Engineers and managers who are responsible for each project.
      </PageHero>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <h2 className="sr-only">Team members</h2>
        <ListSection loading={team.loading} error={team.error} isEmpty={members.length === 0} emptyText="Team profiles will be added soon.">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => <TeamCard key={member.id} member={member} />)}
          </div>
        </ListSection>
      </section>

      {clientQuotes.length > 0 ? (
        <section className="bg-white px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-black text-graphite">What clients say</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {clientQuotes.map((item) => <TestimonialCard key={item.id} testimonial={item} />)}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
