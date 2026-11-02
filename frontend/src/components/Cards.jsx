import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Star } from 'lucide-react';
import { capitalize, formatDate, formatProjectDates } from '../lib/format.js';
import ContentImage from './ContentImage.jsx';

export function ProjectCard({ project }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg bg-white shadow-lift">
      <ContentImage src={project.image} className="aspect-[5/3] w-full" />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase">
          <span className="rounded bg-blueprint px-2 py-1 text-white">{capitalize(project.discipline)}</span>
          <span className="rounded bg-moss px-2 py-1 text-white">{capitalize(project.status)}</span>
        </div>
        <h3 className="mt-4 text-xl font-bold text-graphite">
          <Link to={`/projects/${project.slug}`} className="hover:underline">{project.title}</Link>
        </h3>
        {project.location ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={15} aria-hidden="true" /> {project.location}
          </p>
        ) : null}
        <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <CalendarDays size={15} aria-hidden="true" /> {formatProjectDates(project)}
        </p>
      </div>
    </article>
  );
}

export function ServiceCard({ service }) {
  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-lift">
      <ContentImage src={service.image} className="aspect-[4/3] w-full" />
      <div className="p-6">
        <h3 className="text-xl font-bold text-graphite">{service.title}</h3>
        <p className="mt-3 text-sm leading-6 text-gray-600">{service.description}</p>
      </div>
    </article>
  );
}

export function TeamCard({ member }) {
  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-lift">
      <ContentImage src={member.photo} alt={member.name} className="aspect-[4/3] w-full" />
      <div className="p-6">
        <h3 className="text-xl font-bold text-graphite">{member.name}</h3>
        <p className="mt-1 text-sm font-semibold text-clay">{member.role}</p>
        {member.bio ? <p className="mt-3 text-sm leading-6 text-gray-600">{member.bio}</p> : null}
      </div>
    </article>
  );
}

export function TestimonialCard({ testimonial }) {
  const stars = [];
  for (let number = 0; number < testimonial.rating; number += 1) {
    stars.push(<Star key={number} size={17} fill="currentColor" aria-hidden="true" />);
  }

  return (
    <figure className="rounded-lg bg-white p-7 shadow-lift">
      <div className="flex gap-1 text-clay" role="img" aria-label={`Rated ${testimonial.rating} out of 5`}>
        {stars}
      </div>
      <blockquote className="mt-5 text-lg leading-8 text-graphite">"{testimonial.quote}"</blockquote>
      <figcaption className="mt-5 border-t border-concrete pt-4">
        <p className="font-bold text-graphite">{testimonial.client_name}</p>
        {testimonial.project_name ? <p className="mt-1 text-sm text-gray-600">{testimonial.project_name}</p> : null}
      </figcaption>
    </figure>
  );
}

export function PostCard({ post }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg bg-white shadow-lift">
      <ContentImage src={post.image} className="aspect-[16/9] w-full" />
      <div className="p-6">
        <p className="text-sm font-semibold text-clay">{formatDate(post.published_at)}</p>
        <h3 className="mt-2 text-xl font-bold text-graphite">
          <Link to={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link>
        </h3>
        {post.excerpt ? <p className="mt-3 text-sm leading-6 text-gray-600">{post.excerpt}</p> : null}
        <p className="mt-4 text-sm font-semibold text-gray-600">{post.author}</p>
      </div>
    </article>
  );
}
