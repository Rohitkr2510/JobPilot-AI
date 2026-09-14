import { MasterCandidateProfile, JobOpportunity, ScoringWeights } from '../types';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  technical: 35,
  experience: 25,
  cloud: 15,
  cicd: 10,
  seniority: 5,
  location: 5,
  certification: 5
};

export const MASTER_PROFILE: MasterCandidateProfile = {
  name: "Rohit Kumar Mahato",
  targetRole: "DevOps Engineer / Release Engineer / Cloud Platform Engineer",
  email: "kr.rohit3343@gmail.com",
  phone: "+91 93345 93935",
  location: "Bangalore, India",
  portfolioUrl: "https://github.com/Rohitkr2510",
  linkedinUrl: "https://www.linkedin.com/in/rohitkr25/",
  githubUrl: "https://github.com/Rohitkr2510/",
  leetcodeUrl: "https://leetcode.com/u/Rohitkr2510/",
  credlyUrl: "https://www.credly.com/badges/a430887f-a205-409e-a764-a7972f31b0d0/linked_in_profile",
  projects: [
    {
      title: "Face Recognition DevOps Pipeline",
      repoUrl: "https://github.com/Rohitkr2510/face-recognition-devops",
      description: "End-to-end containerized CI/CD pipeline and automated deployment workflow for deep learning face recognition microservices."
    },
    {
      title: "Auto-WCEBleedGen Challenge",
      repoUrl: "https://github.com/Rohitkr2510/Auto-WCEBleedGen-Challenge",
      description: "Automated medical imaging detection and bleeding frame classification pipeline with Dockerized reproducible environments."
    }
  ],
  currentCompany: "Tata Consultancy Services (TCS)",
  currentRole: "DevOps Engineer",
  currentExperiencePeriod: "April 2025 – Present",
  previousCompany: "Celebrare",
  previousRole: "Python Developer",
  previousExperiencePeriod: "February 2024 – March 2025",
  totalExperienceYears: 2.8,
  highestDegree: "B.Tech in Computer Science & Engineering",
  university: "Jawaharlal Nehru University",
  cgpa: "8.57 / 10.0",
  certification: "AWS Certified Solutions Architect – Associate (SAA-C03)",
  noticePeriod: "30 Days (Negotiable / Early release possible)",
  expectedSalary: "₹18,00,000 - ₹22,00,000 INR (Open to competitive market offers)",
  workAuthorization: "Indian Citizen (Authorized to work full-time without sponsorship)",
  relocation: "Open to Bangalore, Hyderabad, Pune, or Remote worldwide",
  skills: {
    cloud: ["AWS", "Amazon EC2", "Amazon VPC", "AWS IAM", "Amazon S3", "Amazon EKS", "Amazon CloudWatch", "Route 53", "Application Load Balancer (ALB)"],
    containers: ["Docker", "Kubernetes", "Amazon EKS", "Helm", "Container Security", "Image Optimization"],
    cicd: ["Jenkins", "Jenkins Shared Libraries", "Groovy DSL", "GitHub Actions", "GitLab CI", "Automated Testing Integration"],
    iac: ["Terraform", "Terraform Cloud", "HCL", "Infrastructure as Code", "State Management", "Terraform Plan Automation"],
    scripting: ["Python", "Groovy", "Bash / Shell Scripting", "Linux Administration", "RESTful APIs"],
    security: ["DevSecOps", "Checkmarx SAST", "Orca Security", "Trivy Container Scanning", "Vulnerability Remediations", "Secret Scanning"],
    releaseManagement: ["Plutora", "Jira", "Confluence", "Release Governance", "Change Advisory Board (CAB)", "Deployment Playbooks"],
    monitoring: ["Amazon CloudWatch", "Prometheus", "Grafana", "Log Analytics", "Alerting & On-call Escalations"]
  },
  verifiedAchievements: [
    {
      id: "ach-1",
      category: "cicd",
      bullet: "Architected and standardized 25+ automated Jenkins CI/CD declarative pipelines leveraging custom Groovy Shared Libraries across multi-branch workflows, cutting manual release intervention to zero.",
      metrics: "25+ Jenkins Pipelines, 100% CI automation",
      verified: true
    },
    {
      id: "ach-2",
      category: "cloud_iac",
      bullet: "Engineered modular Terraform configurations for automated AWS provisioning (VPC, IAM, EKS, S3, RDS), reducing infrastructure-related deployment failures by 95% with strict plan verification and automated rollbacks.",
      metrics: "95% reduction in deployment failures",
      verified: true
    },
    {
      id: "ach-3",
      category: "release",
      bullet: "Streamlined release governance and deployment coordination across 15+ engineering microservices in Plutora and Jira, cutting average release cycle time by 40% (from 4.0 hours to 2.4 hours).",
      metrics: "40% faster release cycle time",
      verified: true
    },
    {
      id: "ach-4",
      category: "monitoring",
      bullet: "Established unified telemetry utilizing AWS CloudWatch and Prometheus/Grafana dashboards for EKS clusters, reducing Mean Time to Resolution (MTTR) by 50% for production incidents.",
      metrics: "50% reduction in MTTR",
      verified: true
    },
    {
      id: "ach-5",
      category: "security",
      bullet: "Enforced end-to-end DevSecOps policies by integrating Checkmarx SAST scans and Orca Security container vulnerability gates into GitHub Actions pipelines, preventing critical CVEs from staging deployments.",
      metrics: "Zero high-severity CVEs in production",
      verified: true
    },
    {
      id: "ach-6",
      category: "python",
      bullet: "At Celebrare: Built asynchronous Python backend microservices, RESTful API integrations, and data processing automation, boosting pipeline throughput by 35%.",
      metrics: "35% throughput increase",
      verified: true
    }
  ]
};

export const INITIAL_JOBS: JobOpportunity[] = [];
export const ROHIT_CANDIDATE_PROFILE = MASTER_PROFILE;
export const SEED_JOBS: JobOpportunity[] = [];

export const DEFAULT_RAW_RESUME_TEXT = `ROHIT KUMAR MAHATO
DevOps Engineer | AWS Certified Solutions Architect – Associate
Email: kr.rohit3343@gmail.com | Phone: +91 93345 93935 | Location: Bangalore, India
LinkedIn: https://www.linkedin.com/in/rohitkr25/ | GitHub: https://github.com/Rohitkr2510/ | LeetCode: https://leetcode.com/u/Rohitkr2510/
AWS Credly Badge: https://www.credly.com/badges/a430887f-a205-409e-a764-a7972f31b0d0/linked_in_profile

PROFESSIONAL SUMMARY
DevOps & Cloud Release Engineer with AWS Solutions Architect certification and 2.8+ years of enterprise experience automating CI/CD pipelines, scaling Amazon EKS Kubernetes workloads, and provisioning modular Terraform infrastructure. Proven track record at Tata Consultancy Services (TCS) standardizing 25+ Jenkins declarative pipelines, eliminating 95% of infrastructure deployment failures, and accelerating release turnaround cycles by 40%.

WORK EXPERIENCE
DevOps Engineer | Tata Consultancy Services (TCS)
April 2025 – Present | Bangalore, India
• Architected and standardized 25+ automated Jenkins CI/CD declarative pipelines leveraging custom Groovy Shared Libraries across multi-branch workflows, cutting manual release intervention to zero.
• Engineered modular Terraform configurations for automated AWS provisioning (VPC, IAM, EKS, S3, RDS), reducing infrastructure-related deployment failures by 95% with strict plan verification and automated rollbacks.
• Streamlined release governance and deployment coordination across 15+ engineering microservices in Plutora and Jira, cutting average release cycle time by 40% (from 4.0 hours to 2.4 hours).
• Established unified telemetry utilizing AWS CloudWatch and Prometheus/Grafana dashboards for EKS clusters, reducing Mean Time to Resolution (MTTR) by 50% for production incidents.
• Enforced end-to-end DevSecOps policies by integrating Checkmarx SAST scans and Orca Security container vulnerability gates into GitHub Actions pipelines, preventing critical CVEs from staging deployments.

Python Developer | Celebrare
February 2024 – March 2025 | Remote
• Developed scalable backend microservices, asynchronous task queues, and REST APIs using Python (FastAPI/Django) and PostgreSQL, serving 150k+ active users.
• Containerized core services with Docker and optimized multi-stage build images, reducing container footprint by 55%.
• Automated daily batch data pipelines with Bash and Python scripts, boosting pipeline throughput by 35% and saving 15 manual engineering hours weekly.

FEATURED PROJECTS
• Face Recognition DevOps Pipeline (https://github.com/Rohitkr2510/face-recognition-devops): End-to-end CI/CD automation and containerized deployment for deep learning models.
• Auto-WCEBleedGen Challenge (https://github.com/Rohitkr2510/Auto-WCEBleedGen-Challenge): Automated medical image detection and classification framework with Docker workflows.

TECHNICAL SKILLS
• Cloud & Infrastructure: AWS (Amazon EC2, Amazon VPC, AWS IAM, Amazon S3, Amazon EKS, Amazon CloudWatch, Route 53, ALB), Microsoft Azure
• Containerization & Orchestration: Docker, Kubernetes, Amazon EKS, Helm, Container Security, Image Optimization
• CI/CD & Automation: Jenkins, Jenkins Shared Libraries, Groovy DSL, GitHub Actions, GitLab CI, Automated Testing Integration
• Infrastructure as Code: Terraform, Terraform Cloud, HCL, Infrastructure as Code, State Management, Plan Verification, Bash
• DevSecOps & Security: DevSecOps, Checkmarx SAST, Orca Security, Trivy Container Scanning, Vulnerability Remediations, Secret Scanning
• Release Management: Plutora, Jira, Confluence, Release Governance, Change Advisory Board (CAB), Deployment Playbooks
• Scripting & Languages: Python, Groovy, Bash / Shell Scripting, Linux Administration, RESTful APIs
• Monitoring & Observability: Amazon CloudWatch, Prometheus, Grafana, Log Analytics, Alerting & On-call Escalations

EDUCATION & CERTIFICATIONS
• AWS Certified Solutions Architect – Associate (SAA-C03) (Credly: https://www.credly.com/badges/a430887f-a205-409e-a764-a7972f31b0d0/linked_in_profile)
• B.Tech in Computer Science & Engineering | Jawaharlal Nehru University | CGPA: 8.57 / 10.0
• Notice Period: 30 Days (Negotiable) | Expected CTC: ₹18,00,000 - ₹22,00,000 INR`;
