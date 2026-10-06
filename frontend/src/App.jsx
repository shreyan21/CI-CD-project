import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  AlertTriangle,
  Box,
  Braces,
  Cloud,
  Database,
  ExternalLink,
  Mail,
  MapPin,
  ServerCog,
  ShieldCheck,
  Settings,
  Terminal,
} from "lucide-react";
import GlowGrid from "./components/GlowGrid.jsx";
import SectionTitle from "./components/SectionTitle.jsx";
import { API_URL } from "./lib/api.js";
const fallback = {
  profile: {
    name: "Utkarsh Singh Rajawat",
    headline: "Cloud Support • Linux • APIs • DevOps in progress",
    location: "Lucknow, India",
    summary:
      "Technical support and backend professional with nearly 2 years of relevant experience troubleshooting Linux-based services, REST APIs, PostgreSQL workflows and automated jobs. I am now turning that operations foundation into hands-on DevOps and cloud engineering proof.",
    email: "rajawatshrayansh@gmail.com",
    linkedin: "https://linkedin.com/in/utkarsh-singh-rajawat",
    github: "https://github.com/shreyan21",
  },
  skills: [
    { category: "Cloud", name: "AWS EC2", level: "Working knowledge" },
    { category: "Cloud", name: "IAM", level: "Working knowledge" },
    { category: "Cloud", name: "S3", level: "Working knowledge" },
    { category: "Cloud", name: "EBS", level: "Working knowledge" },
    { category: "Systems", name: "Linux / Unix", level: "Developing" },
    { category: "Containers", name: "Docker", level: "Hands-on" },
    { category: "Version Control", name: "Git / GitHub", level: "Hands-on" },
    { category: "Backend", name: "Node.js / Express", level: "Hands-on" },
    { category: "Data", name: "PostgreSQL / PostGIS", level: "Hands-on" },
    { category: "APIs", name: "REST / HTTP / JSON", level: "Hands-on" },
  ],
  experience: [
    {
      company:
        "Remote Sensing Applications Centre (RSAC), Govt. of Uttar Pradesh",
      role: "Project Scientist – API & Production Support",
      period: "09/2025 – Present",
      location: "Lucknow, India",
      bullets: [
        "Support Linux-based Node.js/Express APIs and PostgreSQL/PostGIS workflows covering 100+ mining-site records.",
        "Investigate incidents across API, database, background jobs and Linux services using logs, SQL and service checks.",
        "Trace REST/JSON requests end-to-end, reproduce failures and separate application, data and service issues before escalation.",
      ],
    },
    {
      company: "Cognizant",
      role: "Programmer Analyst Trainee",
      period: "10/2022 – 07/2023",
      location: "India",
      bullets: [
        "Completed approximately 9 months of enterprise engineering training in JavaScript, Node.js, PostgreSQL, REST APIs, debugging and Git.",
        "Built and debugged REST endpoints and payloads using SQL and application analysis.",
      ],
    },
    {
      company: "Cognizant",
      role: "Technology Intern",
      period: "03/2022 – 08/2022",
      location: "India",
      bullets: [
        "Completed 6 months of structured training in programming, relational databases and software debugging.",
      ],
    },
  ],
  certifications: [
    "Introduction to IT & AWS Cloud — Coursera / AWS (2026)",
    "Postman API Fundamentals Student Expert (2024)",
    "SQL Intermediate — HackerRank (2024)",
    "AWS CLF-C02 Exam Preparation — In Progress",
  ],
};

function iconFor(category) {
  const key = category.toLowerCase();
  if (key.includes("cloud")) return <Cloud size={18} />;
  if (key.includes("system")) return <Terminal size={18} />;
  if (key.includes("container")) return <Box size={18} />;
  if (key.includes("data")) return <Database size={18} />;
  if (key.includes("backend") || key.includes("api"))
    return <Braces size={18} />;
  return <ServerCog size={18} />;
}

export default function App() {
  const [err, setErr] = useState("");
  const [data, setData] = useState(fallback);
  const [dataSource, setDataSource] = useState("loading");
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.18]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch(`${API_URL}/profile`, { signal: controller.signal }).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
      fetch(`${API_URL}/skills`, { signal: controller.signal }).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
      fetch(`${API_URL}/experience`, { signal: controller.signal }).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
      fetch(`${API_URL}/certifications`, { signal: controller.signal }).then(
        (r) => (r.ok ? r.json() : Promise.reject()),
      ),
    ])
      .then(([profile, skills, experience, certifications]) => {
        setErr("");
        console.log(err);
        setData({
          profile,
          skills,
          experience,
          certifications: certifications.map((c) => c.title),
        });
        setDataSource("live");
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;

        console.error("API request failed:", error);

        setErr("Live data unavailable. Showing fallback data.");
        setData(fallback);
        setDataSource("fallback");
      });
    return () => controller.abort();
  }, []);

  const groupedSkills = useMemo(() => {
    return data.skills.reduce((acc, skill) => {
      acc[skill.category] = acc[skill.category] || [];
      acc[skill.category].push(skill);
      return acc;
    }, {});
  }, [data.skills]);

  return (
    <main>
      {err && (
      <div
        role="alert"
        style={{
          background: "#fff3cd",
          color: "#856404",
          padding: "12px",
          textAlign: "center",
        }}
      >
        {err}
      </div>
      )}
      <GlowGrid />
      <nav className="nav-shell">
        <a className="brand" href="#top">
          USR<span>.</span>
        </a>
        <div className="nav-links">
          <a href="#experience">Experience</a>
          <a href="#skills">Skills</a>
          <a href="#project">Project</a>
          <a className="nav-cta" href={`mailto:${data.profile.email}`}>
            Contact <ArrowUpRight size={15} />
          </a>
        </div>
      </nav>
      <section id="top" className="hero" ref={heroRef}>
        <motion.div
          className="hero-inner"
          style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="status-pill"
          >
            <span className="status-dot" /> Building production-minded Cloud &
            DevOps systems
          </motion.div>

          <div className="hero-grid">
            <div>
              <p className="hero-kicker">HELLO, I’M</p>
              <h1>{data.profile.name}</h1>
              <p className="hero-headline">{data.profile.headline}</p>
              <p className="hero-summary">{data.profile.summary}</p>

              <div className="hero-actions">
                <a className="btn-primary" href="#project">
                  See what I’m building <ArrowUpRight size={17} />
                </a>
                <a
                  className="btn-secondary"
                  href={data.profile.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Braces size={17} /> GitHub
                </a>
              </div>

              <div className="mini-meta">
                <span>
                  <MapPin size={15} /> {data.profile.location}
                </span>
                <a
                  href={data.profile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={15} /> LinkedIn
                </a>
              </div>
            </div>

            <motion.div
              className="hero-console"
              initial={{ opacity: 0, x: 28, rotate: 1.5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              <div className="console-top">
                <span />
                <span />
                <span />
                <b>platform.log</b>
              </div>
              <div className="console-body">
                <p>
                  <i>$</i> whoami
                </p>
                <p className="console-result">
                  cloud-support → devops/platform
                </p>
                <p>
                  <i>$</i> current-focus
                </p>
                <p className="console-result">
                  linux · docker · aws · terraform · ci/cd
                </p>
                <p>
                  <i>$</i> operating-model
                </p>
                <p className="console-result success">
                  evidence → hypothesis → fix → verify
                </p>
                <p>
                  <i>$</i> availability
                </p>
                <p className="console-result">
                  open to relocation across Europe
                </p>
                <div className="cursor-row">
                  <i>$</i>
                  <span className="cursor" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>
      <section className="metrics-band">
        <div>
          <strong>100+</strong>
          <span>records supported</span>
        </div>
        <div>
          <strong>4</strong>
          <span>incident layers investigated</span>
        </div>
        <div>
          <strong>2 yrs</strong>
          <span>relevant technical experience</span>
        </div>
        <div>
          <strong>1 goal</strong>
          <span>be independently useful</span>
        </div>
      </section>
      <section id="experience" className="section-shell">
        <SectionTitle
          eyebrow="EXPERIENCE"
          title="Operations experience that transfers into platform engineering."
          copy="I work closest to the failure path: APIs, services, jobs, databases and the evidence needed to get them healthy again."
        />
        <div className="stack-wrap">
          {data.experience.map((item, index) => (
            <motion.article
              key={`${item.company}-${item.role}`}
              className="stack-card"
              style={{ top: `${110 + index * 22}px` }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
            >
              <div className="stack-index">0{index + 1}</div>
              <div>
                <div className="exp-topline">
                  <span>{item.period}</span>
                  <span>{item.location}</span>
                </div>
                <h3>{item.role}</h3>
                <h4>{item.company}</h4>
                <ul>
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
      <section id="skills" className="section-shell">
        <SectionTitle
          eyebrow="STACK"
          title="Tools I can explain, use and keep extending."
          copy="The database powers this section so new skills can be added over time without hard-coding the frontend."
        />
        {dataSource === "fallback" ? (
          <div className="data-source-notice" role="status">
            <AlertTriangle size={17} /> Live portfolio data is unavailable.
            Showing the last verified local profile.
          </div>
        ) : null}
        <div className="skill-grid">
          {Object.entries(groupedSkills).map(([category, skills], index) => (
            <motion.div
              key={category}
              className="skill-card"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
            >
              <div className="skill-card-title">
                {iconFor(category)}
                <span>{category}</span>
              </div>
              <div className="skill-list">
                {skills.map((skill) => (
                  <span key={skill.id || skill.name}>
                    {skill.name}
                    <small>{skill.level}</small>
                    {skill.proficiency !== null &&
                    skill.proficiency !== undefined ? (
                      <span
                        className="skill-proficiency"
                        title={`${skill.proficiency}% proficiency`}
                        aria-label={`${skill.proficiency}% proficiency`}
                      >
                        <i style={{ width: `${skill.proficiency}%` }} />
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      <section id="project" className="project-section">
        <div className="project-shell">
          <div className="project-copy">
            <span className="eyebrow">FLAGSHIP BUILD</span>
            <h2>This portfolio is also the DevOps project.</h2>
            <p>
              The application is intentionally full-stack: React on the
              frontend, Express on the backend and PostgreSQL as the source of
              truth. The next engineering layer is the real portfolio proof —
              Docker, GitHub Actions, Terraform, AWS ECR/EC2, monitoring,
              rollback and documented incidents.
            </p>
            <div className="architecture-line">
              <span>React</span>
              <b>→</b>
              <span>Express API</span>
              <b>→</b>
              <span>PostgreSQL</span>
              <b>→</b>
              <span>Docker</span>
              <b>→</b>
              <span>AWS</span>
            </div>
            <div className="project-points">
              <div>
                <ShieldCheck size={20} />
                <span>
                  <strong>Professional evidence</strong> Every added capability
                  is visible in code, Git history and docs.
                </span>
              </div>
              <div>
                <ServerCog size={20} />
                <span>
                  <strong>Operations-first</strong> Health checks, logs,
                  deployment verification and rollback matter as much as UI.
                </span>
              </div>
              <div>
                <Cloud size={20} />
                <span>
                  <strong>Cloud-ready</strong> Built to become your Docker → ECR
                  → EC2 → CloudWatch showcase.
                </span>
              </div>
            </div>
          </div>

          <div className="project-visual">
            <div className="node node-react">React</div>
            <div className="line l1" />
            <div className="node node-api">Express</div>
            <div className="line l2" />
            <div className="node node-db">Postgres</div>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="floating-tag t1">Docker</div>
            <div className="floating-tag t2">CI/CD</div>
            <div className="floating-tag t3">Terraform</div>
            <div className="floating-tag t4">AWS</div>
          </div>
        </div>
      </section>
      <section className="section-shell certifications-section">
        <SectionTitle
          eyebrow="LEARNING"
          title="Credentials and structured learning."
        />
        <div className="cert-list">
          {data.certifications.map((cert, index) => (
            <motion.div
              key={cert}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <span>0{index + 1}</span>
              <p>{cert}</p>
              <ExternalLink size={17} />
            </motion.div>
          ))}
        </div>
      </section>
      <footer>
        <div>
          <span className="eyebrow">LET’S CONNECT</span>
          <h2>Building toward Cloud & Platform Engineering.</h2>
        </div>
        <div className="footer-links">
          <a href={`mailto:${data.profile.email}`}>
            <Mail size={18} /> Email
          </a>
          <a href={data.profile.linkedin} target="_blank" rel="noreferrer">
            <ExternalLink size={18} /> LinkedIn
          </a>
          <a href={data.profile.github} target="_blank" rel="noreferrer">
            <Braces size={18} /> GitHub
          </a>
          <a href="/admin">
            <Settings size={18} /> Admin
          </a>
        </div>
      </footer>
    </main>
  );
}
