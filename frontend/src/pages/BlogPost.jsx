import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ContentImage from '../components/ContentImage.jsx';
import PageHero from '../components/PageHero.jsx';
import { ErrorMessage, LoadingMessage } from '../components/States.jsx';
import { formatDate, splitParagraphs } from '../lib/format.js';
import { useFetch, usePageMeta } from '../lib/hooks.js';
import NotFound from './NotFound.jsx';

export default function BlogPost() {
  const { slug } = useParams();
  const { companyName } = useOutletContext();
  const { data: post, loading, error, notFound } = useFetch(`/api/blog/by-slug/${slug}/`);

  usePageMeta(post ? `${post.title} | ${companyName}` : `Blog | ${companyName}`, post?.excerpt);

  if (loading && !post) return <LoadingMessage />;
  if (notFound) return <NotFound />;
  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    );
  }

  return (
    <>
      <PageHero eyebrow={formatDate(post.published_at)} title={post.title} />
      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        {post.image ? <ContentImage src={post.image} alt="" className="mb-8 aspect-[16/9] w-full rounded-lg" /> : null}
        <p className="font-semibold text-gray-700">By {post.author}</p>
        <div className="mt-6 grid gap-5 text-lg leading-8 text-gray-800">
          {splitParagraphs(post.content).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <Link to="/blog" className="mt-10 inline-flex items-center gap-2 font-bold text-blueprint underline">
          <ArrowLeft size={17} aria-hidden="true" /> All articles
        </Link>
      </article>
    </>
  );
}
