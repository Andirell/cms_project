import { useOutletContext } from 'react-router-dom';
import { ServiceCard } from '../components/Cards.jsx';
import PageHero from '../components/PageHero.jsx';
import { ListSection } from '../components/States.jsx';
import { useFetch, usePageMeta } from '../lib/hooks.js';

export default function Services() {
  const { companyName } = useOutletContext();
  usePageMeta(`Services | ${companyName}`, `Engineering services offered by ${companyName}.`);

  const { data, loading, error } = useFetch('/api/company/services/?page_size=100');
  const services = data?.results || [];

  return (
    <>
      <PageHero eyebrow="Services" title="Engineering services">
        What we can do for your project, from early planning to delivery on site.
      </PageHero>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <h2 className="sr-only">All services</h2>
        <ListSection loading={loading} error={error} isEmpty={services.length === 0} emptyText="Services will be listed here soon.">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => <ServiceCard key={service.id} service={service} />)}
          </div>
        </ListSection>
      </section>
    </>
  );
}
