export default function BrandMark({ brand, inverse = false }) {
  return (
    <span className={`brand-mark${inverse ? " brand-mark--inverse" : ""}`} aria-label={brand.zhName}>
      <span className="brand-symbol" aria-hidden="true"><i>H</i><i>M</i></span>
      <span className="brand-wording">
        <strong>{brand.wordmark}</strong>
        <small>{brand.zhName}</small>
      </span>
    </span>
  );
}
