import Link from "next/link";

const topics = [
  {
    title: "Warranty",
    description:
      "Check your device warranty status, coverage period and eligibility.",
    icon: "✓",
    href: "/warranty",
  },
   {
    title: "Live Chat",
    description:
      "Chat with our warranty assistant and get quick answers to your questions.",
    icon: "💬",
    href: "/contact/chat",
  },
  {
    title: "Warranty Claim",
    description:
      "Submit a warranty claim and understand the steps involved.",
    icon: "▤",
    href: "/warranty-claim",
  },
  {
    title: "Product Registration",
    description:
      "Register your boAt device and keep your product information organized.",
    icon: "◉",
    href: "/account",
  },
  {
    title: "Repair",
    description:
      "Find repair options and get support for devices outside warranty.",
    icon: "⌁",
    href: "/repair",
  },
  {
    title: "Replacement",
    description:
      "Learn about replacement eligibility and the replacement process.",
    icon: "↻",
    href: "/warranty-claim",
  },
  {
    title: "Payment",
    description:
      "Get help with warranty extensions, repairs and payment-related queries.",
    icon: "₹",
    href: "/extend-warranty",
  },
];

export default function HelpPage() {
  return (
    <main className="page help-page">
      <section className="container">

        <div className="page-heading">
          <span className="hero-label">
            SUPPORT CENTER
          </span>

          <h1 className="page-title">
            How can we help?
          </h1>

          <p className="page-subtitle">
            Find answers, warranty information and support
            for your boAt device.
          </p>
        </div>

        <div className="help-grid">
          {topics.map((topic) => (
            <article
              className="help-card"
              key={topic.title}
            >
              <div className="help-card-icon">
                {topic.icon}
              </div>

              <div className="help-card-content">
                <h2>{topic.title}</h2>

                <p>{topic.description}</p>

                <Link href={topic.href} className="help-card-link">
                  Learn More
                  <span>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

      </section>
    </main>
  );
}