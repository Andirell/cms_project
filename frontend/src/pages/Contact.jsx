import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Send } from 'lucide-react';
import ContactDetails from '../components/ContactDetails.jsx';
import { FormField, inputClass } from '../components/FormField.jsx';
import PageHero from '../components/PageHero.jsx';
import { ErrorMessage, SuccessMessage } from '../components/States.jsx';
import { apiRequest } from '../lib/api.js';
import { useFetch, usePageMeta } from '../lib/hooks.js';

const EMPTY_FORM = {
  full_name: '',
  email: '',
  phone: '',
  service_interest: '',
  message: '',
};

export default function Contact() {
  const { profile, companyName } = useOutletContext();
  usePageMeta(`Contact | ${companyName}`, `Get in touch with ${companyName} about your project.`);

  const services = useFetch('/api/company/services/?page_size=100');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sending, setSending] = useState(false);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    setErrors({});
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiRequest('/api/company/contact/', { method: 'POST', body: form, useAuth: false });
      setForm(EMPTY_FORM);
      setSuccessMessage('Thanks. Your message has been sent and the team will reply soon.');
    } catch (requestError) {
      setErrors(requestError.fieldErrors || {});
      setErrorMessage(requestError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHero eyebrow="Contact" title="Tell us about your project">
        Share the basics and the right engineer will get back to you.
      </PageHero>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="text-2xl font-black text-graphite">Reach us directly</h2>
          <div className="mt-5 text-gray-800">
            <ContactDetails profile={profile} />
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-4 rounded-lg bg-white p-5 shadow-lift sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" error={errors.full_name}>
              <input
                value={form.full_name}
                onChange={(event) => setField('full_name', event.target.value)}
                required
                autoComplete="name"
                className={inputClass}
              />
            </FormField>
            <FormField label="Email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
                required
                autoComplete="email"
                className={inputClass}
              />
            </FormField>
            <FormField label="Phone (optional)" error={errors.phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
                autoComplete="tel"
                className={inputClass}
              />
            </FormField>
            <FormField label="Service (optional)" error={errors.service_interest}>
              <select
                value={form.service_interest}
                onChange={(event) => setField('service_interest', event.target.value)}
                className={inputClass}
              >
                <option value="">Select a service</option>
                {services.data?.results?.map((service) => (
                  <option key={service.id} value={service.title}>{service.title}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Message" error={errors.message}>
            <textarea
              value={form.message}
              onChange={(event) => setField('message', event.target.value)}
              required
              rows={6}
              className={inputClass}
            />
          </FormField>

          <ErrorMessage>{errorMessage}</ErrorMessage>
          <SuccessMessage>{successMessage}</SuccessMessage>

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-graphite px-6 py-3.5 font-bold text-white hover:bg-blueprint disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send message'} <Send size={17} aria-hidden="true" />
          </button>
        </form>
      </section>
    </>
  );
}
