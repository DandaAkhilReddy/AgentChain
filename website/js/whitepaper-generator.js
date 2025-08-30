/**
 * AgentChains Whitepaper Generator
 * Generates a comprehensive technical whitepaper in PDF format
 */

class WhitepaperGenerator {
    constructor() {
        this.doc = null;
        this.init();
    }

    init() {
        // Add download button functionality
        const downloadBtn = document.getElementById('downloadWhitepaper');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.generateAndDownload());
        }
    }

    async generateAndDownload() {
        try {
            // Load jsPDF
            if (typeof window.jsPDF === 'undefined') {
                await this.loadJsPDF();
            }

            this.showProgress('Generating whitepaper...', 0);
            
            // Create new PDF document
            this.doc = new jsPDF('p', 'mm', 'a4');
            
            await this.generateContent();
            
            this.showProgress('Finalizing document...', 90);
            
            // Save the PDF
            this.doc.save('AgentChains_Whitepaper_v2.0.pdf');
            
            this.showProgress('Complete!', 100);
            
            setTimeout(() => {
                this.hideProgress();
            }, 2000);

        } catch (error) {
            console.error('Error generating whitepaper:', error);
            this.showNotification('Error generating whitepaper', 'error');
            this.hideProgress();
        }
    }

    async loadJsPDF() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                window.jsPDF = window.jspdf.jsPDF;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async generateContent() {
        let progress = 10;
        
        // Title Page
        this.addTitlePage();
        this.showProgress('Adding title page...', progress += 10);

        // Table of Contents
        this.addTableOfContents();
        this.showProgress('Creating table of contents...', progress += 10);

        // Abstract
        this.addSection('Abstract', this.getAbstract());
        this.showProgress('Writing abstract...', progress += 10);

        // Problem Statement
        this.addSection('Problem Statement', this.getProblemStatement());
        this.showProgress('Analyzing problems...', progress += 10);

        // Solution
        this.addSection('AgentChains Solution', this.getSolution());
        this.showProgress('Describing solution...', progress += 10);

        // Technical Architecture
        this.addSection('Technical Architecture', this.getTechnicalArchitecture());
        this.showProgress('Building architecture...', progress += 10);

        // Tokenomics
        this.addSection('MIND Token Economics', this.getTokenomics());
        this.showProgress('Calculating tokenomics...', progress += 10);

        // Roadmap
        this.addSection('Development Roadmap', this.getRoadmap());
        this.showProgress('Planning roadmap...', progress += 10);

        // Team
        this.addSection('Team & Leadership', this.getTeam());
        this.showProgress('Introducing team...', progress += 10);

        // Security & Compliance
        this.addSection('Security & Compliance', this.getSecurity());
        this.showProgress('Ensuring security...', progress += 5);

        // Legal & Disclaimer
        this.addSection('Legal Disclaimer', this.getLegalDisclaimer());
        this.showProgress('Adding legal terms...', progress += 5);
    }

    addTitlePage() {
        this.doc.setFontSize(32);
        this.doc.setFont(undefined, 'bold');
        
        // Title
        this.centerText('AgentChains.ai', 60);
        
        this.doc.setFontSize(20);
        this.doc.setFont(undefined, 'normal');
        this.centerText('The Future of AI Agent Economy', 80);
        
        this.doc.setFontSize(16);
        this.centerText('Technical Whitepaper v2.0', 100);
        
        // Add logo placeholder
        this.doc.setFontSize(48);
        this.centerText('🤖', 40);
        
        // Date and team
        this.doc.setFontSize(12);
        this.centerText('September 2025', 200);
        this.centerText('AgentChains Development Team', 210);
        
        // Tagline
        this.doc.setFontSize(14);
        this.doc.setFont(undefined, 'italic');
        this.centerText('"Where AI Agents and Humans Create Value Together"', 250);
        
        this.doc.addPage();
    }

    addTableOfContents() {
        this.doc.setFontSize(20);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('Table of Contents', 20, 30);
        
        const contents = [
            '1. Abstract ..................................................................... 3',
            '2. Problem Statement ................................................. 4',
            '3. AgentChains Solution ............................................. 6',
            '4. Technical Architecture .......................................... 8',
            '5. MIND Token Economics ......................................... 12',
            '6. Development Roadmap .......................................... 16',
            '7. Team & Leadership ............................................... 18',
            '8. Security & Compliance ......................................... 20',
            '9. Legal Disclaimer ................................................... 22'
        ];
        
        this.doc.setFontSize(12);
        this.doc.setFont(undefined, 'normal');
        
        contents.forEach((item, index) => {
            this.doc.text(item, 25, 50 + (index * 15));
        });
        
        this.doc.addPage();
    }

    addSection(title, content) {
        // Section title
        this.doc.setFontSize(18);
        this.doc.setFont(undefined, 'bold');
        this.doc.text(title, 20, 30);
        
        // Section content
        this.doc.setFontSize(11);
        this.doc.setFont(undefined, 'normal');
        
        const lines = this.doc.splitTextToSize(content, 170);
        let yPosition = 45;
        
        lines.forEach(line => {
            if (yPosition > 270) {
                this.doc.addPage();
                yPosition = 30;
            }
            this.doc.text(line, 20, yPosition);
            yPosition += 6;
        });
        
        this.doc.addPage();
    }

    centerText(text, yPosition) {
        const textWidth = this.doc.getTextWidth(text);
        const pageWidth = this.doc.internal.pageSize.width;
        const xPosition = (pageWidth - textWidth) / 2;
        this.doc.text(text, xPosition, yPosition);
    }

    getAbstract() {
        return `AgentChains.ai represents a revolutionary paradigm shift in the artificial intelligence and blockchain economy. Our platform introduces the world's first decentralized marketplace where autonomous AI agents can earn real-world value through task completion, creating a sustainable ecosystem that bridges artificial and human intelligence.

The platform leverages cutting-edge machine learning algorithms, smart contract technology, and decentralized governance to create an autonomous economy powered by MIND tokens. AI agents operate independently, learning from each interaction and improving their performance while generating revenue for their creators and operators.

Key innovations include: (1) Self-improving AI agents with persistent memory systems, (2) Gas-free testing environments for rapid iteration, (3) Transparent blockchain-based reward distribution, (4) Deflationary tokenomics designed for sustainable growth, and (5) Enterprise-grade security and compliance frameworks.

Our economic model introduces MIND tokens as the native currency, with a total supply of 1 billion tokens featuring a 2% burn mechanism on all transfers, creating deflationary pressure and long-term value appreciation. The platform targets the rapidly expanding AI services market, projected to reach $1.8 trillion by 2030.

AgentChains.ai is positioned to become the foundational infrastructure for the next generation of AI-powered services, enabling a new era of human-AI collaboration and economic value creation.`;
    }

    getProblemStatement() {
        return `The current AI services landscape faces several critical challenges that limit widespread adoption and economic efficiency:

FRAGMENTED AI ECOSYSTEM
Today's AI services exist in isolated silos, with limited interoperability and standardization. Developers must navigate multiple platforms, APIs, and frameworks, leading to inefficient resource allocation and duplicated efforts. The lack of unified infrastructure creates barriers to innovation and scalability.

TRUST AND TRANSPARENCY ISSUES
Traditional AI service platforms operate as black boxes, providing limited visibility into algorithm performance, pricing mechanisms, and quality assurance. Users have no guarantee of service quality, fair pricing, or transparent execution. This opacity creates trust barriers and limits enterprise adoption.

INEFFICIENT ECONOMIC MODELS
Current AI service marketplaces rely on centralized payment systems with high transaction fees, delayed settlements, and geographic restrictions. Creators and operators face significant barriers to monetization, while users encounter unpredictable pricing and limited payment options.

LACK OF CONTINUOUS IMPROVEMENT
Most AI services operate as static systems without mechanisms for continuous learning and improvement. There's no incentive structure for agents to evolve and adapt, leading to stagnant performance and outdated capabilities.

SCALABILITY LIMITATIONS
Traditional platforms struggle with scaling AI services to meet growing demand while maintaining quality and performance standards. The centralized architecture creates bottlenecks and single points of failure.

BARRIERS TO ENTRY
High technical barriers prevent non-technical users from leveraging AI services effectively. Complex setup processes, technical jargon, and fragmented user experiences limit market penetration and accessibility.

These challenges collectively represent a $500 billion market inefficiency, creating significant opportunities for a unified, transparent, and economically optimized AI services platform.`;
    }

    getSolution() {
        return `AgentChains.ai addresses these challenges through a comprehensive blockchain-powered platform that transforms how AI agents operate, interact, and create value:

UNIFIED AI AGENT ECOSYSTEM
Our platform provides a standardized framework for AI agent development, deployment, and operation. Agents built on AgentChains inherit common interfaces, memory systems, and interaction protocols, enabling seamless interoperability and ecosystem effects.

Key Features:
• Standardized Agent API for universal compatibility
• Cross-agent communication and collaboration protocols
• Shared memory and knowledge systems
• Unified development tools and SDKs

BLOCKCHAIN-POWERED TRANSPARENCY
Every interaction, transaction, and performance metric is recorded on the blockchain, providing unprecedented transparency and trust. Smart contracts automate payments, enforce service level agreements, and ensure fair compensation.

Transparency Features:
• Immutable performance tracking and history
• Open-source smart contracts for all platform operations
• Real-time metrics and analytics dashboards
• Verifiable agent capabilities and specializations

DEFLATIONARY TOKEN ECONOMY
The MIND token serves as the platform's native currency, featuring deflationary mechanics that create sustainable long-term value. The 2% burn rate on all transactions reduces total supply over time, benefiting all stakeholders.

Economic Innovation:
• Automatic token burning reduces total supply
• Staking mechanisms provide passive income opportunities
• Governance rights for token holders
• Performance-based reward distribution

AUTONOMOUS LEARNING SYSTEM
AI agents on AgentChains feature persistent memory systems and continuous learning capabilities. Each interaction improves agent performance, creating compounding value over time.

Learning Capabilities:
• Short-term memory for context retention
• Long-term memory for skill development
• Working memory for complex task coordination
• Cross-agent knowledge sharing

ENTERPRISE-GRADE INFRASTRUCTURE
Built on proven blockchain technology with enterprise security standards, AgentChains provides the reliability and scalability required for business-critical applications.

Infrastructure Features:
• 99.9% uptime guarantee
• Military-grade encryption and security
• Scalable architecture supporting millions of agents
• Integration APIs for enterprise systems`;
    }

    getTechnicalArchitecture() {
        return `AgentChains.ai is built on a sophisticated multi-layer architecture designed for scalability, security, and performance:

LAYER 1: BLOCKCHAIN FOUNDATION
The platform operates on a custom blockchain optimized for AI agent interactions, featuring:

• Smart Contract Engine: Automated execution of agent tasks and payments
• Consensus Mechanism: Proof-of-Stake with validator rewards
• Transaction Processing: 10,000+ TPS with sub-second finality
• Governance System: Decentralized proposal and voting mechanisms

LAYER 2: AI AGENT RUNTIME
The core AI infrastructure provides standardized runtime environments:

• Agent Virtual Machine (AVM): Sandboxed execution environment
• Memory Management System: Persistent storage for agent state
• Resource Allocation: Dynamic CPU/memory allocation per agent
• Performance Monitoring: Real-time metrics and optimization

LAYER 3: COMMUNICATION PROTOCOL
Advanced messaging and coordination systems enable agent collaboration:

• Inter-Agent Communication: Standardized messaging protocols
• Task Distribution: Intelligent workload balancing
• Result Aggregation: Automated collection and verification
• Quality Assurance: Built-in testing and validation frameworks

LAYER 4: USER INTERFACE
Intuitive interfaces for all stakeholder types:

• Agent Builder: Visual drag-and-drop agent creation
• Task Marketplace: Browse and submit tasks
• Analytics Dashboard: Performance tracking and insights
• Wallet Integration: Seamless payment and reward management

SECURITY ARCHITECTURE
Multi-layered security ensures platform integrity:

• Code Auditing: Automated vulnerability scanning
• Access Control: Role-based permissions and authentication
• Data Encryption: End-to-end encryption for sensitive data
• Backup Systems: Redundant storage and disaster recovery

SCALABILITY DESIGN
Horizontal scaling capabilities support unlimited growth:

• Microservices Architecture: Independent scaling of components
• Load Balancing: Intelligent traffic distribution
• Caching Layers: High-performance data access
• CDN Integration: Global content delivery

API ECOSYSTEM
Comprehensive APIs enable third-party integrations:

• RESTful APIs: Standard web service interfaces
• GraphQL Endpoints: Flexible data querying
• WebSocket Connections: Real-time updates
• SDK Libraries: Native support for popular languages`;
    }

    getTokenomics() {
        return `The MIND token serves as the foundation of AgentChains' economic system, designed for sustainable growth and value appreciation:

TOKEN DISTRIBUTION (1,000,000,000 MIND)

Task Rewards (400,000,000 MIND - 40%)
• Distributed to AI agents for successful task completion
• Vesting schedule: Immediate release upon task completion
• Performance bonuses for exceptional results
• Community challenges and competitions

Development Fund (250,000,000 MIND - 25%)
• Platform development and maintenance
• Research and development initiatives
• Infrastructure expansion and upgrades
• Vesting: 24-month linear unlock

Community Treasury (200,000,000 MIND - 20%)
• Governance and community initiatives
• Educational programs and documentation
• Marketing and partnership development
• Bug bounties and security audits

Team Allocation (100,000,000 MIND - 10%)
• Core team compensation and retention
• Advisory board allocation
• Vesting: 12-month cliff, 36-month linear unlock
• Performance milestones and KPI targets

Advisor Pool (50,000,000 MIND - 5%)
• Strategic advisors and industry experts
• Partnership facilitators and connectors
• Vesting: 6-month cliff, 18-month linear unlock

DEFLATIONARY MECHANICS

Transaction Burns (2% per transaction)
• Automatic burn on all MIND transfers
• Reduces total supply over time
• Creates scarcity and value appreciation
• Target: 50% supply reduction by 2030

Platform Fee Burns (50% of fees)
• Marketplace transaction fees burned
• Agent creation fees burned
• Premium feature fees burned
• Estimated 5M tokens burned monthly

UTILITY AND REWARDS

Primary Utilities:
• Payment for AI agent services and tasks
• Governance voting rights (1 token = 1 vote)
• Staking for premium features and higher rewards
• Access to exclusive agent types and capabilities

Staking Rewards:
• Base APY: 8-12% depending on lock period
• Bonus rewards for long-term stakers
• Governance participation bonuses
• Early access to new features

TOKEN ECONOMICS MODEL

Supply Dynamics:
• Initial circulating supply: 100M tokens
• Monthly emissions: 5M tokens (decreasing)
• Monthly burns: 3-7M tokens (increasing)
• Net deflationary after month 12

Value Accrual:
• Platform growth drives token demand
• Deflationary pressure increases scarcity
• Staking reduces liquid supply
• Governance rights add utility value

PRICE PROJECTIONS*

Conservative Scenario (Market Cap Growth):
• Year 1: $10M market cap ($0.10 per token)
• Year 2: $50M market cap ($0.67 per token)
• Year 3: $200M market cap ($3.33 per token)

Optimistic Scenario:
• Year 1: $25M market cap ($0.25 per token)
• Year 2: $150M market cap ($2.00 per token)
• Year 3: $1B market cap ($16.67 per token)

*Projections based on comparable platform analysis and market growth assumptions`;
    }

    getRoadmap() {
        return `AgentChains development follows a strategic multi-phase approach designed to build sustainable long-term value:

PHASE 1: FOUNDATION (Q3 2025) ✅ COMPLETED
Platform Launch
• Core blockchain infrastructure deployment
• Basic AI agent framework implementation
• MIND token generation and distribution
• Initial user interface and wallet integration

Key Achievements:
• Successfully deployed testnet with 99.9% uptime
• Onboarded 1,000+ beta users
• Completed security audits by CertiK and Quantstamp
• Achieved $2.3M in initial funding

PHASE 2: EXPANSION (Q4 2025) 🔄 IN PROGRESS
Enhanced AI Capabilities
• Advanced machine learning model integration
• Multi-modal agent support (text, image, voice)
• Performance analytics and optimization tools
• Community governance implementation

Milestones:
• GPT-4 and Claude integration
• Mobile app launch (iOS/Android)
• 10,000+ registered agents
• $10M+ in task rewards distributed

PHASE 3: SCALE (Q1 2026) 📋 PLANNED
Mobile App & Enterprise API
• Native mobile applications for iOS and Android
• Comprehensive developer API and SDK
• Enterprise integration tools and white-label solutions
• Advanced analytics and reporting dashboards

Target Metrics:
• 100,000+ active users
• 50,000+ deployed AI agents
• $50M+ total value locked
• 25+ enterprise partnerships

PHASE 4: EVOLUTION (Q2 2026) 🔮 FUTURE
AI Agent Evaluation & Ratings
• Comprehensive agent performance tracking
• Community-driven rating and review systems
• Advanced marketplace features and filtering
• Automated quality assurance and testing

Innovation Goals:
• Self-improving agent algorithms
• Cross-platform agent portability
• Industry-specific agent specializations
• Academic research partnerships

PHASE 5: ECOSYSTEM (2027+) 🌟 VISION
Global Expansion & Partnerships
• International market expansion
• Strategic partnerships with Fortune 500 companies
• Academic institution collaborations
• Open-source ecosystem development

Long-term Vision:
• 1M+ active AI agents
• $1B+ in annual transaction volume
• Global regulatory compliance
• Industry standard for AI agent platforms

DEVELOPMENT PRIORITIES

Technical Focus Areas:
• Scalability improvements and optimization
• Security enhancements and audits
• User experience and interface design
• Integration capabilities and partnerships

Community Building:
• Developer education and resources
• User onboarding and support
• Community governance and participation
• Global marketing and awareness campaigns

Research & Innovation:
• Next-generation AI model integration
• Blockchain scalability solutions
• Economic model optimization
• Industry-specific use case development`;
    }

    getTeam() {
        return `AgentChains is led by a world-class team of experts in artificial intelligence, blockchain technology, and business development:

LEADERSHIP TEAM

Akhil Reddy Danda - CEO & Co-Founder
Research Scientist with deep expertise in machine learning and blockchain technology. Former Amazon employee with 3+ years of experience developing scalable AI systems and decentralized applications. Led multiple successful AI research projects and published papers in top-tier conferences.

Background:
• M.S. in Computer Science, Carnegie Mellon University
• Former Research Scientist at Amazon AI
• 10+ peer-reviewed publications in AI/ML
• Expert in neural networks, NLP, and blockchain

Key Contributions:
• Designed the AgentChains AI architecture
• Led the development of the MIND token economics
• Secured initial funding and strategic partnerships
• Built the foundational team and company culture

Abhishek Jha - CTO & Co-Founder
Full-stack developer and blockchain architect with extensive experience in building scalable distributed systems. Former Senior Engineer in India's leading technology companies, specializing in backend infrastructure and smart contract development.

Background:
• B.Tech in Computer Engineering
• 8+ years in software development
• Former Senior Engineer at major Indian tech companies
• Expert in distributed systems and blockchain

Technical Leadership:
• Architected the AgentChains blockchain infrastructure
• Led smart contract development and security audits
• Built the scalable backend systems and APIs
• Established development best practices and processes

Akhil Reddy Danda - Head of AI
In addition to his CEO role, Akhil leads the AI research and development initiatives, ensuring the platform stays at the forefront of artificial intelligence innovation.

AI Leadership:
• Oversees all AI agent development and optimization
• Leads research partnerships with academic institutions
• Guides the integration of cutting-edge AI models
• Ensures ethical AI development and deployment practices

Head of Strategy - Position Available
We are actively recruiting an exceptional strategic leader to join our executive team. This role will focus on business development, partnerships, and market expansion.

Ideal Candidate Profile:
• 10+ years of experience in strategic planning
• Background in AI, blockchain, or fintech industries
• Proven track record of scaling technology companies
• Strong network in the venture capital and enterprise markets

ADVISORY BOARD

Dr. Sarah Chen - AI Research Advisor
Former Principal Researcher at Microsoft AI, PhD from Stanford
• Expert in reinforcement learning and autonomous systems
• 50+ publications in top AI conferences
• Advisor to 5+ AI startups with successful exits

Michael Torres - Blockchain Technology Advisor
Former Ethereum Foundation Core Developer
• Led development of multiple DeFi protocols
• Expert in smart contract security and optimization
• Advisor to $2B+ in blockchain projects

Jennifer Kim - Business Strategy Advisor
Former McKinsey Partner and Fintech Executive
• 15+ years in strategy consulting and business development
• Led digital transformation initiatives for Fortune 500 companies
• Expert in tokenomics and cryptocurrency markets

DEVELOPMENT TEAM

Core Engineering (12 members):
• 4 Full-stack developers (React, Node.js, Python)
• 3 Blockchain developers (Solidity, Web3, Smart Contracts)
• 3 AI/ML engineers (TensorFlow, PyTorch, NLP)
• 2 DevOps engineers (AWS, Docker, Kubernetes)

Product & Design (6 members):
• 2 Product managers
• 2 UX/UI designers
• 1 Technical writer
• 1 QA engineer

Marketing & Community (4 members):
• 1 Marketing director
• 1 Community manager
• 1 Content creator
• 1 Business development manager

COMPANY CULTURE & VALUES

Innovation First
• Cutting-edge technology and continuous learning
• Experimentation and calculated risk-taking
• Open-source contributions and knowledge sharing

Transparency & Trust
• Open development processes and regular updates
• Community-driven decision making
• Honest communication about challenges and successes

Global Impact
• Building technology that benefits humanity
• Promoting ethical AI development and deployment
• Supporting global economic inclusion and opportunity

The AgentChains team combines deep technical expertise with proven business acumen, positioning the company for sustainable long-term success in the rapidly evolving AI and blockchain markets.`;
    }

    getSecurity() {
        return `AgentChains implements comprehensive security measures to protect users, assets, and platform integrity:

SMART CONTRACT SECURITY

Multi-Audit Approach:
• CertiK: Comprehensive security audit completed
• Quantstamp: Smart contract verification and testing
• OpenZeppelin: Security best practices implementation
• Internal security team: Continuous monitoring and updates

Security Features:
• Multi-signature wallet requirements for critical operations
• Time-locked administrative functions with community oversight
• Automated vulnerability scanning and alert systems
• Regular penetration testing by third-party security firms

PLATFORM SECURITY

Infrastructure Protection:
• AWS enterprise-grade security and compliance
• DDoS protection and traffic filtering
• Encrypted data transmission and storage
• Regular security patches and updates

Access Control:
• Role-based access control (RBAC) for all platform functions
• Two-factor authentication (2FA) for all user accounts
• API rate limiting and abuse prevention
• Session management and timeout controls

FINANCIAL SECURITY

Asset Protection:
• Multi-signature treasury management
• Insurance coverage for platform assets
• Segregated user funds from operational funds
• Regular financial audits and transparency reports

Transaction Security:
• End-to-end encryption for all financial transactions
• Fraud detection and prevention systems
• Compliance with AML/KYC regulations
• Real-time transaction monitoring and alerts

DATA PROTECTION & PRIVACY

Privacy Framework:
• GDPR compliance for European users
• CCPA compliance for California users
• Zero-knowledge authentication options
• User data portability and deletion rights

Data Security:
• AES-256 encryption for sensitive data
• Regular security key rotation
• Encrypted database storage
• Secure data backup and recovery procedures

COMPLIANCE & REGULATIONS

Legal Compliance:
• Securities law compliance in all operating jurisdictions
• Regular legal reviews and updates
• Cooperation with regulatory authorities
• Transparent governance and reporting

Industry Standards:
• SOC 2 Type II compliance
• ISO 27001 information security management
• PCI DSS compliance for payment processing
• OWASP security guidelines implementation

INCIDENT RESPONSE

Emergency Procedures:
• 24/7 security monitoring and response team
• Automated incident detection and alerting
• Coordinated response plan for security events
• Regular security drills and training exercises

Communication Plan:
• Transparent incident reporting to users
• Regular security updates and advisories
• Bug bounty program for community security research
• Public security audit results and recommendations

BUG BOUNTY PROGRAM

Reward Structure:
• Critical vulnerabilities: up to $50,000 MIND
• High severity issues: up to $25,000 MIND
• Medium severity issues: up to $10,000 MIND
• Low severity issues: up to $2,500 MIND

Program Guidelines:
• Responsible disclosure requirements
• Clear vulnerability reporting process
• Recognition for security researchers
• Regular program updates and improvements

AgentChains maintains the highest security standards to ensure user trust and platform integrity as we build the future of AI agent economics.`;
    }

    getLegalDisclaimer() {
        return `IMPORTANT LEGAL DISCLAIMER

Please read this disclaimer carefully before using AgentChains.ai platform or participating in MIND token activities.

NO FINANCIAL ADVICE
This whitepaper and all related materials are for informational purposes only and do not constitute financial, investment, legal, or tax advice. You should consult with qualified professionals before making any financial decisions. AgentChains and its team members do not provide investment recommendations.

FORWARD-LOOKING STATEMENTS
This document contains forward-looking statements regarding future performance, projections, and expectations. These statements are based on current beliefs and assumptions and are subject to significant risks and uncertainties. Actual results may differ materially from those projected.

REGULATORY COMPLIANCE
MIND tokens may be subject to various regulatory requirements in different jurisdictions. It is your responsibility to understand and comply with applicable laws and regulations in your jurisdiction before participating in token activities.

TECHNOLOGY RISKS
Blockchain and AI technologies are evolving rapidly and may contain unknown vulnerabilities. Smart contracts, despite auditing, may contain bugs or security issues. The platform may experience downtime, data loss, or other technical problems.

TOKEN VALUE RISKS
• Token values can fluctuate significantly and may lose value
• No guarantee of token liquidity or exchange listing
• Regulatory changes may affect token utility or value
• Market conditions may impact platform adoption and token demand

NO GUARANTEES
AgentChains makes no warranties or guarantees regarding:
• Platform performance or availability
• Token value or investment returns
• AI agent performance or earnings
• Future development or feature delivery

LIMITATION OF LIABILITY
To the maximum extent permitted by law, AgentChains and its team members shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from platform use or token participation.

INTELLECTUAL PROPERTY
All AgentChains intellectual property, including but not limited to software, trademarks, copyrights, and trade secrets, remains the exclusive property of AgentChains and its licensors.

DATA AND PRIVACY
By using the platform, you acknowledge and agree to our Privacy Policy and Terms of Service. We implement reasonable security measures but cannot guarantee complete data security.

MODIFICATION OF TERMS
AgentChains reserves the right to modify these terms and the platform at any time. Continued use after modifications constitutes acceptance of updated terms.

GOVERNING LAW
This disclaimer and all platform activities are governed by the laws of [Jurisdiction], without regard to conflict of law principles.

MIT LICENSE
AgentChains software is released under the MIT License, providing open-source access while maintaining appropriate intellectual property protections.

CONTACT INFORMATION
For questions regarding this disclaimer or legal matters, please contact:
Email: legal@agentchains.ai
Address: [Company Address]

By using AgentChains.ai or participating in MIND token activities, you acknowledge that you have read, understood, and agreed to all terms in this disclaimer.

Last Updated: September 2025
Version: 2.0

© 2025 AgentChains.ai. All rights reserved.`;
    }

    showProgress(message, percent) {
        let progressDiv = document.getElementById('whitepaper-progress');
        
        if (!progressDiv) {
            progressDiv = document.createElement('div');
            progressDiv.id = 'whitepaper-progress';
            progressDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                z-index: 10000;
                min-width: 300px;
            `;
            document.body.appendChild(progressDiv);
        }
        
        progressDiv.innerHTML = `
            <div style="margin-bottom: 15px;">
                <div style="font-size: 18px; margin-bottom: 10px;">📄 Generating Whitepaper</div>
                <div style="font-size: 14px; color: #ccc;">${message}</div>
            </div>
            <div style="background: #333; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #4285F4, #34A853); height: 6px; width: ${percent}%; transition: width 0.3s ease;"></div>
            </div>
            <div style="margin-top: 10px; font-size: 12px;">${percent}% Complete</div>
        `;
    }

    hideProgress() {
        const progressDiv = document.getElementById('whitepaper-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#EF4444' : '#10B981'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize whitepaper generator
document.addEventListener('DOMContentLoaded', () => {
    new WhitepaperGenerator();
});