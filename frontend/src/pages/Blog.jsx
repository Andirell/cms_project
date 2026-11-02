import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PostCard } from '../components/Cards.jsx';
import PageHero from '../components/PageHero.jsx';
import { ListSection } from '../components/States.jsx';
import { useFetch, usePageMeta } from '../lib/hooks.js';

const PAGE_SIZE = 12;

export default function Blog() {
  const { companyName } = useOutletContext();
  usePageMeta(`Blog | ${companyName}`, `Articles and project notes from ${companyName}.`);

  const [page, setPage] = useState(1);
  const { data, loading, error } = useFetch(`/api/blog/?page=${page}&page_size=${PAGE_SIZE}`);
  const posts = data?.results || [];

  return (
    <>
      <PageHero eyebrow="Blog" title="Articles and project notes">
        Lessons from site work, engineering decisions and company news.
      </PageHero>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <h2 className="sr-only">All articles</h2>
        <ListSection loading={loading && !data} error={error} isEmpty={posts.length === 0} emptyText="Articles will appear here soon.">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>

          <div className="mt-10 flex justify-center gap-3">
            {data?.previous ? (
              <button type="button" onClick={() => setPage(page - 1)} className="rounded-md border border-gray-400 px-5 py-2.5 font-bold text-graphite">
                Newer articles
              </button>
            ) : null}
            {data?.next ? (
              <button type="button" onClick={() => setPage(page + 1)} className="rounded-md border border-gray-400 px-5 py-2.5 font-bold text-graphite">
                Older articles
              </button>
            ) : null}
          </div>
        </ListSection>
      </section>
    </>
  );
}
