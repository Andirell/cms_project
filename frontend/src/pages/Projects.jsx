import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ProjectCard } from '../components/Cards.jsx';
import { inputClass } from '../components/FormField.jsx';
import PageHero from '../components/PageHero.jsx';
import { ErrorMessage, ListSection } from '../components/States.jsx';
import { apiRequest, withParams } from '../lib/api.js';
import { DISCIPLINES, PROJECT_STATUSES } from '../lib/format.js';
import { usePageMeta } from '../lib/hooks.js';

const PAGE_SIZE = 12;

export default function Projects() {
  const { companyName } = useOutletContext();
  usePageMeta(`Projects | ${companyName}`, `Completed, ongoing and planned engineering projects by ${companyName}.`);

  const [discipline, setDiscipline] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // If the filters change while this request is running, its answer is out of date.
    let isOutdated = false;

    async function loadProjects() {
      setLoading(true);
      setError('');

      try {
        const path = withParams('/api/projects/', { discipline, status, page, page_size: PAGE_SIZE });
        const response = await apiRequest(path, { useAuth: false });
        if (isOutdated) return;

        setTotalCount(response.count);
        if (page === 1) {
          setProjects(response.results);
        } else {
          setProjects((current) => [...current, ...response.results]);
        }
      } catch (requestError) {
        if (!isOutdated) setError(requestError.message);
      } finally {
        if (!isOutdated) setLoading(false);
      }
    }

    loadProjects();

    return () => {
      isOutdated = true;
    };
  }, [discipline, status, page, retryCount]);

  function changeDiscipline(event) {
    setDiscipline(event.target.value);
    setPage(1);
  }

  function changeStatus(event) {
    setStatus(event.target.value);
    setPage(1);
  }

  // After a failed load the same page is asked for again, so nothing gets skipped.
  function loadNextPage() {
    const nextPage = Math.floor(projects.length / PAGE_SIZE) + 1;
    if (nextPage === page) {
      setRetryCount(retryCount + 1);
    } else {
      setPage(nextPage);
    }
  }

  const showFirstLoad = loading && projects.length === 0;

  return (
    <>
      <PageHero eyebrow="Projects" title="Our project portfolio">
        Completed work, active sites and planned projects across every discipline.
      </PageHero>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <h2 className="sr-only">All projects</h2>
        <div className="mb-8 flex flex-wrap items-end gap-4">
          <label className="block w-full sm:w-56">
            <span className="mb-1.5 block text-sm font-semibold text-gray-800">Discipline</span>
            <select value={discipline} onChange={changeDiscipline} className={inputClass}>
              <option value="">All disciplines</option>
              {DISCIPLINES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="block w-full sm:w-56">
            <span className="mb-1.5 block text-sm font-semibold text-gray-800">Status</span>
            <select value={status} onChange={changeStatus} className={inputClass}>
              <option value="">All statuses</option>
              {PROJECT_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <p role="status" className="py-2.5 text-sm font-semibold text-gray-700">
            {loading ? 'Loading...' : `Showing ${projects.length} of ${totalCount}`}
          </p>
        </div>

        <ListSection
          loading={showFirstLoad}
          error={projects.length === 0 ? error : ''}
          isEmpty={projects.length === 0}
          emptyText="No projects match these filters yet."
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>

          {projects.length < totalCount ? (
            <div className="mt-10 text-center">
              <div className="mb-4">
                <ErrorMessage>{error}</ErrorMessage>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={loadNextPage}
                className="rounded-md bg-graphite px-6 py-3 font-bold text-white hover:bg-blueprint disabled:opacity-50"
              >
                Load more projects
              </button>
            </div>
          ) : null}
        </ListSection>
      </section>
    </>
  );
}
