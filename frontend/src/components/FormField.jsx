import { useState } from 'react';
import { assetUrl } from '../lib/api.js';

export const inputClass =
  'min-h-11 w-full rounded-md border border-gray-400 bg-white px-3 py-2.5 text-graphite focus:border-blueprint';

export function FormField({ label, error, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-gray-800">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-gray-600">{hint}</span> : null}
      {error ? <span role="alert" className="mt-1 block text-sm font-semibold text-danger">{error}</span> : null}
    </label>
  );
}

export function TextField({ label, form, name, required, type = 'text', hint }) {
  return (
    <FormField label={label} error={form.errors[name]} hint={hint}>
      <input
        type={type}
        value={form.values[name] ?? ''}
        onChange={(event) => form.setValue(name, event.target.value)}
        required={required}
        className={inputClass}
      />
    </FormField>
  );
}

export function TextAreaField({ label, form, name, required, rows = 5, hint }) {
  return (
    <FormField label={label} error={form.errors[name]} hint={hint}>
      <textarea
        value={form.values[name] ?? ''}
        onChange={(event) => form.setValue(name, event.target.value)}
        required={required}
        rows={rows}
        className={inputClass}
      />
    </FormField>
  );
}

export function SelectField({ label, form, name, options }) {
  return (
    <FormField label={label} error={form.errors[name]}>
      <select
        value={form.values[name] ?? ''}
        onChange={(event) => form.setValue(name, event.target.value)}
        className={inputClass}
      >
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>{optionLabel}</option>
        ))}
      </select>
    </FormField>
  );
}

export function CheckboxField({ label, form, name, hint }) {
  return (
    <div>
      <label className="flex items-center gap-3 text-sm font-semibold text-gray-800">
        <input
          type="checkbox"
          checked={Boolean(form.values[name])}
          onChange={(event) => form.setValue(name, event.target.checked)}
          className="h-5 w-5"
        />
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs text-gray-600">{hint}</p> : null}
    </div>
  );
}

export function ImageField({ label, form, name }) {
  const value = form.values[name];
  const [originalValue] = useState(value);
  const hasSavedImage = typeof value === 'string' && value !== '';

  return (
    <FormField label={label} error={form.errors[name]} hint="PNG, JPG or WebP, 5 MB at most.">
      {hasSavedImage ? (
        <img src={assetUrl(value)} alt="Current upload" className="mb-2 h-28 w-40 rounded object-cover" />
      ) : null}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        // Browsers can empty this input when the picker is cancelled. That puts the
        // original back, because a value of null means "remove the image".
        onChange={(event) => form.setValue(name, event.target.files[0] || originalValue)}
        className={inputClass}
      />
      {hasSavedImage ? (
        <button
          type="button"
          onClick={() => form.setValue(name, null)}
          className="mt-2 text-sm font-semibold text-danger underline"
        >
          Remove image
        </button>
      ) : null}
    </FormField>
  );
}
