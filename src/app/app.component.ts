import { Component } from '@angular/core';

interface SkillGroup {
  category: string;
  items: string[];
}

interface Experience {
  title: string;
  company: string;
  period: string;
  summary: string;
  bullets: string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent {
  readonly name = 'Vu Dang';
  readonly role = 'Senior Software Engineer';
  readonly tagline = 'Fullstack — React, Next.js, TypeScript, NestJS';
  readonly location = 'Ho Chi Minh City, Vietnam';
  readonly phone = '+84 918 536 550';
  readonly email = 'dtvu94@gmail.com';
  readonly linkedin = 'https://www.linkedin.com/in/vu-dang-9871b6101/';

  readonly summary =
    'Senior Software Engineer with 7+ years of experience building production-grade web applications and cloud-native services. Proven hands-on expertise in React, Next.js, TypeScript, with strong foundations in microservices architecture, Turborepo monorepos, and Kubernetes-based deployments. Skilled in CI/CD, application security (OWASP, CVE remediation), and cross-functional collaboration with international teams. Passionate about delivering scalable, observable, and resilient systems.';

  readonly skills: SkillGroup[] = [
    {
      category: 'Frontend',
      items: ['React', 'Next.js (App Router, SSR/SSG/ISR)', 'TypeScript', 'Redux Toolkit', 'Tailwind CSS', 'styled-components', 'ECharts', 'react-pdf', 'Three.js'],
    },
    {
      category: 'Backend',
      items: ['Node.js', 'NestJS', 'REST API design', 'OpenAPI / Swagger', 'WebSocket / Socket.io'],
    },
    {
      category: 'Architecture',
      items: ['Microservices', 'Turborepo', 'Lerna', 'npm workspaces'],
    },
    {
      category: 'Databases & ORM',
      items: ['MongoDB', 'MySQL', 'Redis', 'TypeORM'],
    },
    {
      category: 'Messaging',
      items: ['RabbitMQ', 'Redis Pub/Sub'],
    },
    {
      category: 'Cloud & DevOps',
      items: ['AWS (ECR, ECS)', 'Kubernetes', 'OpenShift', 'Helm', 'Docker', 'Jenkins', 'GitLab CI', 'Bash'],
    },
    {
      category: 'Auth & Security',
      items: ['OIDC', 'OAuth2', 'Keycloak', 'SonarQube', 'OWASP ZAP', 'Snyk', 'GitHub Dependabot'],
    },
    {
      category: 'Testing',
      items: ['Jest', 'React Testing Library', 'Postman', 'Selenium'],
    },
    {
      category: 'Languages',
      items: ['JavaScript / TypeScript (expert)', 'Python', 'C#', 'C++'],
    },
    {
      category: 'Tools',
      items: ['Git', 'Jira', 'Confluence', 'Figma'],
    },
  ];

  readonly experience: Experience[] = [
    {
      title: 'Senior Software Engineer',
      company: 'Bridgetek',
      period: 'May 2023 – Present',
      summary:
        'Lead full-stack development for the Panl product suite (Desk Manager, Room Manager, Smart Living) — on-premises enterprise solutions for workplace management and IoT-enabled facility monitoring.',
      bullets: [
        'Built modern Panl web applications with <strong>Next.js (App Router, SSR/SSG/ISR)</strong>, <strong>TypeScript</strong>, <strong>React</strong>, <strong>Redux Toolkit</strong>, and <strong>Tailwind CSS</strong>, replacing legacy on-premises UI.',
        'Implemented <strong>OIDC authentication</strong> flow in Panl Desk Manager, integrating with Azure AD to replace legacy session-based auth.',
        'Hardened application security through automated <strong>OWASP ZAP</strong> and <strong>SonarQube</strong> scans, reducing critical/high CVEs by 80% over 3 years.',
        "Migrated Panl Room Manager's legacy Outlook Add-In to the modern <strong>Office.js Web Add-In</strong> framework, enabling cross-platform support (Windows, Mac, Web).",
        "Built Panl Smart Living's Web Management Console with <strong>ECharts</strong> for real-time IoT sensor data visualization; integrated with the company IoT Portal.",
        'Designed and built the <strong>Reports module</strong> with dynamic PDF generation via <em>react-pdf</em>.',
        'Wrote unit and integration tests with <strong>Jest</strong> and <strong>React Testing Library</strong> to maintain quality across the codebase.',
        'Established end-to-end <strong>CI/CD pipelines</strong> using Jenkins and GitLab with Docker-based builds and automated deployments to OpenShift.',
        'Created a GUI-based Ubuntu installer (Whiptail + Bash) to streamline customer on-premises deployments.',
        'Mentored team members on coding standards, security best practices, and architectural reviews; authored internal technical documentation.',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'mesoneer',
      period: 'May 2020 – April 2023',
      summary:
        'Contributed to ubichat (messaging platform) and ubibot (chatbot platform) — a Rocket.Chat- and Jitsi-Meet-based system setting a new standard for Swiss e-banking, serving 100,000 users across 3 Swiss financial institutions.',
      bullets: [
        'Enhanced and migrated ubichat features including conversation archiving (PDF export), Keycloak-based OIDC authorization, and notification queueing.',
        'Developed ubichat–ubibot backend integrations including action-triggered bot flows and scheduled bot flows.',
        'Refactored monolithic Meteor codebase into multiple thoroughly tested packages using <strong>Turborepo</strong> monorepo tooling and <strong>TypeScript</strong>, applying service simulation to improve modularity and test coverage.',
        'Enhanced CI/CD using Jenkins jobs, Docker images, and Helm charts deployed to Kubernetes clusters.',
        'Eliminated security vulnerabilities through weekly Docker scanning, AWS ECR scanning, and OWASP Top Ten pen-testing — averaging 50% of detected CVEs remediated each month.',
        'Collaborated daily with international (Swiss) engineering team in English.',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'KMS Technology',
      period: 'July 2019 – May 2020',
      summary: 'Developed services and user interfaces for a hotel booking platform and inventory management system.',
      bullets: [
        'Applied <strong>microservice principles</strong> in central reservation system (CRS) integration.',
        'Optimized SQL queries and schema design for high-throughput inventory operations.',
        'Built automated test suites with Postman and Selenium.',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'FPT-Software',
      period: 'May 2018 – July 2019',
      summary: 'Integrated machine learning models trained by Data Analyst teams into customer-facing web applications.',
      bullets: [
        'Developed web applications and APIs that consumed <strong>ML model outputs</strong> to deliver real-time predictions.',
        'Optimized C++ training pipeline code for improved model training performance.',
        'Collaborated cross-functionally with <strong>AI / Data teams</strong> to define model input/output contracts and integration patterns.',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'Shinkawa',
      period: 'November 2017 – April 2018',
      summary: 'Developed software features for industrial wire-bonding machines used in semiconductor manufacturing.',
      bullets: [
        'Built embedded software features with strict safety, precision, and reliability requirements.',
        'Cultivated attention to detail and structured time-management practices.',
      ],
    },
  ];

  readonly education = {
    degree: 'Bachelor of Computer Science',
    school: 'University of Science (HCMUS)',
    period: '2012 – 2018',
    gpa: '3.0 / 4.0',
  };

  readonly languages = [
    { name: 'English', level: 'Fluent — read, write, speak. 3+ years working with Swiss and international teams.' },
    { name: 'Vietnamese', level: 'Native.' },
  ];
}
