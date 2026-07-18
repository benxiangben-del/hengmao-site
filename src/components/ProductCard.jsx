import { localizePath, SiteLink } from "../app/router.jsx";
import Icon from "./Icon.jsx";

export default function ProductCard({ product, lang, text, router }) {
  return (
    <article className="product-card">
      <div className="product-card-media">
        <span className="status-badge">{text.demo}</span>
        <img src={product.image} alt={product.name[lang]} />
      </div>
      <div className="product-card-body">
        <p className="eyebrow">{product.category[lang]}</p>
        <h3>{product.name[lang]}</h3>
        <p className="product-model">{product.model}</p>
        <p>{product.summary[lang]}</p>
        <SiteLink className="text-link" to={localizePath(lang, `products/${product.slug}`)} router={router}>{text.viewDetails}<Icon name="arrow" size={18} /></SiteLink>
      </div>
    </article>
  );
}
