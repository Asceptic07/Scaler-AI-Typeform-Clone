import Link from "next/link";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Typeform Clone workspace">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <span>
        typeform<span className="brand-clone">clone</span>
      </span>
    </Link>
  );
}
