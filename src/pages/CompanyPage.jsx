import EmptyState from "../components/EmptyState.jsx";
import Icon from "../components/Icon.jsx";

export default function CompanyPage({ lang, text }) {
  const evidence = [
    { icon: "factory", zh: "工厂与生产", en: "Factory & Production" },
    { icon: "shield", zh: "证书与质量", en: "Certificates & Quality" },
    { icon: "book", zh: "专利与技术", en: "Patents & Technology" },
    { icon: "globe", zh: "出口与案例", en: "Markets & Cases" },
  ];

  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="site-container">
          <p className="eyebrow eyebrow--light">ABOUT HENGMAO</p>
          <h1>{text.nav.company}</h1>
          <p>
            {lang === "zh"
              ? "上海恒猫机电面向国内外客户提供清洁设备、配件和持续更新的产品支持。"
              : "Shanghai Hengmao Machinery provides cleaning equipment, accessories and maintainable product support for customers in China and overseas."}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="site-container company-intro">
          <div>
            <p className="eyebrow">OUR APPROACH</p>
            <h2>
              {lang === "zh"
                ? "把产品信息做得清楚、准确、可持续"
                : "Product information that stays clear, accurate and maintainable"}
            </h2>
          </div>
          <p>
            {lang === "zh"
              ? "当前先完成官网架构。工厂、证书、专利、案例和生产能力将在真实资料准备好后逐项补充。"
              : "The website architecture comes first. Factory, certificate, patent, case and capacity evidence will be added as verified materials become available."}
          </p>
        </div>
        <div className="site-container evidence-grid">
          {evidence.map((item) => (
            <article className="evidence-card" key={item.en}>
              <span><Icon name={item.icon} size={26} /></span>
              <h3>{item[lang]}</h3>
              <p>{text.pending}</p>
            </article>
          ))}
        </div>
        <div className="site-container section-spacer">
          <EmptyState
            lang={lang}
            title={lang === "zh" ? "企业影像与证明材料" : "Company media and evidence"}
            icon="factory"
          />
        </div>
      </section>
    </main>
  );
}
