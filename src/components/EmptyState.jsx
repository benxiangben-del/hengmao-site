import Icon from "./Icon.jsx";

export default function EmptyState({ lang, title, icon = "book" }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name={icon} size={24} /></span>
      <div>
        <h3>{title}</h3>
        <p>{lang === "zh" ? "该模块已经预留，资料准备好后可在后台补充。" : "This module is ready and can be populated in the CMS when verified content becomes available."}</p>
      </div>
    </div>
  );
}
