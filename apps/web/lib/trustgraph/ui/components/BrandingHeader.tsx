type Props = {
  name: string;
  branding: { logoUrl: string | null; primaryColor: string | null; displayLabel: string | null };
};

export function BrandingHeader({ name, branding }: Props) {
  return (
    <header className="mb-6 flex flex-col gap-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
      {branding.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={branding.logoUrl} alt="" className="h-10 w-auto object-contain" />
      ) : null}
      <h1 className="text-xl font-semibold" style={{ color: branding.primaryColor ?? undefined }}>
        {branding.displayLabel ?? name}
      </h1>
    </header>
  );
}
